import React, { useContext, useMemo, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const RelatedProducts = ({ category, subCategory, currentProductId }) => {
  const { products } = useContext(ShopContext);
  const scrollRef = useRef(null);

  const related = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products
      .filter((p) => {
        if (!p) return false;
        if (currentProductId && String(p._id) === String(currentProductId)) {
          return false;
        }
        if (p.category !== category) return false;
        if (subCategory && p.subCategory !== subCategory) return false;
        return !p.isDeleted;
      })
      .slice(0, 15);
  }, [products, category, subCategory, currentProductId]);

  const scroll = (direction) => {
    const current = scrollRef.current;
    if (!current) return;

    const amount =
      window.innerWidth < 640
        ? current.offsetWidth * 0.88
        : window.innerWidth < 1024
        ? current.offsetWidth * 0.92
        : current.offsetWidth * 0.96;

    current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (related.length === 0) return null;

  const isSlider = related.length > 4;

  return (
    <div className="my-10 sm:my-12 lg:my-16 w-full relative">
      <div className="max-w-[1280px] mx-auto mb-5 sm:mb-6 px-3 sm:px-4 md:px-5">
        <Title text1="RELATED" text2="PRODUCTS" />
        <div className="w-10 sm:w-12 h-[3px] bg-[#0A0D17] mt-2"></div>
      </div>

      <div className="relative">
        {isSlider && (
          <>
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 hidden md:flex w-9 h-9 lg:w-10 lg:h-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg hover:bg-black hover:text-white transition"
              aria-label="Scroll related products left"
            >
              &#10094;
            </button>

            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 hidden md:flex w-9 h-9 lg:w-10 lg:h-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg hover:bg-black hover:text-white transition"
              aria-label="Scroll related products right"
            >
              &#10095;
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className={
            isSlider
              ? "flex overflow-x-auto scroll-smooth scrollbar-hide gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 lg:px-8"
              : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 lg:px-8"
          }
        >
          {related.map((item) => (
            <div
              key={item._id}
              className={
                isSlider
                  ? "flex-shrink-0 w-[72%] xs:w-[62%] sm:w-[44%] md:w-[31%] lg:w-[24%] xl:w-[20%]"
                  : "w-full min-w-0"
              }
            >
              <ProductItem
                id={item._id}
                name={item.name}
                images={item.images}
                price={item.price}
                bestseller={item.bestseller}
                newArrival={item.newArrival}
                groupCode={item.groupCode}
                color={item.color}
                colorHex={item.colorHex}
                onSale={item.onSale}
                salePercent={item.salePercent}
                stock={item.stock}
                branch={item.branch}
                badgeMode="none"
              />
            </div>
          ))}
        </div>

        {isSlider && (
          <>
            <div className="hidden lg:block absolute top-0 left-0 h-full w-10 bg-gradient-to-r from-[#F6F6F4] to-transparent pointer-events-none"></div>
            <div className="hidden lg:block absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-[#F6F6F4] to-transparent pointer-events-none"></div>
          </>
        )}
      </div>

      <div className="mt-8 sm:mt-10 w-full h-[1px] bg-gray-100"></div>
    </div>
  );
};

export default RelatedProducts;