import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import Title from "./Title";
import ProductItem from "./ProductItem";

const LatestCollection = () => {
  const { products, user } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const favoriteCategories = useMemo(
    () => user?.preferences?.favoriteCategories || [],
    [user]
  );

  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);

  const handleMouseMove = (e) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const slide = (direction) => {
    const { current } = scrollRef;
    const scrollAmount = 360;

    if (!current) return;

    current.scrollTo({
      left:
        direction === "left"
          ? current.scrollLeft - scrollAmount
          : current.scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (products.length > 0) {
      const newArrivals = products.filter((item) => item.newArrival === true);

      const baseItems =
        newArrivals.length > 0
          ? [...newArrivals]
          : [...products].sort(
              (a, b) =>
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );

      setLatestProducts(baseItems.slice(0, 10));
    }
  }, [products]);

  const isSliding = latestProducts.length > 5;

  return (
    <section
      id="latest-collection-section"
      className="py-8 md:py-6 border-t border-gray-200"
    >
      <div className="px-0 md:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-8 md:mb-10">
          <div className="text-left max-w-2xl">
            <Title text1={"LATEST"} text2={"COLLECTION"} />

            <div className="flex items-center gap-4 mt-3">
              <span className="w-10 md:w-12 h-[1px] bg-black"></span>
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] md:tracking-[0.35em] text-gray-500 font-medium">
                New Arrivals
              </p>
            </div>

            <p className="max-w-xl mt-4 text-[13px] md:text-sm text-gray-500 leading-relaxed">
              The latest drop from Saint Clothing. Refined silhouettes, monochrome
              essentials, and modern streetwear pieces built for everyday wear.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto">
            <div className="hidden lg:flex items-center gap-4 text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-500">
              <span className="text-black">New Season</span>
              <span className="w-10 h-[1px] bg-gray-300"></span>
              <span>Saint Clothing</span>
            </div>

            {isSliding && (
              <div className="flex gap-2">
                <button
                  onClick={() => slide("left")}
                  className="flex items-center justify-center min-w-[44px] h-10 px-3 border border-gray-300 bg-white text-black hover:bg-black hover:text-white transition-all duration-300"
                >
                  <span className="text-[10px] font-bold uppercase">Prev</span>
                </button>

                <button
                  onClick={() => slide("right")}
                  className="flex items-center justify-center min-w-[44px] h-10 px-3 border border-gray-300 bg-white text-black hover:bg-black hover:text-white transition-all duration-300"
                >
                  <span className="text-[10px] font-bold uppercase">Next</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`scrollbar-hide w-full ${
            isSliding
              ? "flex overflow-x-auto snap-x snap-mandatory gap-3 md:gap-4 pb-4 cursor-grab active:cursor-grabbing"
              : "grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
          }`}
        >
          {latestProducts.map((item) => (
            <div
              key={item._id}
              className={
                isSliding
                  ? "min-w-[220px] sm:min-w-[240px] md:min-w-[calc(20%-13px)] snap-start"
                  : "w-full"
              }
            >
              <ProductItem
                {...item}
                badgeMode="latest"
                forYou={favoriteCategories.includes(item.category)}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 md:mt-4 md:mb-6 text-center">
          <button
            onClick={() => {
              navigate("/collection");
              window.scrollTo(0, 0);
            }}
            className="border border-black bg-black text-white px-8 md:px-10 py-3 uppercase tracking-[0.25em] text-[10px] font-bold transition-all duration-300 hover:bg-white hover:text-black"
          >
            View All Items
          </button>
        </div>
      </div>
    </section>
  );
};

export default LatestCollection;