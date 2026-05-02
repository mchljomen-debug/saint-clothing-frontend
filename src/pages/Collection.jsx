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
    <div className="pt-[20px] px-4 sm:px-5 md:px-8 lg:px-12 xl:px-16 pb-12 min-h-screen bg-gradient-to-b from-white via-gray-50 to-white font-['Outfit']">
      <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-end mb-8 pb-5 border-b">
        <div>
          <Title text1="THE" text2="ARCHIVE" />
          <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-[0.4em]">
            Essential Silhouettes & Modern Uniforms
          </p>

          {category && (
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-black">
              Showing: {category}
            </p>
          )}
        </div>

        <div className="w-full sm:w-auto flex justify-start md:justify-end">
          <div className="w-[170px] sm:w-auto md:min-w-[220px]">
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[220px] bg-black text-white h-[40px] sm:h-[46px] px-3 sm:px-5 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.12em] sm:tracking-[0.2em] cursor-pointer hover:bg-gray-800 transition-all rounded-[10px]"
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

      {styleRecommendations.length > 0 && (
        <div className="mb-10 border rounded-[18px] p-4 sm:p-6 bg-white">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
            Style Recommendations
          </p>
          <h2 className="text-lg font-black mt-2 uppercase">Wear It With</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {styleRecommendations.map((item) => (
              <ProductItem key={item._id} {...item} badgeMode="none" />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-[180px] xl:w-[200px] shrink-0 lg:self-start">
          <div
            onClick={() => setShowFilter(!showFilter)}
            className="flex justify-between border-b pb-2 cursor-pointer lg:cursor-default"
          >
            <p className="text-[10px] font-black tracking-[0.25em] uppercase">
              Filters
            </p>

            <img
              className={`h-2 lg:hidden ${showFilter ? "rotate-180" : ""}`}
              src={assets.dropdown_icon}
              alt=""
            />
          </div>

          <div
            className={`${
              showFilter ? "block" : "hidden"
            } lg:block mt-6 lg:sticky lg:top-[96px]`}
          >
            <div className="rounded-[16px] border border-black/10 bg-[#FAFAF8] p-3 space-y-5">
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-3 tracking-[0.2em]">
                  Category
                </p>

                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked={category === ""}
                    onChange={() => updateCategory("")}
                    className="accent-black"
                  />
                  <span className="text-[10px] uppercase">All</span>
                </label>

                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={category === cat}
                        onChange={() => updateCategory(cat)}
                        className="accent-black"
                      />
                      <span className="text-[10px] uppercase">{cat}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-400 uppercase">
                    No categories found
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-3 tracking-[0.2em]">
                  Color
                </p>

                {availableColors.length > 0 ? (
                  availableColors.map((c) => (
                    <label key={c} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={colorFilter.includes(c)}
                        onChange={() => toggleColor(c)}
                        className="accent-black"
                      />
                      <span className="text-[10px] uppercase">{c}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-400 uppercase">
                    No colors found
                  </p>
                )}
              </div>

              {(category || colorFilter.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-[10px] uppercase bg-black text-white rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          {currentProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {currentProducts.map((item) => (
                <ProductItem key={item._id} {...item} />
              ))}
            </div>
          ) : (
            <div className="min-h-[300px] flex items-center justify-center border border-black/10 rounded-[18px] bg-white">
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.2em]">
                  No products found
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Try clearing the filters.
                </p>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2 flex-wrap">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-40"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`px-4 py-2 border rounded ${
                    currentPage === i + 1
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-40"
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