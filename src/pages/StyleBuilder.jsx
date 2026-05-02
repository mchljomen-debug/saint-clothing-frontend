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

const SHOES_KEYWORDS = [
  "shoe",
  "shoes",
  "sneaker",
  "sneakers",
  "footwear",
  "slides",
  "sandals",
];

const PREVIEW_BACKGROUNDS = [
  { name: "White", color: "#ffffff" },
  { name: "Cream", color: "#F7F3EA" },
  { name: "Grey", color: "#F3F4F6" },
  { name: "Black", color: "#050505" },
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

  if (["top", "bottom", "both", "shoes"].includes(section)) return section;

  const text = getProductText(product);

  if (TOP_KEYWORDS.some((word) => text.includes(word))) return "top";
  if (BOTTOM_KEYWORDS.some((word) => text.includes(word))) return "bottom";
  if (SHOES_KEYWORDS.some((word) => text.includes(word))) return "shoes";

  return "other";
};

const getBottomKind = (product) => {
  const text = getProductText(product);

  if (text.includes("jorts") || text.includes("short")) return "shorts";

  if (
    text.includes("pants") ||
    text.includes("jeans") ||
    text.includes("trouser")
  ) {
    return "pants";
  }

  return "bottom";
};

const getSmartLayout = ({ selectedBottom, selectedShoes }) => {
  const bottomKind = getBottomKind(selectedBottom);

  return {
    top: {
      top: 30,
      height: 285,
      width: 330,
      scale: 0.88,
      snapX: 0,
      snapY: 0,
    },
    bottom: {
      top: bottomKind === "pants" ? 195 : 210,
      height: bottomKind === "pants" ? 305 : 270,
      width: bottomKind === "pants" ? 320 : 310,
      scale: 0.88,
      snapX: 0,
      snapY: -8,
    },
    shoes: {
      top: bottomKind === "pants" ? 470 : 440,
      height: selectedShoes ? 78 : 70,
      width: 245,
      scale: 0.86,
      snapX: 0,
      snapY: 0,
    },
  };
};

