import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import { assets } from "../assets/assets";
import useRecommendations from "../hooks/useRecommendations";

const Collection = () => {
  const {
    products,
    search,
    showSearch,
    user,
    backendUrl,
    categoryOptions,
  } = useContext(ShopContext);

  const location = useLocation();
  const navigate = useNavigate();

  const queryCategory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("category") || "";
  }, [location.search]);

  const [showFilter, setShowFilter] = useState(false);
  const [category, setCategory] = useState(queryCategory);
  const [colorFilter, setColorFilter] = useState([]);
  const [sortType, setSortType] = useState("relavent");
  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 20;

  const categories = useMemo(() => categoryOptions || [], [categoryOptions]);

  const favoriteCategories = useMemo(
    () => user?.preferences?.favoriteCategories || [],
    [user]
  );

  const availableColors = useMemo(() => {
    return [...new Set((products || []).map((p) => p.color).filter(Boolean))];
  }, [products]);

  useEffect(() => {
    setCategory(queryCategory);
    setCurrentPage(1);
  }, [queryCategory]);

  const updateCategory = (cat) => {
    setCategory(cat);
    setCurrentPage(1);

    if (cat) {
      navigate(`/collection?category=${encodeURIComponent(cat)}`, {
        replace: true,
      });
    } else {
      navigate("/collection", { replace: true });
    }
  };

  const toggleColor = (value) => {
    setColorFilter((prev) =>
      prev.includes(value)
        ? prev.filter((i) => i !== value)
        : [...prev, value]
    );
  };

  const getEffectivePrice = (item) => {
    const base = Number(item.price || 0);
    const sale = Number(item.salePercent || 0);
    return item.onSale && sale > 0 ? base - (base * sale) / 100 : base;
  };

  const filteredProducts = useMemo(() => {
    let list = [...(products || [])].filter((item) => item && !item.isDeleted);

    if (showSearch && search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.color?.toLowerCase().includes(q)
      );
    }

    if (category) {
      list = list.filter((p) => p.category === category);
    }

    if (colorFilter.length > 0) {
      list = list.filter((p) => colorFilter.includes(p.color));
    }

    if (sortType === "low-high") {
      list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortType === "high-low") {
      list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }

    return list;
  }, [products, search, showSearch, category, colorFilter, sortType]);

  const { recommendations: styleRecommendations } = useRecommendations({
    backendUrl,
    products,
    category: category || favoriteCategories[0] || categories[0] || "Tshirt",
    color: colorFilter[0] || "",
    userId: user?._id || null,
    limit: 4,
    enabled: true,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, showSearch, category, colorFilter, sortType]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const start = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(start, start + productsPerPage);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setCategory("");
    setColorFilter([]);
    navigate("/collection", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] px-3 pb-10 pt-4 font-['Outfit'] sm:px-5 md:px-8 lg:px-10 xl:px-12">
      {/* ================= HEADER ================= */}
      <div className="mb-5 border border-black/10 bg-white px-4 py-5 shadow-sm sm:px-5 md:px-6 rounded-[5px]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
              Saint Clothing Store
            </p>

            <Title text1="THE" text2="ARCHIVE" />

            <p className="mt-3 max-w-xl text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
              Essential Silhouettes & Modern Uniforms
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-[5px] border border-black/10 bg-[#F7F7F4] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-black">
                {filteredProducts.length} Items
              </span>

              {category && (
                <span className="rounded-[5px] bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                  Showing: {category}
                </span>
              )}

              {colorFilter.length > 0 && (
                <span className="rounded-[5px] border border-black/10 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                  {colorFilter.length} Color Filter
                  {colorFilter.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="h-11 w-full cursor-pointer rounded-[5px] border border-black bg-black px-4 text-[10px] font-black uppercase tracking-[0.18em] text-white outline-none transition-all hover:bg-white hover:text-black sm:min-w-[230px]"
            >
              <option value="relavent">
                {favoriteCategories.length > 0
                  ? "SORT: FOR YOU"
                  : "SORT: RELEVANCE"}
              </option>
              <option value="low-high">PRICE: LOW TO HIGH</option>
              <option value="high-low">PRICE: HIGH TO LOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= RECOMMENDATIONS ================= */}
      {styleRecommendations.length > 0 && (
        <div className="mb-5 rounded-[5px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Style Recommendations
              </p>
              <h2 className="mt-1 text-lg font-black uppercase tracking-[-0.03em] text-black">
                Wear It With
              </h2>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Curated For This Archive
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {styleRecommendations.map((item) => (
              <ProductItem key={item._id} {...item} badgeMode="none" />
            ))}
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* ================= FILTERS ================= */}
        <div className="w-full shrink-0 lg:w-[210px] xl:w-[230px]">
          <div
            onClick={() => setShowFilter(!showFilter)}
            className="flex cursor-pointer items-center justify-between rounded-[5px] border border-black/10 bg-white px-4 py-3 shadow-sm lg:cursor-default"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black">
              Filters
            </p>

            <img
              className={`h-2 transition lg:hidden ${
                showFilter ? "rotate-180" : ""
              }`}
              src={assets.dropdown_icon}
              alt=""
            />
          </div>

          <div
            className={`${
              showFilter ? "block" : "hidden"
            } mt-3 lg:sticky lg:top-[96px] lg:block`}
          >
            <div className="rounded-[5px] border border-black/10 bg-white p-4 shadow-sm">
              <div className="border-b border-black/10 pb-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                  Category
                </p>

                <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-2 transition hover:bg-[#F7F7F4]">
                  <input
                    type="radio"
                    checked={category === ""}
                    onChange={() => updateCategory("")}
                    className="accent-black"
                  />
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-black">
                    All
                  </span>
                </label>

                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <label
                      key={cat}
                      className="mb-2 flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-2 transition hover:bg-[#F7F7F4]"
                    >
                      <input
                        type="radio"
                        checked={category === cat}
                        onChange={() => updateCategory(cat)}
                        className="accent-black"
                      />
                      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-black">
                        {cat}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="rounded-[5px] bg-[#F7F7F4] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                    No categories found
                  </p>
                )}
              </div>

              <div className="border-b border-black/10 py-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                  Color
                </p>

                {availableColors.length > 0 ? (
                  availableColors.map((c) => (
                    <label
                      key={c}
                      className="mb-2 flex cursor-pointer items-center justify-between gap-2 rounded-[5px] px-2 py-2 transition hover:bg-[#F7F7F4]"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={colorFilter.includes(c)}
                          onChange={() => toggleColor(c)}
                          className="accent-black"
                        />
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-black">
                          {c}
                        </span>
                      </div>

                      <span
                        className="h-4 w-4 rounded-[5px] border border-black/20"
                        style={{ backgroundColor: c }}
                      />
                    </label>
                  ))
                ) : (
                  <p className="rounded-[5px] bg-[#F7F7F4] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                    No colors found
                  </p>
                )}
              </div>

              {(category || colorFilter.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 h-10 w-full rounded-[5px] bg-black text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black border border-black"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= PRODUCTS ================= */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-col gap-2 rounded-[5px] border border-black/10 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
              Collection Grid
            </p>

            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Page {currentPage} of {totalPages || 1}
            </p>
          </div>

          {currentProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {currentProducts.map((item) => (
                <ProductItem key={item._id} {...item} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[340px] items-center justify-center rounded-[5px] border border-black/10 bg-white shadow-sm">
              <div className="px-5 text-center">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-black">
                  No products found
                </p>
                <p className="mt-2 text-xs font-semibold text-gray-400">
                  Try clearing the filters.
                </p>

                <button
                  onClick={clearFilters}
                  className="mt-5 rounded-[5px] border border-black bg-black px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 rounded-[5px] border border-black/10 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`h-10 rounded-[5px] border px-4 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                    currentPage === i + 1
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black hover:border-black"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10 rounded-[5px] border border-black/10 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;