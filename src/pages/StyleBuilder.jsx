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

      <div className="grid gap-7 lg:grid-cols-[1fr_300px]">
        <aside className="bg-white">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">
                Collection
              </p>

              <h2 className="mt-1 text-xl font-black uppercase text-black">
                Pick Your Pieces
              </h2>
            </div>

            {selectedProducts.length > 0 && (
              <button
                onClick={clearFit}
                className="rounded-full bg-gray-100 px-4 py-2 text-[11px] font-black uppercase text-red-500"
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
              className="mb-5 w-full rounded-2xl bg-black px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-gray-800"
            >
              Generate Random Best Pick
            </button>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((item) => {
              const active = selectedProducts.some((p) => p._id === item._id);
              const type = getProductType(item);

              return (
                <button
                  key={item._id}
                  onClick={() => addToFit(item)}
                  disabled={mode === "automatic"}
                  className={`group overflow-hidden rounded-[22px] border bg-white text-left transition ${
                    active
                      ? "border-black shadow-md"
                      : "border-gray-200 hover:border-black"
                  } ${
                    mode === "automatic"
                      ? "cursor-default opacity-90"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="relative aspect-[3/4] bg-gray-50">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="h-full w-full object-contain p-3 mix-blend-multiply transition duration-500 group-hover:scale-105"
                    />

                    {active && (
                      <span className="absolute right-2 top-2 rounded-full bg-black px-3 py-1 text-[9px] font-black uppercase text-white">
                        Picked
                      </span>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="line-clamp-1 text-xs font-black uppercase text-black">
                      {item.name}
                    </p>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {item.category} • {type}
                    </p>

                    <p className="mt-2 text-xs font-black text-black">
                      {currency}
                      {getFinalPrice(item).toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="bg-white p-0 lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">
              Preview
            </p>

            <h2 className="mt-1 text-lg font-black uppercase text-black">
              2D Fit
            </h2>
          </div>

          <div className="relative flex min-h-[520px] items-center justify-center overflow-visible bg-white">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[90px] font-black uppercase tracking-tight text-black/[0.025]">
                SAINT
              </p>
            </div>

            <div className="relative h-[500px] w-[270px]">
              <div className="absolute left-1/2 top-[10px] h-[55px] w-[55px] -translate-x-1/2 rounded-full bg-gray-100" />

              <div className="absolute left-1/2 top-[62px] h-[25px] w-[26px] -translate-x-1/2 rounded-b-2xl bg-gray-100" />

              <div className="absolute left-1/2 top-[85px] h-[345px] w-[155px] -translate-x-1/2 rounded-[90px] bg-gray-100/70" />

              <div className="absolute left-1/2 top-[80px] h-[190px] w-[240px] -translate-x-1/2">
                {selectedTop ? (
                  <img
                    src={getProductImage(selectedTop)}
                    alt={selectedTop.name}
                    style={getOutfitStyle(selectedTop)}
                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                      Select Top
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute left-1/2 top-[250px] h-[190px] w-[240px] -translate-x-1/2">
                {selectedBottom ? (
                  <img
                    src={getProductImage(selectedBottom)}
                    alt={selectedBottom.name}
                    style={getOutfitStyle(selectedBottom)}
                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                      Select Bottom
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute left-1/2 top-[410px] h-[80px] w-[240px] -translate-x-1/2">
                {selectedShoes ? (
                  <img
                    src={getProductImage(selectedShoes)}
                    alt={selectedShoes.name}
                    style={getOutfitStyle(selectedShoes)}
                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                      Shoes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3">
            {selectedProducts.length === 0 ? (
              <p className="text-center text-xs font-bold text-gray-400">
                No products picked.
              </p>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {selectedProducts.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2"
                  >
                    <span className="max-w-[120px] truncate text-[10px] font-black uppercase text-black">
                      {item.name}
                    </span>

                    {mode === "manual" && (
                      <button
                        onClick={() =>
                          setSelectedProducts((prev) =>
                            prev.filter((p) => p._id !== item._id)
                          )
                        }
                        className="text-[9px] font-black uppercase text-red-500"
                      >
                        x
                      </button>
                    )}
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