const getOutfitStyle = (item, dynamicScale = 1, snap = {}) => {
  const position = item?.outfitPosition || {};
  const x = Number(position.x || 0) + Number(snap.snapX || 0);
  const y = Number(position.y || 0) + Number(snap.snapY || 0);
  const scale = Number(position.scale || 1) * dynamicScale;

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

  const selectedShoes = selectedProducts.find(
    (item) => getProductType(item) === "shoes"
  );

  const outfitLayout = getSmartLayout({
    selectedBottom,
    selectedShoes,
  });

  const isDarkPreview = previewBg.toLowerCase() === "#050505";

  const clearFit = () => {
    setSelectedProducts([]);
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

      if (productType === "shoes") {
        return [
          ...prev.filter((item) => getProductType(item) !== "shoes"),
          product,
        ];
      }

      if (productType === "both") {
        return [product];
      }

      return [...prev, product].slice(0, 4);
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

    const shoes = cleanProducts.filter(
      (item) => getProductType(item) === "shoes"
    );

    if (tops.length === 0 && bottoms.length === 0 && shoes.length === 0) return;

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

    const pickedShoes =
      shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null;

    setSelectedProducts([pickedTop, pickedBottom, pickedShoes].filter(Boolean));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);

    if (nextMode === "automatic") {
      generateAutomaticFit();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] px-3 pt-4 pb-6 sm:px-5 lg:px-7">
      <style>
        {`
          @keyframes saintFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }

          @keyframes saintFade {
            from { opacity: 0; transform: translateY(8px) scale(0.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
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
            border-radius: 999px;
          }
        `}
      </style>

      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 rounded-[28px] border border-black/10 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
                Saint Clothing
              </p>

              <h1 className="mt-1 text-3xl font-black uppercase tracking-[-0.05em] text-black sm:text-5xl">
                Style Builder
              </h1>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500">
                Build a fit manually or generate a smart outfit from your
                product collection.
              </p>
            </div>

            <div className="flex w-full rounded-full bg-black p-1 shadow-lg shadow-black/10 sm:w-auto">
              <button
                onClick={() => handleModeChange("manual")}
                className={`flex-1 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition sm:flex-none ${
                  mode === "manual"
                    ? "bg-white text-black"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Manual
              </button>

              <button
                onClick={() => handleModeChange("automatic")}
                className={`flex-1 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition sm:flex-none ${
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

        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
          <section className="flex min-w-0 flex-col rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.05)] sm:p-5 xl:h-[calc(100vh-138px)]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">
                  Collection
                </p>

                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-black">
                  Pick Your Pieces
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <p className="rounded-full bg-gray-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {filteredProducts.length} items
                </p>

                {selectedProducts.length > 0 && (
                  <button
                    onClick={clearFit}
                    className="rounded-full bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 transition hover:bg-red-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto border-b border-gray-100 pb-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
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
                className="mb-4 w-full rounded-[18px] bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-gray-800"
              >
                Generate New Automatic Fit
              </button>
            )}

            <div className="saint-scroll min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((item) => {
                  const active = selectedProducts.some(
                    (p) => p._id === item._id
                  );
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
                        className={`relative overflow-hidden rounded-[22px] bg-[#f5f5f3] transition duration-300 ${
                          active
                            ? "ring-2 ring-black ring-offset-2"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="aspect-[3/4]">
                          <img
                            src={getProductImage(item)}
                            alt={item.name}
                            className="h-full w-full object-contain p-3 mix-blend-multiply transition duration-500 group-hover:scale-105"
                          />
                        </div>

                        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-gray-600 shadow-sm">
                          {type}
                        </span>

                        {active && (
                          <span className="absolute right-2 top-2 rounded-full bg-black px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white">
                            Picked
                          </span>
                        )}
                      </div>

                      <div className="pt-2.5">
                        <p className="line-clamp-1 text-xs font-black uppercase tracking-tight text-black">
                          {item.name}
                        </p>

                        <p className="mt-1 line-clamp-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {item.category}
                        </p>

                        <p className="mt-1.5 text-xs font-black text-black">
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

          <aside className="flex rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.05)] xl:h-[calc(100vh-138px)] xl:flex-col xl:sticky xl:top-4">
            <div className="flex min-h-0 w-full flex-col">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">
                    Live Preview
                  </p>

                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-black">
                    2D Fit
                  </h2>
                </div>

                <p className="rounded-full bg-gray-100 px-3.5 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
                  {mode}
                </p>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3 rounded-[20px] bg-gray-50 px-3 py-2.5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Background
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={previewBg}
                    onChange={(e) => setPreviewBg(e.target.value)}
                    title="Pick custom background"
                    className="h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-gray-300 bg-white p-0"
                  />

                  {PREVIEW_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.name}
                      onClick={() => setPreviewBg(bg.color)}
                      title={bg.name}
                      className={`h-7 w-7 rounded-full border transition ${
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
                className="relative flex min-h-[460px] flex-1 items-center justify-center overflow-hidden rounded-[28px] transition-colors duration-500"
                style={{ backgroundColor: previewBg }}
              >
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p
                    className={`select-none text-[90px] font-black uppercase tracking-[-0.08em] ${
                      isDarkPreview ? "text-white/[0.04]" : "text-black/[0.018]"
                    }`}
                  >
                    SAINT
                  </p>
                </div>

                <div className="saint-float relative h-[510px] w-[300px] scale-[0.88] sm:scale-[0.9] xl:scale-[0.86] 2xl:scale-[0.88]">
                  <div
                    className="absolute left-1/2 -translate-x-1/2 transition duration-300 ease-out"
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
                        style={getOutfitStyle(
                          selectedTop,
                          outfitLayout.top.scale,
                          outfitLayout.top
                        )}
                        className="saint-fade h-full w-full object-contain mix-blend-multiply transition duration-300"
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
                    className="absolute left-1/2 -translate-x-1/2 transition duration-300 ease-out"
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
                        style={getOutfitStyle(
                          selectedBottom,
                          outfitLayout.bottom.scale,
                          outfitLayout.bottom
                        )}
                        className="saint-fade h-full w-full object-contain mix-blend-multiply transition duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-300">
                          Bottom
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`absolute left-1/2 h-5 w-[120px] -translate-x-1/2 rounded-full blur-md ${
                      isDarkPreview ? "bg-white/15" : "bg-black/10"
                    }`}
                    style={{ top: `${outfitLayout.shoes.top + 18}px` }}
                  />

                  <div
                    className="absolute left-1/2 -translate-x-1/2 transition duration-300 ease-out"
                    style={{
                      top: `${outfitLayout.shoes.top}px`,
                      height: `${outfitLayout.shoes.height}px`,
                      width: `${outfitLayout.shoes.width}px`,
                    }}
                  >
                    {selectedShoes ? (
                      <img
                        key={selectedShoes._id}
                        src={getProductImage(selectedShoes)}
                        alt={selectedShoes.name}
                        style={getOutfitStyle(
                          selectedShoes,
                          outfitLayout.shoes.scale,
                          outfitLayout.shoes
                        )}
                        className="saint-fade h-full w-full object-contain mix-blend-multiply transition duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-300">
                          Shoes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-[22px] bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                    Picked Items
                  </p>

                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {selectedProducts.length}/3
                  </p>
                </div>

                {selectedProducts.length === 0 ? (
                  <div className="rounded-[16px] bg-white px-4 py-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      No products picked
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedProducts.map((item) => {
                      const type = getProductType(item);

                      return (
                        <div
                          key={item._id}
                          className="flex w-full items-center gap-3 rounded-[18px] bg-white p-2.5 text-left transition hover:bg-gray-100"
                        >
                          <img
                            src={getProductImage(item)}
                            alt={item.name}
                            className="h-12 w-10 rounded-xl bg-gray-50 object-contain p-1 mix-blend-multiply"
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
                              className="rounded-full bg-red-50 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-red-500"
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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StyleBuilder;