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

const getProductImage = (item) => {
  if (item?.outfitImage) return item.outfitImage;
  if (Array.isArray(item?.images) && item.images.length > 0) return item.images[0];
  if (Array.isArray(item?.image) && item.image.length > 0) return item.image[0];
  if (typeof item?.images === "string") return item.images;
  if (typeof item?.image === "string") return item.image;
  return "/placeholder.png";
};

const getOutfitStyle = (item) => {
  const position = item?.outfitPosition || {};
  const x = Number(position.x || 0);
  const y = Number(position.y || 0);
  const scale = Number(position.scale || 1);

  return {
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
  };
};

const getProductType = (product) => {
  const section = String(product?.recommendationSection || "").toLowerCase();

  if (["top", "bottom", "both", "shoes"].includes(section)) return section;

  const text = `${product?.category || ""} ${product?.name || ""} ${
    product?.subCategory || ""
  }`.toLowerCase();

  if (TOP_KEYWORDS.some((word) => text.includes(word))) return "top";
  if (BOTTOM_KEYWORDS.some((word) => text.includes(word))) return "bottom";
  if (SHOES_KEYWORDS.some((word) => text.includes(word))) return "shoes";

  return "other";
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
    topTags.map((t) => String(t).toLowerCase()).includes(String(tag).toLowerCase())
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

  const selectedShoes = selectedProducts.find((item) => {
    const type = getProductType(item);
    return type === "shoes";
  });

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
          ...prev.filter((item) => {
            const type = getProductType(item);
            return type !== "top" && type !== "both";
          }),
          product,
        ];
      }

      if (productType === "bottom") {
        return [
          ...prev.filter((item) => {
            const type = getProductType(item);
            return type !== "bottom" && type !== "both";
          }),
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

    const shoes = cleanProducts.filter((item) => getProductType(item) === "shoes");

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

      const sortedPairs = pairs.sort((a, b) => b.score - a.score);
      const bestPairs = sortedPairs.slice(0, Math.min(8, sortedPairs.length));
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
    <div className="min-h-screen bg-white px-4 pt-6 pb-16 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <div className="mb-7 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
            Saint Clothing
          </p>

          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-black sm:text-5xl">
            Style Builder
          </h1>

          <p className="mt-3 max-w-xl text-sm font-medium text-gray-500">
            Pick products manually or let Saint automatically build a clean outfit.
          </p>
        </div>

        <div className="flex w-full rounded-full border border-black bg-black p-1 sm:w-auto">
          <button
            onClick={() => handleModeChange("manual")}
            className={`flex-1 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest transition sm:flex-none ${
              mode === "manual"
                ? "bg-white text-black"
                : "text-white hover:bg-white/10"
            }`}
          >
            Manual
          </button>

          <button
            onClick={() => handleModeChange("automatic")}
            className={`flex-1 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest transition sm:flex-none ${
              mode === "automatic"
                ? "bg-white text-black"
                : "text-white hover:bg-white/10"
            }`}
          >
            Automatic
          </button>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[390px_1fr]">
        <aside className="rounded-[30px] border border-gray-200 bg-gray-50 p-4 sm:p-5 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">
                Left Section
              </p>

              <h2 className="mt-1 text-lg font-black uppercase text-black">
                Collection
              </h2>
            </div>

            {selectedProducts.length > 0 && (
              <button
                onClick={clearFit}
                className="rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase text-red-500 shadow-sm"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-widest transition ${
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
              className="mb-4 w-full rounded-2xl bg-black px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-gray-800"
            >
              Generate Random Best Pick
            </button>
          )}

          <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
            {filteredProducts.map((item) => {
              const active = selectedProducts.some((p) => p._id === item._id);
              const type = getProductType(item);

              return (
                <button
                  key={item._id}
                  onClick={() => addToFit(item)}
                  disabled={mode === "automatic"}
                  className={`flex w-full items-center gap-3 rounded-[20px] border bg-white p-3 text-left transition ${
                    active
                      ? "border-black shadow-md"
                      : "border-gray-200 hover:border-black"
                  } ${
                    mode === "automatic"
                      ? "cursor-default opacity-90"
                      : "cursor-pointer"
                  }`}
                >
                  <img
                    src={getProductImage(item)}
                    alt={item.name}
                    className="h-16 w-14 rounded-2xl bg-gray-50 object-contain p-1 mix-blend-multiply"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-black uppercase text-black">
                      {item.name}
                    </p>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {item.category} • {type}
                    </p>

                    <p className="mt-1 text-xs font-black text-black">
                      {currency}
                      {getFinalPrice(item).toLocaleString()}
                    </p>
                  </div>

                  {active && (
                    <span className="rounded-full bg-black px-3 py-1 text-[9px] font-black uppercase text-white">
                      Picked
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="rounded-[34px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">
                Right Section
              </p>

              <h2 className="mt-1 text-2xl font-black uppercase text-black">
                2D Human Preview
              </h2>
            </div>

            <p className="w-fit rounded-full bg-gray-100 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-500">
              {mode === "manual" ? "Manual Mode" : "Automatic Mode"}
            </p>
          </div>

          <div className="relative flex min-h-[760px] items-center justify-center overflow-hidden rounded-[34px] bg-gray-50">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[150px] font-black uppercase tracking-tight text-black/[0.035] sm:text-[220px]">
                SAINT
              </p>
            </div>

            <div className="relative h-[720px] w-[430px]">
              <div className="absolute left-1/2 top-[20px] h-[82px] w-[82px] -translate-x-1/2 rounded-full border border-gray-300 bg-white shadow-sm" />

              <div className="absolute left-1/2 top-[95px] h-[35px] w-[38px] -translate-x-1/2 rounded-b-2xl border-x border-b border-gray-300 bg-white" />

              <div className="absolute left-1/2 top-[125px] h-[470px] w-[260px] -translate-x-1/2 rounded-[120px] border border-dashed border-gray-300 bg-white/40" />

              <div className="absolute left-1/2 top-[115px] h-[270px] w-[350px] -translate-x-1/2">
                {selectedTop ? (
                  <img
                    src={getProductImage(selectedTop)}
                    alt={selectedTop.name}
                    style={getOutfitStyle(selectedTop)}
                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[30px] border border-dashed border-gray-300 bg-white/80">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Select Top
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute left-1/2 top-[365px] h-[250px] w-[310px] -translate-x-1/2">
                {selectedBottom ? (
                  <img
                    src={getProductImage(selectedBottom)}
                    alt={selectedBottom.name}
                    style={getOutfitStyle(selectedBottom)}
                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[30px] border border-dashed border-gray-300 bg-white/80">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Select Bottom
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute left-1/2 top-[610px] h-[90px] w-[260px] -translate-x-1/2">
                {selectedShoes ? (
                  <img
                    src={getProductImage(selectedShoes)}
                    alt={selectedShoes.name}
                    style={getOutfitStyle(selectedShoes)}
                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[26px] border border-dashed border-gray-300 bg-white/80">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Shoes Slot
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-gray-200 bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black">
                Picked Products
              </h3>

              <p className="text-xs font-black uppercase text-gray-400">
                {selectedProducts.length} selected
              </p>
            </div>

            {selectedProducts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm font-bold text-gray-500">
                No products picked yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {selectedProducts.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-3 rounded-[22px] border border-gray-200 bg-white p-3"
                  >
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="h-20 w-16 rounded-[16px] bg-gray-50 object-contain p-1 mix-blend-multiply"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {getProductType(item)}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs font-black uppercase text-black">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs font-black text-black">
                        {currency}
                        {getFinalPrice(item).toLocaleString()}
                      </p>

                      {mode === "manual" && (
                        <button
                          onClick={() =>
                            setSelectedProducts((prev) =>
                              prev.filter((p) => p._id !== item._id)
                            )
                          }
                          className="mt-1 text-[10px] font-black uppercase text-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StyleBuilder;