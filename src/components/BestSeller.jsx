import React, { useContext, useEffect, useRef, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import Title from "./Title";
import ProductItem from "./ProductItem";

const BestSeller = () => {
  const { products } = useContext(ShopContext);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const items = products.filter((p) => p.bestseller).slice(0, 10);
    setBestSellerProducts(items);
  }, [products]);

  const isSliding = bestSellerProducts.length > 5;

  return (
    <section className="py-6 border-t border-gray-200">
      <div className="w-full">

        <div className="flex justify-between items-end mb-6">
          <Title text1={"TOP"} text2={"SPEED"} />

          {isSliding && (
            <div className="flex gap-2">
              <button onClick={() => slide("left")} className="btn-nav">
                Prev
              </button>
              <button onClick={() => slide("right")} className="btn-nav">
                Next
              </button>
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={`scrollbar-hide w-full ${
            isSliding
              ? "flex overflow-x-auto snap-x gap-4 px-1 pb-2"
              : "grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-1"
          }`}
        >
          {bestSellerProducts.map((item) => (
            <div
              key={item._id}
              className={
                isSliding
                  ? "min-w-[80%] sm:min-w-[45%] md:min-w-[30%] lg:min-w-[20%]"
                  : "w-full"
              }
            >
              <ProductItem {...item} badgeMode="top-speed" />
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => navigate("/collection")} className="btn-main">
            View Top Speed
          </button>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;