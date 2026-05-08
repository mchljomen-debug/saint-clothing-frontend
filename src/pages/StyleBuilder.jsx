import React, { useContext, useMemo, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets";

const TOP_KEYWORDS = [
  "tshirt",
  "t-shirt",
  "shirt",
  "long sleeve",
  "longsleeve",
  "crop",
  "jersey",
  "hoodie",
  "jacket",
  "polo",
];

const BOTTOM_KEYWORDS = [
  "jorts",
  "short",
  "shorts",
  "pants",
  "jeans",
  "trouser",
  "bottom",
];

const PREVIEW_BACKGROUNDS = [
  { name: "White", color: "#ffffff" },
  { name: "Cream", color: "#f6efe6" },
  { name: "Grey", color: "#d9d6cf" },
  { name: "Black", color: "#2f3030" },
];

const DEFAULT_POSITIONS = {
  top: { x: 0, y: 0, scale: 1 },
  bottom: { x: 0, y: 0, scale: 1 },
};

const SKIN_TONES = [
  {
    type: "I",
    name: "LUNA",
    label: "Very Fair",
    description: "Always burns, never tans.",
    color: "#F6D8C8",
    hue: 0,
    brightness: 1.12,
  },
  {
    type: "II",
    name: "CLAIRE",
    label: "Fair",
    description: "Usually burns, tans minimally.",
    color: "#EFC0A4",
    hue: -4,
    brightness: 1.04,
  },
  {
    type: "III",
    name: "MIA",
    label: "Medium",
    description: "Sometimes mild burn, tans uniformly.",
    color: "#C6865A",
    hue: -8,
    brightness: 0.98,
  },
  {
    type: "IV",
    name: "OLIVIA",
    label: "Olive",
    description: "Rarely burns, tans well.",
    color: "#A86F45",
    hue: -10,
    brightness: 0.92,
  },
  {
    type: "V",
    name: "ZARA",
    label: "Brown",
    description: "Very rarely burns, tans easily.",
    color: "#7A4A2E",
    hue: -15,
    brightness: 0.76,
  },
  {
    type: "VI",
    name: "NOVA",
    label: "Deep",
    description: "Never burns, tans very darkly.",
    color: "#4A2A1A",
    hue: -18,
    brightness: 0.62,
  },
];

const getProductImage = (item) => {
  if (item?.outfitImage) return item.outfitImage;
  if (Array.isArray(item?.images) && item.images.length > 0) return item.images[0];
  if (Array.isArray(item?.image) && item.image.length > 0) return item.image[0];
  if (typeof item?.images === "string") return item.images;
  if (typeof item?.image === "string") return item.image;
  return "/placeholder.png";
};

const getProductText = (product) =>
  `${product?.category || ""} ${product?.name || ""} ${
    product?.subCategory || ""
  }`.toLowerCase();

const getProductType = (product) => {
  const section = String(product?.recommendationSection || "").toLowerCase();

  if (["top", "bottom", "both"].includes(section)) return section;

  const text = getProductText(product);

  if (TOP_KEYWORDS.some((word) => text.includes(word))) return "top";
  if (BOTTOM_KEYWORDS.some((word) => text.includes(word))) return "bottom";

  return "other";
};

const getBottomKind = (product) => {
  const text = getProductText(product);

  if (text.includes("pants") || text.includes("jeans") || text.includes("trouser")) {
    return "pants";
  }

  if (text.includes("jorts")) return "jorts";
  if (text.includes("shorts") || text.includes("short")) return "shorts";

  return "bottom";
};

const getSmartLayout = ({ selectedBottom }) => {
  const bottomKind = getBottomKind(selectedBottom);

  return {
    top: {
      top: 92,
      height: 190,
      width: 250,
      scale: 1,
      snapX: 0,
      snapY: 0,
    },
    bottom: {
      top: bottomKind === "pants" ? 278 : bottomKind === "jorts" ? 250 : 245,
      height: bottomKind === "pants" ? 285 : bottomKind === "jorts" ? 230 : 220,
      width: 245,
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

const getFinalPrice = (item) => {
  const price = Number(item?.price || 0);
  const salePercent = Number(item?.salePercent || 0);

  if (item?.onSale && salePercent > 0) {
    return Math.max(price - (price * salePercent) / 100, 0);
  }

  return price;
};

const scorePair = (top, bottom) => {
  let score = 0;
  if (!top || !bottom) return score;

  const topColor = String(top.color || "").toLowerCase();
  const bottomColor = String(bottom.color || "").toLowerCase();

  const topTags = Array.isArray(top.styleTags)
    ? top.styleTags.map((t) => String(t).toLowerCase())
    : [];

  const bottomTags = Array.isArray(bottom.styleTags)
    ? bottom.styleTags.map((t) => String(t).toLowerCase())
    : [];

  const sharedTags = bottomTags.filter((tag) => topTags.includes(tag));

  if (top.category && bottom.matchWith?.includes(top.category)) score += 10;
  if (bottom.category && top.matchWith?.includes(bottom.category)) score += 10;
  if (top.styleVibe && bottom.styleVibe && top.styleVibe === bottom.styleVibe) score += 6;

  score += sharedTags.length * 3;

  if (topColor && bottomColor && topColor === bottomColor) score += 1;

  const neutralColors = ["black", "white", "gray", "grey", "cream", "beige"];
  const topNeutral = neutralColors.some((c) => topColor.includes(c));
  const bottomNeutral = neutralColors.some((c) => bottomColor.includes(c));

  if (topColor && bottomColor && topColor !== bottomColor) score += 4;
  if (topNeutral || bottomNeutral) score += 2;
  if (topColor.includes("black") && bottomColor.includes("black")) score -= 6;

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
  const [previewBg, setPreviewBg] = useState(PREVIEW_BACKGROUNDS[1].color);

  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const CATEGORIES = useMemo(() => {
    return ["All", ...Array.from(new Set(categoryOptions.filter(Boolean)))];
  }, [categoryOptions]);

  const cleanProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((item) => item && !item.isDeleted);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return cleanProducts.filter(
      (item) => category === "All" || item.category === category
    );
  }, [cleanProducts, category]);

  const selectedTop = selectedProducts.find((item) => {
    const type = getProductType(item);
    return type === "top" || type === "both";
  });

  const selectedBottom = selectedProducts.find((item) => {
    const type = getProductType(item);
    return type === "bottom" || type === "both";
  });

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

    const productType = getProductType(product);

    setSelectedProducts((prev) => {
      const exists = prev.some((item) => item._id === product._id);

      if (exists) {
        return prev.filter((item) => item._id !== product._id);
      }

      if (productType === "top") {
        return [
          ...prev.filter((item) => !["top", "both"].includes(getProductType(item))),
          product,
        ];
      }

      if (productType === "bottom") {
        return [
          ...prev.filter((item) => !["bottom", "both"].includes(getProductType(item))),
          product,
        ];
      }

      if (productType === "both") {
        return [product];
      }

      return prev;
    });
  };

  const generateAutomaticFit = () => {
    const tops = cleanProducts.filter((item) => {
      const type = getProductType(item);
      return type === "top" || type === "both";
    });

    const bottoms = cleanProducts.filter((item) => {
      const type = getProductType(item);
      return type === "bottom" || type === "both";
    });

    setAiSuggestion("");
    setAiError("");

    if (tops.length === 0 && bottoms.length === 0) return;

    if (tops.length > 0 && bottoms.length > 0) {
      const rankedPairs = [];

      tops.forEach((top) => {
        bottoms.forEach((bottom) => {
          if (top._id !== bottom._id) {
            rankedPairs.push({
              top,
              bottom,
              score: scorePair(top, bottom),
            });
          }
        });
      });

      const sortedPairs = rankedPairs.sort((a, b) => b.score - a.score);
      const poolSize = Math.max(5, Math.ceil(sortedPairs.length * 0.3));
      const smartPool = sortedPairs.slice(0, poolSize);

      const selectedPair =
        smartPool[Math.floor(Math.random() * smartPool.length)] || smartPool[0];

      setSelectedProducts([selectedPair.top, selectedPair.bottom].filter(Boolean));
      setPositions(DEFAULT_POSITIONS);
      return;
    }

    if (tops.length > 0) {
      setSelectedProducts([tops[Math.floor(Math.random() * tops.length)]]);
      setPositions(DEFAULT_POSITIONS);
      return;
    }

    setSelectedProducts([bottoms[Math.floor(Math.random() * bottoms.length)]]);
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
          mannequin: {
            name: skinTone.name,
            skinType: skinTone.type,
            skinTone: skinTone.label,
          },
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

  return (
    <div className="min-h-screen bg-[#f8f5ef] px-3 py-4 lg:px-5">
      <style>
        {`
          @keyframes saintFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }

          @keyframes saintFade {
            from { opacity: 0; transform: scale(.98); }
            to { opacity: 1; transform: scale(1); }
          }

          .saint-float {
            animation: saintFloat 5s ease-in-out infinite;
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

      <div className="mx-auto grid max-w-[1550px] gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-[5px] bg-[#fbf7ef] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
          <div className="mb-4">
            <h1 className="text-3xl font-black uppercase tracking-[-0.06em] text-black">
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
            <h2 className="text-base font-black uppercase tracking-tight text-black">
              1. Select Mannequin
            </h2>

            <p className="mt-3 text-sm font-semibold text-black/70">Skin Tone</p>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone.type}
                  onClick={() => setSkinTone(tone)}
                  className={`relative overflow-hidden rounded-[5px] border p-2 text-left transition ${
                    skinTone.type === tone.type
                      ? "border-black bg-white shadow-[0_0_0_2px_rgba(0,0,0,0.08)]"
                      : "border-black/10 bg-white/70 hover:border-black"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${tone.color}35, #fffaf4)`,
                  }}
                >
                  <p className="text-xl font-black text-black">{tone.type}</p>
                  <p className="mt-1 text-[10px] font-bold text-black/70">
                    {tone.label}
                  </p>

                  <div
                    className="absolute -bottom-2 right-1 h-16 w-10 opacity-80"
                    style={{
                      backgroundColor: tone.color,
                      WebkitMaskImage: `url(${assets.mannequin})`,
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskImage: `url(${assets.mannequin})`,
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                      maskSize: "contain",
                    }}
                  />

                  {skinTone.type === tone.type && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-white">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div
              className="mt-4 rounded-[5px] border border-black/10 p-4"
              style={{
                background: `linear-gradient(135deg, ${skinTone.color}22, #fffaf4)`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-12"
                  style={{
                    backgroundColor: skinTone.color,
                    WebkitMaskImage: `url(${assets.mannequin})`,
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskImage: `url(${assets.mannequin})`,
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    maskSize: "contain",
                  }}
                />

                <div>
                  <h3 className="text-base font-black uppercase text-black">
                    {skinTone.type} — {skinTone.label}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-black/70">
                    {skinTone.description}
                  </p>
                  <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-black/40">
                    Mannequin Name
                  </p>
                  <p className="text-xl font-black uppercase tracking-tight text-black">
                    {skinTone.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-black/10 pt-4">
            <h2 className="text-base font-black uppercase tracking-tight text-black">
              2. Build Your Outfit
            </h2>

            <div className="mt-3">
              <p className="mb-1 text-sm font-semibold text-black/70">Top</p>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTop?._id || ""}
                  onChange={(e) => {
                    const product = cleanProducts.find((p) => p._id === e.target.value);
                    if (product) addToFit(product);
                  }}
                  className="w-full rounded-[5px] border border-black/10 bg-white px-3 py-3 text-xs font-bold outline-none"
                >
                  <option value="">Select top</option>
                  {cleanProducts
                    .filter((item) => {
                      const type = getProductType(item);
                      return type === "top" || type === "both";
                    })
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} — {currency}
                        {getFinalPrice(item).toLocaleString()}
                      </option>
                    ))}
                </select>

                {selectedTop && (
                  <button
                    onClick={() =>
                      setSelectedProducts((prev) =>
                        prev.filter((p) => p._id !== selectedTop._id)
                      )
                    }
                    className="rounded-[5px] border border-black/10 bg-white px-3 py-3 text-xs font-black"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-sm font-semibold text-black/70">Bottom</p>
              <div className="flex items-center gap-2">
                <select
                  value={selectedBottom?._id || ""}
                  onChange={(e) => {
                    const product = cleanProducts.find((p) => p._id === e.target.value);
                    if (product) addToFit(product);
                  }}
                  className="w-full rounded-[5px] border border-black/10 bg-white px-3 py-3 text-xs font-bold outline-none"
                >
                  <option value="">Select bottom</option>
                  {cleanProducts
                    .filter((item) => {
                      const type = getProductType(item);
                      return type === "bottom" || type === "both";
                    })
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} — {currency}
                        {getFinalPrice(item).toLocaleString()}
                      </option>
                    ))}
                </select>

                {selectedBottom && (
                  <button
                    onClick={() =>
                      setSelectedProducts((prev) =>
                        prev.filter((p) => p._id !== selectedBottom._id)
                      )
                    }
                    className="rounded-[5px] border border-black/10 bg-white px-3 py-3 text-xs font-black"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-black/10 pt-4">
            <h2 className="text-base font-black uppercase tracking-tight text-black">
              3. Preview Background
            </h2>

            <div className="mt-3 flex gap-3">
              {PREVIEW_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.name}
                  onClick={() => setPreviewBg(bg.color)}
                  title={bg.name}
                  className={`h-12 w-12 rounded-full border transition ${
                    previewBg === bg.color
                      ? "border-black ring-2 ring-black ring-offset-2"
                      : "border-black/10"
                  }`}
                  style={{
                    backgroundColor: bg.color,
                  }}
                />
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <section
            className="relative h-[640px] overflow-hidden rounded-[5px]"
            style={{
              background: `linear-gradient(180deg, ${previewBg} 0%, ${skinTone.color}55 100%)`,
            }}
          >
            <div className="absolute left-5 top-5 z-40 flex items-center gap-3 rounded-[5px] bg-white/80 px-4 py-3 backdrop-blur">
              <div
                className="h-10 w-8"
                style={{
                  backgroundColor: skinTone.color,
                  WebkitMaskImage: `url(${assets.mannequin})`,
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskImage: `url(${assets.mannequin})`,
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                }}
              />

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-black/50">
                  Mannequin Name
                </p>
                <p className="text-2xl font-black uppercase text-black">
                  {skinTone.name}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="absolute right-5 top-5 z-40 rounded-[5px] bg-white/80 px-5 py-3 text-xs font-black uppercase tracking-widest text-black backdrop-blur"
            >
              Download Outfit
            </button>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="select-none text-[150px] font-black uppercase tracking-[-0.08em] text-white/[0.08]">
                SAINT
              </p>
            </div>

            <div className="saint-float absolute left-1/2 top-1/2 h-[610px] w-[360px] -translate-x-1/2 -translate-y-1/2">
              <img
                src={assets.mannequin}
                alt="Mannequin"
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[595px] w-[340px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-95"
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
                {selectedTop ? (
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
                ) : null}
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
                {selectedBottom ? (
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
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[5px] border border-black/10 bg-white/80 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
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

            <div className="rounded-[5px] border border-black/10 bg-white/80 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
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

              {selectedProducts.length > 0 && (
                <button
                  onClick={resetPositions}
                  className="mt-2 w-full rounded-[5px] border border-black/10 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-black"
                >
                  Reset Fit Position
                </button>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StyleBuilder;