import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

const PREVIEW_BACKGROUNDS = [
  { name: "Black", color: "#050505" },
  { name: "Charcoal", color: "#1b1b1b" },
  { name: "Cream", color: "#f6efe6" },
  { name: "White", color: "#ffffff" },
];

const DEFAULT_POSITIONS = {
  top: { x: 0, y: 0, scale: 1 },
  bottom: { x: 0, y: 0, scale: 1 },
};

const SKIN_TONES = [
  { type: "I", label: "Very Fair", color: "#F6D8C8", hue: 0, brightness: 1.12 },
  { type: "II", label: "Fair", color: "#EFC0A4", hue: -4, brightness: 1.04 },
  { type: "III", label: "Medium", color: "#C6865A", hue: -8, brightness: 0.98 },
  { type: "IV", label: "Olive", color: "#A86F45", hue: -10, brightness: 0.92 },
  { type: "V", label: "Brown", color: "#7A4A2E", hue: -15, brightness: 0.76 },
  { type: "VI", label: "Deep", color: "#4A2A1A", hue: -18, brightness: 0.62 },
];

const normalize = (value) => String(value || "").trim().toLowerCase();

const getProductImage = (item) => {
  if (item?.outfitImage) return item.outfitImage;
  if (Array.isArray(item?.images) && item.images.length > 0) return item.images[0];
  if (Array.isArray(item?.image) && item.image.length > 0) return item.image[0];
  if (typeof item?.images === "string") return item.images;
  if (typeof item?.image === "string") return item.image;
  return "/placeholder.png";
};

const getFinalPrice = (item) => {
  const price = Number(item?.price || 0);
  const salePercent = Number(item?.salePercent || 0);

  if (item?.onSale && salePercent > 0) {
    return Math.max(price - (price * salePercent) / 100, 0);
  }

  return price;
};

const getSmartLayout = ({ selectedBottom }) => {
  const category = normalize(selectedBottom?.category);

  const isPants = category.includes("pants") || category.includes("jeans");
  const isJorts = category.includes("jorts");

  return {
    top: {
      top: 82,
      height: 245,
      width: 320,
      scale: 1,
      snapX: 0,
      snapY: 0,
    },
    bottom: {
      top: isPants ? 300 : isJorts ? 278 : 272,
      height: isPants ? 360 : isJorts ? 265 : 255,
      width: 315,
      scale: 1,
      snapX: 0,
      snapY: 0,
    },
  };
};

const getOutfitStyle = (item, dynamicScale = 1, snap = {}, drag = {}) => {
  const position = item?.outfitPosition || {};

  const x =
    Number(position.x || 0) +
    Number(snap.snapX || 0) +
    Number(drag.x || 0);

  const y =
    Number(position.y || 0) +
    Number(snap.snapY || 0) +
    Number(drag.y || 0);

  const scale =
    Number(position.scale || 1) *
    Number(dynamicScale || 1) *
    Number(drag.scale || 1);

  return {
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
  };
};

const scorePair = (top, bottom) => {
  let score = 0;
  if (!top || !bottom) return score;

  if (top.category && bottom.matchWith?.includes(top.category)) score += 10;
  if (bottom.category && top.matchWith?.includes(bottom.category)) score += 10;
  if (top.styleVibe && bottom.styleVibe && top.styleVibe === bottom.styleVibe) score += 6;

  if (top.bestseller) score += 3;
  if (bottom.bestseller) score += 3;
  if (top.newArrival) score += 4;
  if (bottom.newArrival) score += 4;
  if (top.onSale) score += 1;
  if (bottom.onSale) score += 1;

  return score;
};

