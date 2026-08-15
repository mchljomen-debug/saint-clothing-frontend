import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { ShopContext } from "../context/ShopContext";
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

  /* =========================================================
     URL CATEGORY
  ========================================================= */

  const queryCategory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("category") || "";
  }, [location.search]);

  /* =========================================================
     STATE
  ========================================================= */

  const [showFilter, setShowFilter] = useState(false);
  const [category, setCategory] = useState(queryCategory);
  const [colorFilter, setColorFilter] = useState([]);
  const [sortType, setSortType] = useState("relavent");
  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 20;

  /* =========================================================
     DATA
  ========================================================= */

  const categories = useMemo(
    () => categoryOptions || [],
    [categoryOptions]
  );

  const favoriteCategories = useMemo(
    () => user?.preferences?.favoriteCategories || [],
    [user]
  );

  const availableColors = useMemo(() => {
    return [
      ...new Set(
        (products || [])
          .filter((p) => p && !p.isDeleted)
          .map((p) => p.color)
          .filter(Boolean)
      ),
    ];
  }, [products]);

  /* =========================================================
     SYNC URL CATEGORY
  ========================================================= */

  useEffect(() => {
    setCategory(queryCategory);
    setCurrentPage(1);
  }, [queryCategory]);

  /* =========================================================
     CATEGORY
  ========================================================= */

  const updateCategory = (cat) => {
    setCategory(cat);
    setCurrentPage(1);

    if (cat) {
      navigate(
        `/collection?category=${encodeURIComponent(cat)}`,
        {
          replace: true,
        }
      );
    } else {
      navigate("/collection", {
        replace: true,
      });
    }
  };

  /* =========================================================
     COLOR FILTER
  ========================================================= */

  const toggleColor = (value) => {
    setColorFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  /* =========================================================
     PRICE
  ========================================================= */

  const getEffectivePrice = (item) => {
    const base = Number(item.price || 0);
    const sale = Number(item.salePercent || 0);

    return item.onSale && sale > 0
      ? base - (base * sale) / 100
      : base;
  };

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredProducts = useMemo(() => {
    let list = [...(products || [])].filter(
      (item) => item && !item.isDeleted
    );

    /* SEARCH */

    if (showSearch && search) {
      const q = search.toLowerCase();

      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.color?.toLowerCase().includes(q) ||
          p.groupCode?.toLowerCase().includes(q)
      );
    }

    /* CATEGORY */

    if (category) {
      list = list.filter(
        (p) => p.category === category
      );
    }

    /* COLOR */

    if (colorFilter.length > 0) {
      list = list.filter((p) =>
        colorFilter.includes(p.color)
      );
    }

    /* SORT */

    if (sortType === "low-high") {
      list.sort(
        (a, b) =>
          getEffectivePrice(a) -
          getEffectivePrice(b)
      );
    } else if (sortType === "high-low") {
      list.sort(
        (a, b) =>
          getEffectivePrice(b) -
          getEffectivePrice(a)
      );
    } else {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
    }

    return list;
  }, [
    products,
    search,
    showSearch,
    category,
    colorFilter,
    sortType,
  ]);

  /* =========================================================
     GROUP SAME PRODUCT

     This hides duplicate color variants from the collection.
     ProductItem can still display the available colors.
  ========================================================= */

  const groupedProducts = useMemo(() => {
    const map = new Map();

    filteredProducts.forEach((item) => {
      if (!item) return;

      const key = item.groupCode
        ? `group-${String(item.groupCode)
            .trim()
            .toLowerCase()}`
        : `single-${item._id}`;

      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    return Array.from(map.values());
  }, [filteredProducts]);

  /* =========================================================
     RECOMMENDATIONS
  ========================================================= */

  const {
    recommendations: styleRecommendations,
  } = useRecommendations({
    backendUrl,
    products,
    category:
      category ||
      favoriteCategories[0] ||
      categories[0] ||
      "Tshirt",
    color: colorFilter[0] || "",
    userId: user?._id || null,
    limit: 4,
    enabled: true,
  });

  /* =========================================================
     RESET PAGE
  ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    showSearch,
    category,
    colorFilter,
    sortType,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(
    groupedProducts.length / productsPerPage
  );

  const start =
    (currentPage - 1) * productsPerPage;

  const currentProducts =
    groupedProducts.slice(
      start,
      start + productsPerPage
    );

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setCategory("");
    setColorFilter([]);

    navigate("/collection", {
      replace: true,
    });
  };

  /* =========================================================
     ACTIVE FILTER COUNT
  ========================================================= */

  const activeFilterCount =
    (category ? 1 : 0) +
    colorFilter.length;

  return (
    <div className="min-h-screen bg-[#F4F3EE] px-3 pb-16 pt-4 font-['Outfit'] text-black sm:px-5 md:px-8 lg:px-10 xl:px-12">

      {/* =====================================================
          CLEAN COLLECTION HEADER
      ===================================================== */}

      <section className="border-b border-black pb-4 pt-2 sm:pb-5 sm:pt-3">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          {/* LEFT */}

          <div className="min-w-0">

            <div className="mb-2 flex items-center gap-3">

              <span className="h-1.5 w-1.5 rounded-full bg-black" />

              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-black/45">
                Saint Clothing / Collection
              </span>

              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-black/25">
                026
              </span>

            </div>

            <div className="flex items-end gap-3">

              <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.8] tracking-[-0.07em]">
                THE ARCHIVE
              </h1>

              <span className="mb-1 hidden text-[8px] font-black uppercase tracking-[0.2em] text-black/30 sm:block">
                / 01
              </span>

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex shrink-0 items-center gap-5 sm:pb-1">

            <div className="hidden border-l border-black/15 pl-5 sm:block">

              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-black/35">
                Current Selection
              </p>

              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em]">
                {category || "All Pieces"}
              </p>

            </div>

            <div className="border-l border-black/15 pl-5">

              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-black/35">
                Available
              </p>

              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em]">
                {groupedProducts.length} Pieces
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          COLLECTION META BAR
      ===================================================== */}

      <section className="border-b border-black/10 py-3">

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">

          <div className="flex flex-wrap items-center gap-3">

            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-black/40">
              Collection
            </span>

            <span className="text-[8px] text-black/20">
              /
            </span>

            <span className="text-[8px] font-black uppercase tracking-[0.18em]">
              {category || "All Pieces"}
            </span>

            {colorFilter.length > 0 && (
              <>
                <span className="text-[8px] text-black/20">
                  /
                </span>

                <span className="text-[8px] font-black uppercase tracking-[0.18em]">
                  {colorFilter.length} Color
                  {colorFilter.length > 1
                    ? "s"
                    : ""}
                </span>
              </>
            )}

            {showSearch && search && (
              <>
                <span className="text-[8px] text-black/20">
                  /
                </span>

                <span className="max-w-[180px] truncate text-[8px] font-black uppercase tracking-[0.18em] text-black/50">
                  Search: "{search}"
                </span>
              </>
            )}

          </div>

          <div className="flex items-center gap-3">

            <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-black/35">
              {groupedProducts.length} Results
            </span>

            <span className="h-1 w-1 rounded-full bg-black/25" />

            <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-black/35">
              {String(currentPage).padStart(2, "0")} /{" "}
              {String(totalPages || 1).padStart(2, "0")}
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          RECOMMENDATIONS
      ===================================================== */}

      {styleRecommendations.length > 0 && (
        <section className="mt-12 border-t border-black pt-5">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">

            {/* LABEL */}

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/40">
                02 / Recommendation
              </p>

              <h2 className="mt-3 text-2xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-3xl">
                WEAR
                <br />
                IT WITH
              </h2>

              <p className="mt-4 max-w-[190px] text-[9px] font-bold uppercase leading-[1.5] tracking-[0.15em] text-black/45">
                Curated pieces selected
                to complement your
                current archive.
              </p>

            </div>

            {/* PRODUCTS */}

            <div>

              <div className="mb-4 flex items-center justify-between border-b border-black/15 pb-3">

                <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                  Curated Selection
                </span>

                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                  04 Pieces
                </span>

              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">

                {styleRecommendations.map(
                  (item) => (
                    <ProductItem
                      key={item._id}
                      {...item}
                      badgeMode="none"
                    />
                  )
                )}

              </div>

            </div>

          </div>

        </section>
      )}

      {/* =====================================================
          MAIN COLLECTION
      ===================================================== */}

      <section className="mt-14 border-t border-black pt-5">

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">

          {/* =================================================
              FILTER COLUMN
          ================================================= */}

          <aside>

            {/* MOBILE FILTER HEADER */}

            <button
              type="button"
              onClick={() =>
                setShowFilter(!showFilter)
              }
              className="flex w-full items-center justify-between border-b border-black py-3 lg:hidden"
            >

              <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                Filter Collection
              </span>

              <div className="flex items-center gap-3">

                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[8px] font-black text-white">
                    {activeFilterCount}
                  </span>
                )}

                <img
                  src={assets.dropdown_icon}
                  alt=""
                  className={`h-2 w-2 transition-transform duration-300 ${
                    showFilter
                      ? "rotate-180"
                      : ""
                  }`}
                />

              </div>

            </button>

            {/* FILTER PANEL */}

            <div
              className={`${
                showFilter
                  ? "block"
                  : "hidden"
              } lg:sticky lg:top-[90px] lg:block`}
            >

              <div className="pt-5 lg:pt-0">

                {/* FILTER TITLE */}

                <div className="hidden border-b border-black pb-3 lg:block">

                  <div className="flex items-center justify-between">

                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                      Filter
                    </span>

                    {activeFilterCount > 0 && (
                      <span className="text-[9px] font-black uppercase tracking-[0.15em]">
                        {activeFilterCount} Active
                      </span>
                    )}

                  </div>

                </div>

                {/* CATEGORY */}

                <div className="border-b border-black/15 py-5">

                  <div className="mb-4 flex items-center justify-between">

                    <p className="text-[9px] font-black uppercase tracking-[0.25em]">
                      Category
                    </p>

                    <span className="text-[8px] font-bold text-black/30">
                      01
                    </span>

                  </div>

                  <div className="space-y-1">

                    {/* ALL */}

                    <label className="group flex cursor-pointer items-center justify-between py-2">

                      <div className="flex items-center gap-3">

                        <input
                          type="radio"
                          checked={
                            category === ""
                          }
                          onChange={() =>
                            updateCategory("")
                          }
                          className="peer sr-only"
                        />

                        <span className="flex h-3 w-3 items-center justify-center rounded-full border border-black">

                          <span
                            className={`h-1.5 w-1.5 rounded-full bg-black transition-transform ${
                              category === ""
                                ? "scale-100"
                                : "scale-0"
                            }`}
                          />

                        </span>

                        <span
                          className={`text-[9px] font-black uppercase tracking-[0.15em] transition ${
                            category === ""
                              ? "text-black"
                              : "text-black/45 group-hover:text-black"
                          }`}
                        >
                          All Pieces
                        </span>

                      </div>

                      <span className="text-[8px] font-bold text-black/25">
                        →
                      </span>

                    </label>

                    {categories.length > 0 ? (
                      categories.map(
                        (cat, index) => (
                          <label
                            key={cat}
                            className="group flex cursor-pointer items-center justify-between py-2"
                          >

                            <div className="flex items-center gap-3">

                              <input
                                type="radio"
                                checked={
                                  category ===
                                  cat
                                }
                                onChange={() =>
                                  updateCategory(
                                    cat
                                  )
                                }
                                className="peer sr-only"
                              />

                              <span className="flex h-3 w-3 items-center justify-center rounded-full border border-black">

                                <span
                                  className={`h-1.5 w-1.5 rounded-full bg-black transition-transform ${
                                    category ===
                                    cat
                                      ? "scale-100"
                                      : "scale-0"
                                  }`}
                                />

                              </span>

                              <span
                                className={`text-[9px] font-black uppercase tracking-[0.15em] transition ${
                                  category ===
                                  cat
                                    ? "text-black"
                                    : "text-black/45 group-hover:text-black"
                                }`}
                              >
                                {cat}
                              </span>

                            </div>

                            <span className="text-[8px] font-bold text-black/25">
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </span>

                          </label>
                        )
                      )
                    ) : (
                      <p className="py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-black/30">
                        No categories found
                      </p>
                    )}

                  </div>

                </div>

                {/* COLOR */}

                <div className="border-b border-black/15 py-5">

                  <div className="mb-4 flex items-center justify-between">

                    <p className="text-[9px] font-black uppercase tracking-[0.25em]">
                      Color
                    </p>

                    <span className="text-[8px] font-bold text-black/30">
                      02
                    </span>

                  </div>

                  {availableColors.length > 0 ? (
                    <div className="space-y-1">

                      {availableColors.map(
                        (color) => {
                          const active =
                            colorFilter.includes(
                              color
                            );

                          return (
                            <label
                              key={color}
                              className="group flex cursor-pointer items-center justify-between py-2"
                            >

                              <div className="flex items-center gap-3">

                                <input
                                  type="checkbox"
                                  checked={
                                    active
                                  }
                                  onChange={() =>
                                    toggleColor(
                                      color
                                    )
                                  }
                                  className="sr-only"
                                />

                                <span
                                  className={`flex h-3 w-3 items-center justify-center rounded-full border transition ${
                                    active
                                      ? "border-black"
                                      : "border-black/30"
                                  }`}
                                >

                                  <span
                                    className={`h-1.5 w-1.5 rounded-full bg-black transition-transform ${
                                      active
                                        ? "scale-100"
                                        : "scale-0"
                                    }`}
                                  />

                                </span>

                                <span
                                  className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                                    active
                                      ? "text-black"
                                      : "text-black/45 group-hover:text-black"
                                  }`}
                                >
                                  {color}
                                </span>

                              </div>

                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20"
                                style={{
                                  backgroundColor:
                                    color,
                                }}
                              />

                            </label>
                          );
                        }
                      )}

                    </div>
                  ) : (
                    <p className="py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-black/30">
                      No colors found
                    </p>
                  )}

                </div>

                {/* CLEAR */}

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 flex h-10 w-full items-center justify-between border border-black bg-black px-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
                  >

                    <span>
                      Clear Filters
                    </span>

                    <span>
                      ×
                    </span>

                  </button>
                )}

              </div>

            </div>

          </aside>

          {/* =================================================
              PRODUCT AREA
          ================================================= */}

          <div className="min-w-0">

            {/* PRODUCT HEADER */}

            <div className="mb-6 border-b border-black">

              <div className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/40">
                    03 / Product Archive
                  </p>

                  <h2 className="mt-2 text-2xl font-black uppercase leading-none tracking-[-0.05em] sm:text-3xl">
                    {category ||
                      "ALL PRODUCTS"}
                  </h2>

                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">

                  <label
                    htmlFor="collection-sort"
                    className="text-[8px] font-black uppercase tracking-[0.25em] text-black/35"
                  >
                    Sort Collection
                  </label>

                  <select
                    id="collection-sort"
                    value={sortType}
                    onChange={(e) =>
                      setSortType(
                        e.target.value
                      )
                    }
                    className="h-9 min-w-[190px] cursor-pointer border-b border-black bg-transparent px-0 text-[9px] font-black uppercase tracking-[0.18em] outline-none"
                  >

                    <option value="relavent">
                      {favoriteCategories.length >
                      0
                        ? "SORT: FOR YOU"
                        : "SORT: RELEVANCE"}
                    </option>

                    <option value="low-high">
                      PRICE: LOW TO HIGH
                    </option>

                    <option value="high-low">
                      PRICE: HIGH TO LOW
                    </option>

                  </select>

                </div>

              </div>

            </div>

            {/* SEARCH STATUS */}

            {showSearch && search && (
              <div className="mb-5 flex items-center justify-between border-b border-black/10 pb-3">

                <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                  Search Results
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/40">
                  "{search}"
                </p>

              </div>
            )}

            {/* =================================================
                PRODUCTS
            ================================================= */}

            {currentProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 sm:gap-y-12 md:grid-cols-3 xl:grid-cols-4">

                {currentProducts.map(
                  (item, index) => (
                    <div
                      key={item._id}
                      className="relative"
                    >

                      {/* EDITORIAL NUMBER */}

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-black/30">
                          {String(
                            start +
                              index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <span className="mx-2 h-px flex-1 bg-black/10" />

                        <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-black/25">
                          SC
                        </span>

                      </div>

                      <ProductItem
                        {...item}
                      />

                    </div>
                  )
                )}

              </div>
            ) : (
              /* =================================================
                 EMPTY STATE
              ================================================= */

              <div className="flex min-h-[420px] flex-col justify-between border-t border-black">

                <div className="pt-6">

                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-black/35">
                    Archive / Empty
                  </span>

                </div>

                <div className="pb-8">

                  <h3 className="text-[clamp(3rem,8vw,6rem)] font-black uppercase leading-[0.8] tracking-[-0.07em]">
                    NOTHING
                    <br />
                    FOUND
                  </h3>

                  <p className="mt-6 max-w-md text-[10px] font-bold uppercase leading-[1.5] tracking-[0.18em] text-black/40">
                    The selected filters
                    did not return any
                    pieces from the
                    current archive.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-6 inline-flex h-11 items-center gap-8 border border-black bg-black px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
                  >

                    <span>
                      Reset Collection
                    </span>

                    <span>
                      →
                    </span>

                  </button>

                </div>

              </div>
            )}

            {/* =================================================
                PAGINATION
            ================================================= */}

            {totalPages > 1 && (
              <div className="mt-14 border-t border-black pt-4">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  {/* PAGINATION INFO */}

                  <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.25em]">
                      Archive Navigation
                    </p>

                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">
                      {groupedProducts.length} Pieces
                      / {totalPages} Pages
                    </p>

                  </div>

                  {/* BUTTONS */}

                  <div className="flex flex-wrap items-center gap-1">

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage - 1
                        )
                      }
                      disabled={
                        currentPage === 1
                      }
                      className="flex h-9 items-center gap-3 border-b border-black px-3 text-[9px] font-black uppercase tracking-[0.18em] transition hover:bg-black hover:text-white disabled:pointer-events-none disabled:border-black/10 disabled:text-black/20"
                    >
                      ← Prev
                    </button>

                    <div className="mx-2 hidden h-4 w-px bg-black/20 sm:block" />

                    {Array.from(
                      {
                        length:
                          totalPages,
                      },
                      (_, index) => {
                        const page =
                          index + 1;

                        return (
                          <button
                            type="button"
                            key={page}
                            onClick={() =>
                              goToPage(
                                page
                              )
                            }
                            className={`flex h-9 min-w-9 items-center justify-center border px-2 text-[9px] font-black tracking-[0.1em] transition ${
                              currentPage ===
                              page
                                ? "border-black bg-black text-white"
                                : "border-transparent text-black/45 hover:border-black hover:text-black"
                            }`}
                          >
                            {String(
                              page
                            ).padStart(
                              2,
                              "0"
                            )}
                          </button>
                        );
                      }
                    )}

                    <div className="mx-2 hidden h-4 w-px bg-black/20 sm:block" />

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage + 1
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="flex h-9 items-center gap-3 border-b border-black px-3 text-[9px] font-black uppercase tracking-[0.18em] transition hover:bg-black hover:text-white disabled:pointer-events-none disabled:border-black/10 disabled:text-black/20"
                    >
                      Next →
                    </button>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          BOTTOM EDITORIAL SECTION
      ===================================================== */}

      <section className="mt-20 border-t border-black pt-5">

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/40">
              04 / Saint Clothing
            </p>

            <h2 className="mt-3 max-w-xl text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.8] tracking-[-0.07em]">
              BUILT FOR
              <br />
              EVERYDAY.
            </h2>

          </div>

          <div className="flex items-end">

            <p className="max-w-md text-[10px] font-bold uppercase leading-[1.7] tracking-[0.16em] text-black/45">
              Explore the complete
              Saint Clothing archive.
              Designed around
              versatile silhouettes,
              considered proportions,
              and modern everyday
              uniforms.
            </p>

          </div>

        </div>

        <div className="mt-10 flex items-center justify-between border-t border-black/15 pt-3">

          <span className="text-[8px] font-black uppercase tracking-[0.3em]">
            Saint Clothing
          </span>

          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-black/30">
            End / Collection
          </span>

        </div>

      </section>

    </div>
  );
};

export default Collection;