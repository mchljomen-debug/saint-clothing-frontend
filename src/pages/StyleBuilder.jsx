import React, { useContext, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";
import useRecommendations from "../hooks/useRecommendations";

const CATEGORIES = ["All", "Tshirt", "Long Sleeve", "Jorts", "Mesh Shorts", "Crop Jersey"];

const StyleBuilder = () => {
  const { products, backendUrl, currency, token, user } = useContext(ShopContext);

  const [mode, setMode] = useState("automatic");
  const [category, setCategory] = useState("All");
  const [selectedProducts, setSelectedProducts] = useState([]);

  const selectedIds = useMemo(
    () => selectedProducts.map((item) => item._id),
    [selectedProducts]
  );

  const { recommendations, loadingRecommendations } = useRecommendations({
    backendUrl,
    products,
    productIds: selectedIds,
    userId: user?._id || null,
    limit: 10,
    enabled: mode === "automatic" && selectedProducts.length > 0,
  });

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products
      .filter((item) => item && !item.isDeleted)
      .filter((item) => category === "All" || item.category === category);
  }, [products, category]);

  const addToFit = (product) => {
    if (!product?._id) return;

    setSelectedProducts((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      if (exists) return prev.filter((item) => item._id !== product._id);

      return [...prev, product].slice(0, 4);
    });
  };

  const removeFromFit = (id) => {
    setSelectedProducts((prev) => prev.filter((item) => item._id !== id));
  };

  const clearFit = () => {
    setSelectedProducts([]);
  };

  const finalSuggestions =
    mode === "automatic" ? recommendations : selectedProducts;

  return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-16 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
            Saint Clothing
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-black sm:text-5xl">
            Style Builder
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium text-gray-500">
            Choose products from the collection and build a complete fit.
            Switch between automatic recommendations or manual styling.
          </p>
        </div>

        <div className="flex rounded-full border border-black bg-black p-1">
          <button
            onClick={() => setMode("automatic")}
            className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-widest transition ${
              mode === "automatic"
                ? "bg-white text-black"
                : "text-white hover:bg-white/10"
            }`}
          >
            Automatic
          </button>

          <button
            onClick={() => setMode("manual")}
            className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-widest transition ${
              mode === "manual"
                ? "bg-white text-black"
                : "text-white hover:bg-white/10"
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* LEFT COLLECTION */}
        <aside className="rounded-[28px] border border-gray-200 bg-gray-50 p-4 sm:p-5 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black">
              Collection
            </h2>

            {selectedProducts.length > 0 && (
              <button
                onClick={clearFit}
                className="text-xs font-bold uppercase text-red-500"
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

          <div className="grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
            {filteredProducts.map((item) => {
              const active = selectedProducts.some((p) => p._id === item._id);

              return (
                <button
                  key={item._id}
                  onClick={() => addToFit(item)}
                  className={`group overflow-hidden rounded-[20px] border bg-white text-left transition ${
                    active
                      ? "border-black shadow-lg"
                      : "border-gray-200 hover:border-black"
                  }`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <img
                      src={item.image?.[0] || item.images?.[0]}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    {active && (
                      <span className="absolute right-2 top-2 rounded-full bg-black px-2.5 py-1 text-[10px] font-black uppercase text-white">
                        Added
                      </span>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="line-clamp-1 text-xs font-black uppercase text-black">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-gray-400">
                      {item.category}
                    </p>
                    <p className="mt-2 text-xs font-black text-black">
                      {currency}
                      {item.price}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT STYLE PREVIEW */}
        <main className="space-y-7">
          <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">
                  Outfit Preview
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase text-black">
                  Build Your Fit
                </h2>
              </div>

              <p className="rounded-full bg-gray-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500">
                {selectedProducts.length}/4 Selected
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              {/* HUMAN PREVIEW AREA */}
              <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-gray-100 to-white">
                <div className="absolute text-[120px] font-black uppercase text-black/[0.03] sm:text-[150px]">
                  SAINT
                </div>

                <div className="relative flex h-[460px] w-[190px] flex-col items-center">
                  <div className="h-20 w-20 rounded-full border border-gray-300 bg-white shadow-sm" />

                  <div className="mt-3 flex h-36 w-36 items-center justify-center overflow-hidden rounded-[28px] border border-gray-300 bg-white shadow-sm">
                    {selectedProducts[0] ? (
                      <img
                        src={
                          selectedProducts[0].image?.[0] ||
                          selectedProducts[0].images?.[0]
                        }
                        alt={selectedProducts[0].name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Top
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex h-40 w-32 items-center justify-center overflow-hidden rounded-[24px] border border-gray-300 bg-white shadow-sm">
                    {selectedProducts[1] ? (
                      <img
                        src={
                          selectedProducts[1].image?.[0] ||
                          selectedProducts[1].images?.[0]
                        }
                        alt={selectedProducts[1].name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Bottom
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex gap-4">
                    <div className="h-28 w-8 rounded-full border border-gray-300 bg-white" />
                    <div className="h-28 w-8 rounded-full border border-gray-300 bg-white" />
                  </div>
                </div>
              </div>

              {/* SELECTED PRODUCTS */}
              <div>
                <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-black">
                  Selected Pieces
                </h3>

                {selectedProducts.length === 0 ? (
                  <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <div>
                      <p className="text-lg font-black uppercase text-black">
                        No pieces selected
                      </p>
                      <p className="mt-2 text-sm font-medium text-gray-500">
                        Choose products from the left side to start building.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedProducts.map((item, index) => (
                      <div
                        key={item._id}
                        className="flex gap-3 rounded-[22px] border border-gray-200 bg-gray-50 p-3"
                      >
                        <img
                          src={item.image?.[0] || item.images?.[0]}
                          alt={item.name}
                          className="h-24 w-20 rounded-[16px] object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Piece {index + 1}
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm font-black uppercase text-black">
                            {item.name}
                          </p>
                          <p className="text-xs font-bold text-gray-500">
                            {item.category}
                          </p>
                          <p className="mt-1 text-sm font-black text-black">
                            {currency}
                            {item.price}
                          </p>

                          <button
                            onClick={() => removeFromFit(item._id)}
                            className="mt-2 text-[11px] font-black uppercase text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!token && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-bold text-amber-700">
                      Login to save better style signals and get more accurate
                      recommendations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* RECOMMENDATIONS */}
          <section className="rounded-[32px] border border-gray-200 bg-gray-50 p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">
                  {mode === "automatic" ? "Automatic Matches" : "Manual Picks"}
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase text-black">
                  Complete The Fit
                </h2>
              </div>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-sm font-bold text-gray-500">
                  Select at least one product to see outfit suggestions.
                </p>
              </div>
            ) : loadingRecommendations ? (
              <div className="rounded-[24px] bg-white p-8 text-center">
                <p className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Loading recommendations...
                </p>
              </div>
            ) : finalSuggestions.length === 0 ? (
              <div className="rounded-[24px] bg-white p-8 text-center">
                <p className="text-sm font-bold text-gray-500">
                  No suggestions found yet.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3">
                {finalSuggestions.map((item) => (
                  <div
                    key={item._id}
                    className="w-[180px] shrink-0 sm:w-[220px]"
                  >
                    <ProductItem
                      id={item._id}
                      image={item.image || item.images}
                      name={item.name}
                      price={item.price}
                      onSale={item.onSale}
                      salePercent={item.salePercent}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default StyleBuilder;