const StyleBuilder = () => {
  const {
    products,
    currency,
    categoryOptions = [],
    backendUrl,
    token,
  } = useContext(ShopContext);

  const [mode, setMode] = useState("manual");
  const [category, setCategory] = useState("All");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [skinTone, setSkinTone] = useState(SKIN_TONES[3]);
  const [previewBg, setPreviewBg] = useState(PREVIEW_BACKGROUNDS[0].color);

  const [categoryMeta, setCategoryMeta] = useState([]);

  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/category/list`);

        if (response.data?.success) {
          setCategoryMeta(response.data.categories || []);
        }
      } catch (error) {
        console.error("Build Fit Category Load Error:", error);
      }
    };

    loadCategories();
  }, [backendUrl]);

  const getProductSection = (product) => {
    const productCategory = normalize(product?.category);

    const match = categoryMeta.find(
      (cat) => normalize(cat.name) === productCategory
    );

    return normalize(match?.section || "other");
  };

  const CATEGORIES = useMemo(() => {
    const backendCategoryNames = categoryMeta.map((item) => item.name).filter(Boolean);

    return [
      "All",
      ...Array.from(
        new Set([
          ...categoryOptions.filter(Boolean),
          ...backendCategoryNames,
        ])
      ),
    ];
  }, [categoryOptions, categoryMeta]);

  const cleanProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((item) => item && !item.isDeleted);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return cleanProducts.filter(
      (item) => category === "All" || item.category === category
    );
  }, [cleanProducts, category]);

  const topOptions = useMemo(() => {
    return filteredProducts.filter((item) => getProductSection(item) === "top");
  }, [filteredProducts, categoryMeta]);

  const bottomOptions = useMemo(() => {
    return filteredProducts.filter((item) => getProductSection(item) === "bottom");
  }, [filteredProducts, categoryMeta]);

  const selectedTop = selectedProducts.find(
    (item) => getProductSection(item) === "top"
  );

  const selectedBottom = selectedProducts.find(
    (item) => getProductSection(item) === "bottom"
  );

  const outfitLayout = getSmartLayout({ selectedBottom });

  const totalPrice = selectedProducts.reduce(
    (sum, item) => sum + getFinalPrice(item),
    0
  );

  const clearFit = () => {
    setSelectedProducts([]);
    setPositions(DEFAULT_POSITIONS);
    setAiSuggestion("");
    setAiError("");
  };

  const resetPositions = () => {
    setPositions(DEFAULT_POSITIONS);
  };

  const updateScale = (slot, value) => {
    setPositions((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        scale: Number(value),
      },
    }));
  };

  const startDrag = (event, slot) => {
    if (mode !== "manual") return;

    event.preventDefault();
    event.stopPropagation();

    const pointer = event.touches?.[0] || event;
    const startX = pointer.clientX;
    const startY = pointer.clientY;

    const startPosition = {
      x: positions[slot]?.x || 0,
      y: positions[slot]?.y || 0,
    };

    const move = (moveEvent) => {
      moveEvent.preventDefault();

      const movePointer = moveEvent.touches?.[0] || moveEvent;
      const deltaX = movePointer.clientX - startX;
      const deltaY = movePointer.clientY - startY;

      setPositions((prev) => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          x: startPosition.x + deltaX,
          y: startPosition.y + deltaY,
        },
      }));
    };

    const stop = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", stop);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", stop);
  };

  const addToFit = (product) => {
    if (!product?._id || mode !== "manual") return;

    setAiSuggestion("");
    setAiError("");

    const section = getProductSection(product);

    setSelectedProducts((prev) => {
      const exists = prev.some((item) => item._id === product._id);

      if (exists) {
        return prev.filter((item) => item._id !== product._id);
      }

      if (section === "top") {
        return [
          ...prev.filter((item) => getProductSection(item) !== "top"),
          product,
        ];
      }

      if (section === "bottom") {
        return [
          ...prev.filter((item) => getProductSection(item) !== "bottom"),
          product,
        ];
      }

      return prev;
    });
  };

  const generateAutomaticFit = () => {
    setAiSuggestion("");
    setAiError("");

    if (topOptions.length === 0 && bottomOptions.length === 0) return;

    if (topOptions.length > 0 && bottomOptions.length > 0) {
      const rankedPairs = [];

      topOptions.forEach((top) => {
        bottomOptions.forEach((bottom) => {
          rankedPairs.push({
            top,
            bottom,
            score: scorePair(top, bottom),
          });
        });
      });

      const sortedPairs = rankedPairs.sort((a, b) => b.score - a.score);
      const selectedPair = sortedPairs[0];

      setSelectedProducts([selectedPair.top, selectedPair.bottom].filter(Boolean));
      setPositions(DEFAULT_POSITIONS);
      return;
    }

    if (topOptions.length > 0) {
      setSelectedProducts([topOptions[0]]);
      setPositions(DEFAULT_POSITIONS);
      return;
    }

    setSelectedProducts([bottomOptions[0]]);
    setPositions(DEFAULT_POSITIONS);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);

    if (nextMode === "automatic") {
      generateAutomaticFit();
    }
  };

  const generateAISuggestion = async () => {
    try {
      setAiLoading(true);
      setAiError("");
      setAiSuggestion("");

      if (!selectedTop && !selectedBottom) {
        setAiError("Pick at least one item before using AI Style Analysis.");
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/ai/suggest-fit`,
        {
          top: selectedTop
            ? {
                name: selectedTop.name,
                category: selectedTop.category,
                color: selectedTop.color,
                styleVibe: selectedTop.styleVibe,
                styleTags: selectedTop.styleTags,
                price: selectedTop.price,
              }
            : null,
          bottom: selectedBottom
            ? {
                name: selectedBottom.name,
                category: selectedBottom.category,
                color: selectedBottom.color,
                styleVibe: selectedBottom.styleVibe,
                styleTags: selectedBottom.styleTags,
                price: selectedBottom.price,
              }
            : null,
          style: "modern streetwear",
        },
        {
          headers: token ? { token } : {},
        }
      );

      if (response.data?.success) {
        setAiSuggestion(response.data.suggestion || "");
      } else {
        setAiError(response.data?.message || "AI style analysis failed.");
      }
    } catch (error) {
      console.error("AI Style Analysis Error:", error);
      setAiError("AI style analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const renderProductCard = (item, active) => (
    <button
      key={item._id}
      onClick={() => addToFit(item)}
      disabled={mode === "automatic"}
      className={`flex items-center gap-3 rounded-[5px] border p-2 text-left transition ${
        active
          ? "border-black bg-black text-white"
          : "border-black/10 bg-white hover:border-black"
      } ${mode === "automatic" ? "cursor-default opacity-80" : ""}`}
    >
      <div
        className={`h-16 w-14 overflow-hidden rounded-[5px] ${
          active ? "bg-white" : "bg-[#f5f1e9]"
        }`}
      >
        <img
          src={getProductImage(item)}
          alt={item.name}
          className="h-full w-full object-contain p-1"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[11px] font-black uppercase">
          {item.name}
        </p>
        <p
          className={`mt-1 text-[10px] font-bold ${
            active ? "text-white/70" : "text-black/50"
          }`}
        >
          {currency}
          {getFinalPrice(item).toLocaleString()}
        </p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-3 py-4 lg:px-5">
      <style>
        {`
          @keyframes saintFade {
            from { opacity: 0; transform: scale(.98); }
            to { opacity: 1; transform: scale(1); }
          }

          .saint-fade {
            animation: saintFade 0.25s ease both;
          }

          .saint-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .saint-scroll::-webkit-scrollbar-thumb {
            background: #cfcfcf;
            border-radius: 999px;
          }

          .saint-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
        `}
      </style>

      <div className="mx-auto grid max-w-[1560px] gap-4 xl:grid-cols-[410px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[5px] bg-[#fbf7ef] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
          <div className="mb-4">
            <h1 className="text-3xl font-black uppercase tracking-[-0.08em] text-black">
              Style Builder
            </h1>
            <p className="mt-1 text-sm font-medium text-black/70">
              Build your perfect fit
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-[5px] border border-black/10 bg-white">
            <button
              onClick={() => handleModeChange("manual")}
              className={`py-3 text-xs font-black uppercase tracking-widest ${
                mode === "manual" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              Manual
            </button>

            <button
              onClick={() => handleModeChange("automatic")}
              className={`py-3 text-xs font-black uppercase tracking-widest ${
                mode === "automatic" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              AI Assist
            </button>
          </div>

          <div className="border-t border-black/10 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight text-black">
                Skin Tone
              </h2>

              <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
                Type {skinTone.type}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-3">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone.type}
                  onClick={() => setSkinTone(tone)}
                  title={`${tone.type} - ${tone.label}`}
                  className={`h-9 w-9 rounded-full border transition ${
                    skinTone.type === tone.type
                      ? "border-black ring-2 ring-black ring-offset-2"
                      : "border-black/10"
                  }`}
                  style={{ backgroundColor: tone.color }}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-black/10 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight text-black">
                Collection
              </h2>

              {selectedProducts.length > 0 && (
                <button
                  onClick={clearFit}
                  className="rounded-[5px] bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-[5px] border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
                    category === cat
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs font-black uppercase tracking-widest text-black/50">
              Top
            </p>

            <div className="saint-scroll mt-2 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {topOptions.length === 0 ? (
                <p className="rounded-[5px] bg-white p-3 text-xs font-bold text-black/50">
                  No top items found. Set this category section to top.
                </p>
              ) : (
                topOptions.map((item) =>
                  renderProductCard(item, selectedTop?._id === item._id)
                )
              )}
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-widest text-black/50">
              Bottom
            </p>

            <div className="saint-scroll mt-2 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {bottomOptions.length === 0 ? (
                <p className="rounded-[5px] bg-white p-3 text-xs font-bold text-black/50">
                  No bottom items found. Set this category section to bottom.
                </p>
              ) : (
                bottomOptions.map((item) =>
                  renderProductCard(item, selectedBottom?._id === item._id)
                )
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-black/10 pt-4">
            <h2 className="text-base font-black uppercase tracking-tight text-black">
              Background
            </h2>

            <div className="mt-3 flex gap-3">
              {PREVIEW_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.name}
                  onClick={() => setPreviewBg(bg.color)}
                  title={bg.name}
                  className={`h-10 w-10 rounded-full border transition ${
                    previewBg === bg.color
                      ? "border-black ring-2 ring-black ring-offset-2"
                      : "border-black/10"
                  }`}
                  style={{ backgroundColor: bg.color }}
                />
              ))}
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-5 border-t border-black/10 pt-4">
              <h2 className="text-base font-black uppercase tracking-tight text-black">
                Fit Adjustment
              </h2>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-[5px] bg-white p-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-black/40">
                    Top Scale
                  </p>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.01"
                    value={positions.top.scale}
                    onChange={(event) => updateScale("top", event.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="rounded-[5px] bg-white p-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-black/40">
                    Bottom Scale
                  </p>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.01"
                    value={positions.bottom.scale}
                    onChange={(event) => updateScale("bottom", event.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <button
                onClick={resetPositions}
                className="mt-2 w-full rounded-[5px] border border-black/10 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-black"
              >
                Reset Position
              </button>
            </div>
          )}
        </aside>

        <main className="min-w-0">
          <section
            className="relative h-[760px] overflow-hidden rounded-[5px]"
            style={{
              background:
                previewBg === "#050505" || previewBg === "#1b1b1b"
                  ? previewBg
                  : `linear-gradient(180deg, ${previewBg} 0%, ${skinTone.color}30 100%)`,
            }}
          >
            <div className="absolute left-5 top-5 z-40 rounded-[5px] bg-white/90 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/50">
                2D Mannequin Preview
              </p>
            </div>

            <button
              type="button"
              className="absolute right-5 top-5 z-40 rounded-[5px] bg-white/90 px-5 py-3 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-black/10 backdrop-blur"
            >
              Download Outfit
            </button>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p
                className={`select-none text-[170px] font-black uppercase tracking-[-0.08em] ${
                  previewBg === "#050505" || previewBg === "#1b1b1b"
                    ? "text-white/[0.06]"
                    : "text-black/[0.025]"
                }`}
              >
                SAINT
              </p>
            </div>

            <div className="absolute left-1/2 top-[50%] h-[690px] w-[430px] -translate-x-1/2 -translate-y-1/2">
              <img
                src={assets.mannequin}
                alt="Mannequin"
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[680px] w-[400px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-95"
                style={{
                  filter: `sepia(0.35) saturate(1.1) hue-rotate(${skinTone.hue}deg) brightness(${skinTone.brightness})`,
                }}
              />

              <div
                onMouseDown={(event) => startDrag(event, "top")}
                onTouchStart={(event) => startDrag(event, "top")}
                className="absolute left-1/2 z-30 -translate-x-1/2 cursor-grab touch-none select-none active:cursor-grabbing"
                style={{
                  top: `${outfitLayout.top.top}px`,
                  height: `${outfitLayout.top.height}px`,
                  width: `${outfitLayout.top.width}px`,
                }}
              >
                {selectedTop && (
                  <img
                    key={selectedTop._id}
                    src={getProductImage(selectedTop)}
                    alt={selectedTop.name}
                    draggable={false}
                    style={getOutfitStyle(
                      selectedTop,
                      outfitLayout.top.scale,
                      outfitLayout.top,
                      positions.top
                    )}
                    className="saint-fade pointer-events-none h-full w-full select-none object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.20)]"
                  />
                )}
              </div>

              <div
                onMouseDown={(event) => startDrag(event, "bottom")}
                onTouchStart={(event) => startDrag(event, "bottom")}
                className="absolute left-1/2 z-20 -translate-x-1/2 cursor-grab touch-none select-none active:cursor-grabbing"
                style={{
                  top: `${outfitLayout.bottom.top}px`,
                  height: `${outfitLayout.bottom.height}px`,
                  width: `${outfitLayout.bottom.width}px`,
                }}
              >
                {selectedBottom && (
                  <img
                    key={selectedBottom._id}
                    src={getProductImage(selectedBottom)}
                    alt={selectedBottom.name}
                    draggable={false}
                    style={getOutfitStyle(
                      selectedBottom,
                      outfitLayout.bottom.scale,
                      outfitLayout.bottom,
                      positions.bottom
                    )}
                    className="saint-fade pointer-events-none h-full w-full select-none object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.18)]"
                  />
                )}
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[5px] border border-black/10 bg-white/90 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/40">
                    Gemini AI
                  </p>
                  <h3 className="text-sm font-black uppercase tracking-tight text-black">
                    AI Style Analysis
                  </h3>
                </div>

                <button
                  onClick={generateAISuggestion}
                  disabled={aiLoading || (!selectedTop && !selectedBottom)}
                  className={`rounded-[5px] px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                    aiLoading || (!selectedTop && !selectedBottom)
                      ? "cursor-not-allowed bg-black/10 text-black/40"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {aiLoading ? "Analyzing..." : "Analyze"}
                </button>
              </div>

              {aiError && (
                <p className="text-sm font-bold text-red-500">{aiError}</p>
              )}

              {!aiError && !aiSuggestion && (
                <p className="text-sm font-medium leading-6 text-black/70">
                  Select a top and bottom, then let Gemini explain the outfit in
                  a modern Saint Clothing streetwear style.
                </p>
              )}

              {aiSuggestion && (
                <p className="saint-fade text-sm font-medium leading-6 text-black/80">
                  {aiSuggestion}
                </p>
              )}
            </div>

            <div className="rounded-[5px] border border-black/10 bg-white/90 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/40">
                Total Price
              </p>

              <h3 className="mt-2 text-3xl font-black text-black">
                {currency}
                {totalPrice.toLocaleString()}
              </h3>

              <button
                type="button"
                disabled={selectedProducts.length === 0}
                className={`mt-4 w-full rounded-[5px] px-4 py-3 text-xs font-black uppercase tracking-widest ${
                  selectedProducts.length === 0
                    ? "cursor-not-allowed bg-black/10 text-black/40"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                Add All To Cart
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StyleBuilder;