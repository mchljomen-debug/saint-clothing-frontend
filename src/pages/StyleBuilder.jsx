import React, { useContext, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";

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
  { name: "Cream", color: "#F7F3EA" },
  { name: "Grey", color: "#F3F4F6" },
  { name: "Black", color: "#050505" },
];

const DEFAULT_POSITIONS = {
  top: { x: 0, y: 0, scale: 1 },
  bottom: { x: 0, y: 0, scale: 1 },
};

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

  if (text.includes("jorts") || text.includes("short")) return "shorts";

  return "pants";
};

const getSmartLayout = ({ selectedBottom }) => {
  const bottomKind = getBottomKind(selectedBottom);
  const isPants = bottomKind === "pants";

  return {
    top: {
      top: 20,
      height: 300,
      width: 350,
      scale: 1,
      snapX: 0,
      snapY: 0,
    },
    bottom: {
      top: isPants ? 255 : 205,
      height: isPants ? 315 : 305,
      width: 350,
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

  if (top.category && bottom.matchWith?.includes(top.category)) score += 8;
  if (bottom.category && top.matchWith?.includes(bottom.category)) score += 8;
  if (top.color && bottom.color && top.color === bottom.color) score += 3;
  if (top.styleVibe && bottom.styleVibe && top.styleVibe === bottom.styleVibe) {
    score += 4;
  }

  const topTags = Array.isArray(top.styleTags) ? top.styleTags : [];
  const bottomTags = Array.isArray(bottom.styleTags) ? bottom.styleTags : [];

  const sharedTags = bottomTags.filter((tag) =>
    topTags
      .map((t) => String(t).toLowerCase())
      .includes(String(tag).toLowerCase())
  );

  score += sharedTags.length * 2;

  if (top.bestseller) score += 2;
  if (bottom.bestseller) score += 2;
  if (top.newArrival) score += 1;
  if (bottom.newArrival) score += 1;
  if (top.onSale) score += 1;
  if (bottom.onSale) score += 1;

  return score;
};

const StyleBuilder = () => {
  const { products, currency, categoryOptions = [] } = useContext(ShopContext);

  const [mode, setMode] = useState("manual");
  const [category, setCategory] = useState("All");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [previewBg, setPreviewBg] = useState("#ffffff");
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);

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

  const outfitLayout = getSmartLayout({
    selectedBottom,
  });

  const isDarkPreview = previewBg.toLowerCase() === "#050505";

  const clearFit = () => {
    setSelectedProducts([]);
    setPositions(DEFAULT_POSITIONS);
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

    const productType = getProductType(product);

    setSelectedProducts((prev) => {
      const exists = prev.some((item) => item._id === product._id);

      if (exists) {
        return prev.filter((item) => item._id !== product._id);
      }

      if (productType === "top") {
        return [
          ...prev.filter(
            (item) => !["top", "both"].includes(getProductType(item))
          ),
          product,
        ];
      }

      if (productType === "bottom") {
        return [
          ...prev.filter(
            (item) => !["bottom", "both"].includes(getProductType(item))
          ),
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

    if (tops.length === 0 && bottoms.length === 0) return;

    let pickedTop = null;
    let pickedBottom = null;

    if (tops.length > 0 && bottoms.length > 0) {
      const pairs = [];

      tops.forEach((top) => {
        bottoms.forEach((bottom) => {
          if (top._id !== bottom._id) {
            pairs.push({
              top,
              bottom,
              score: scorePair(top, bottom),
            });
          }
        });
      });

      const bestPairs = pairs
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(8, pairs.length));

      const randomPair = bestPairs[Math.floor(Math.random() * bestPairs.length)];

      pickedTop = randomPair?.top || null;
      pickedBottom = randomPair?.bottom || null;
    } else if (tops.length > 0) {
      pickedTop = tops[Math.floor(Math.random() * tops.length)];
    } else if (bottoms.length > 0) {
      pickedBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    }

    setSelectedProducts([pickedTop, pickedBottom].filter(Boolean));
    setPositions(DEFAULT_POSITIONS);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);

    if (nextMode === "automatic") {
      generateAutomaticFit();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] px-2 py-2 sm:px-3 lg:px-4">
      <style>
        {`
          @keyframes saintFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }

          @keyframes saintFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .saint-float {
            animation: saintFloat 5s ease-in-out infinite;
          }

          .saint-fade {
            animation: saintFade 0.4s ease both;
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

          input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 0;
          }

          input[type="color"]::-webkit-color-swatch {
            border: none;
            border-radius: 5px;
          }
        `}
      </style>

      <div className="mx-auto max-w-[1950px]">
        <div className="mb-2 rounded-[5px] border border-black/10 bg-white px-5 py-3 shadow-[0_14px_35px_rgba(0,0,0,0.05)] sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
                Saint Clothing
              </p>

              <h1 className="mt-0.5 text-3xl font-black uppercase tracking-[-0.05em] text-black sm:text-5xl">
                Style Builder
              </h1>

              <p className="mt-1 max-w-2xl text-sm font-medium leading-5 text-gray-500">
                Build a fit manually or generate a smart outfit from your product
                collection.
              </p>
            </div>

            <div className="flex w-full rounded-[5px] bg-black p-1 shadow-lg shadow-black/10 sm:w-auto">
              <button
                onClick={() => handleModeChange("manual")}
                className={`flex-1 rounded-[5px] px-6 py-2.5 text-xs font-black uppercase tracking-widest transition sm:flex-none ${
                  mode === "manual"
                    ? "bg-white text-black"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Manual
              </button>

              <button
                onClick={() => handleModeChange("automatic")}
                className={`flex-1 rounded-[5px] px-6 py-2.5 text-xs font-black uppercase tracking-widest transition sm:flex-none ${
                  mode === "automatic"
                    ? "bg-white text-black"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Automatic
              </button>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-2 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="flex h-[775px] min-w-0 flex-col rounded-[5px] border border-black/10 bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,0.05)] sm:p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">
                  Collection
                </p>

                <h2 className="mt-0.5 text-xl font-black uppercase tracking-tight text-black">
                  Pick Your Pieces
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <p className="rounded-[5px] bg-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {filteredProducts.length} items
                </p>

                {selectedProducts.length > 0 && (
                  <button
                    onClick={clearFit}
                    className="rounded-[5px] bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-500 transition hover:bg-red-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto border-b border-gray-100 pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-[5px] border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                    category === cat
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {mode === "automatic" && (
              <button
                onClick={generateAutomaticFit}
                className="mb-3 w-full rounded-[5px] bg-black px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-gray-800"
              >
                Generate New Automatic Fit
              </button>
            )}

            <div className="saint-scroll min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((item) => {
                  const active = selectedProducts.some((p) => p._id === item._id);
                  const type = getProductType(item);

                  return (
                    <button
                      key={item._id}
                      onClick={() => addToFit(item)}
                      disabled={mode === "automatic"}
                      className={`group text-left transition ${
                        mode === "automatic"
                          ? "cursor-default opacity-90"
                          : "cursor-pointer"
                      }`}
                    >
                      <div
                        className={`relative overflow-hidden rounded-[5px] bg-[#f5f5f3] transition duration-300 ${
                          active
                            ? "ring-2 ring-black ring-offset-2"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="aspect-[3/4]">
                          <img
                            src={getProductImage(item)}
                            alt={item.name}
                            className="h-full w-full object-contain p-2.5 mix-blend-multiply transition duration-500 group-hover:scale-105"
                          />
                        </div>

                        <span className="absolute left-2 top-2 rounded-[5px] bg-white/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-gray-600 shadow-sm">
                          {type}
                        </span>

                        {active && (
                          <span className="absolute right-2 top-2 rounded-[5px] bg-black px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
                            Picked
                          </span>
                        )}
                      </div>

                      <div className="pt-2">
                        <p className="line-clamp-1 text-xs font-black uppercase tracking-tight text-black">
                          {item.name}
                        </p>

                        <p className="mt-0.5 line-clamp-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {item.category}
                        </p>

                        <p className="mt-1 text-xs font-black text-black">
                          {currency}
                          {getFinalPrice(item).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="rounded-[5px] border border-black/10 bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,0.05)] xl:sticky xl:top-2 xl:h-fit">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">
                  Live Preview
                </p>

                <h2 className="mt-0.5 text-xl font-black uppercase tracking-tight text-black">
                  2D Fit
                </h2>
              </div>

              <p className="rounded-[5px] bg-gray-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">
                {mode}
              </p>
            </div>

            <div className="mb-2 flex items-center justify-between gap-3 rounded-[5px] bg-gray-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                Background
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={previewBg}
                  onChange={(e) => setPreviewBg(e.target.value)}
                  title="Pick custom background"
                  className="h-7 w-7 cursor-pointer overflow-hidden rounded-[5px] border border-gray-300 bg-white p-0"
                />

                {PREVIEW_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.name}
                    onClick={() => setPreviewBg(bg.color)}
                    title={bg.name}
                    className={`h-7 w-7 rounded-[5px] border transition ${
                      previewBg.toLowerCase() === bg.color.toLowerCase()
                        ? "border-black ring-2 ring-black ring-offset-2"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: bg.color }}
                  />
                ))}
              </div>
            </div>

            <div
              className="relative flex h-[600px] items-center justify-center overflow-hidden rounded-[5px] transition-colors duration-500"
              style={{ backgroundColor: previewBg }}
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p
                  className={`select-none text-[95px] font-black uppercase tracking-[-0.08em] ${
                    isDarkPreview ? "text-white/[0.04]" : "text-black/[0.018]"
                  }`}
                >
                  SAINT
                </p>
              </div>

              <div className="saint-float relative h-[580px] w-[340px]">
                <div
                  onMouseDown={(event) => startDrag(event, "top")}
                  onTouchStart={(event) => startDrag(event, "top")}
                  className="absolute left-1/2 z-30 -translate-x-1/2 cursor-grab touch-none select-none transition duration-300 ease-out active:cursor-grabbing"
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
                      className="saint-fade pointer-events-none h-full w-full select-none object-contain mix-blend-multiply transition duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-300">
                        Top
                      </span>
                    </div>
                  )}
                </div>

                <div
                  onMouseDown={(event) => startDrag(event, "bottom")}
                  onTouchStart={(event) => startDrag(event, "bottom")}
                  className="absolute left-1/2 z-20 -translate-x-1/2 cursor-grab touch-none select-none transition duration-300 ease-out active:cursor-grabbing"
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
                      className="saint-fade pointer-events-none h-full w-full select-none object-contain mix-blend-multiply transition duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-300">
                        Bottom
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-[5px] bg-gray-50 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Picked Items
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetPositions}
                    className="rounded-[5px] bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-gray-500"
                  >
                    Reset Fit
                  </button>

                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {selectedProducts.length}/2
                  </p>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <div className="rounded-[5px] bg-white p-2">
                    <p className="mb-1 text-[8px] font-black uppercase tracking-widest text-gray-400">
                      Top Scale
                    </p>
                    <input
                      type="range"
                      min="0.7"
                      max="1.35"
                      step="0.01"
                      value={positions.top.scale}
                      onChange={(event) => updateScale("top", event.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="rounded-[5px] bg-white p-2">
                    <p className="mb-1 text-[8px] font-black uppercase tracking-widest text-gray-400">
                      Bottom Scale
                    </p>
                    <input
                      type="range"
                      min="0.7"
                      max="1.35"
                      step="0.01"
                      value={positions.bottom.scale}
                      onChange={(event) =>
                        updateScale("bottom", event.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {selectedProducts.length === 0 ? (
                <div className="rounded-[5px] bg-white px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    No products picked
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedProducts.map((item) => {
                    const type = getProductType(item);

                    return (
                      <div
                        key={item._id}
                        className="flex w-full items-center gap-2.5 rounded-[5px] bg-white p-2 text-left transition hover:bg-gray-100"
                      >
                        <img
                          src={getProductImage(item)}
                          alt={item.name}
                          className="h-11 w-10 rounded-[5px] bg-gray-50 object-contain p-1 mix-blend-multiply"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
                            {type}
                          </p>

                          <p className="line-clamp-1 text-[11px] font-black uppercase text-black">
                            {item.name}
                          </p>

                          <p className="text-[10px] font-black text-gray-500">
                            {currency}
                            {getFinalPrice(item).toLocaleString()}
                          </p>
                        </div>

                        {mode === "manual" && (
                          <button
                            onClick={() =>
                              setSelectedProducts((prev) =>
                                prev.filter((p) => p._id !== item._id)
                              )
                            }
                            className="rounded-[5px] bg-red-50 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-red-500"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StyleBuilder;