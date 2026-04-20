import React, { useContext, useMemo, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../App";

const getTotalStock = (stockObj) => {
  if (!stockObj) return 0;

  if (typeof stockObj.get === "function") {
    let total = 0;
    for (const [, value] of stockObj.entries()) {
      total += Number(value) || 0;
    }
    return total;
  }

  if (typeof stockObj === "object" && stockObj !== null) {
    return Object.values(stockObj).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );
  }

  return 0;
};

const getColorLabel = ({ color, colorHex }) => {
  if (color && String(color).trim()) return color;
  if (colorHex && String(colorHex).trim()) return colorHex;
  return "No color";
};

const ProductItem = ({
  id,
  images = [],
  name = "",
  price = 0,
  bestseller = false,
  newArrival = false,
  groupCode = "",
  color = "",
  colorHex = "",
  onSale = false,
  salePercent = 0,
  stock = {},
  branch = "branch1",
  badgeMode = "default",
}) => {
  const { currency, products, user } = useContext(ShopContext);
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const safeBranch = branch || "branch1";
  const safePrice = Number(price || 0);
  const safeSalePercent = Number(salePercent || 0);
  const hasDiscount = Boolean(onSale) && safeSalePercent > 0;

  const colorVariants = useMemo(() => {
    if (!groupCode) return [];

    const sameGroup = products.filter(
      (item) =>
        item.groupCode === groupCode &&
        !item.isDeleted &&
        (item.branch || "branch1") === safeBranch
    );

    return sameGroup.filter(
      (item, index, arr) =>
        index === arr.findIndex((x) => String(x._id) === String(item._id))
    );
  }, [products, groupCode, safeBranch]);

  const normalizeImage = (img) => {
    if (!img) return "fallback-image.jpg";
    if (String(img).startsWith("http")) return img;
    return `${backendUrl}/uploads/${img}`;
  };

  const defaultImage =
    images && images.length > 0 ? normalizeImage(images[0]) : "fallback-image.jpg";

  const [previewImage, setPreviewImage] = useState(defaultImage);

  useEffect(() => {
    setPreviewImage(defaultImage);
  }, [defaultImage, id]);

  const totalStock = getTotalStock(stock);
  const isOutOfStock = totalStock <= 0;

  const finalPrice = hasDiscount
    ? (safePrice - (safePrice * safeSalePercent) / 100).toFixed(2)
    : safePrice.toFixed(2);

  const showNewArrivalBadge =
    !isOutOfStock && newArrival && badgeMode === "latest";

  const showBestSellerBadge =
    !isOutOfStock && bestseller && badgeMode === "bestseller";

  const showDiscountBadge = !isOutOfStock && hasDiscount;

  return (
    <div
      onClick={() => {
        navigate(`/product/${id}`);
        window.scrollTo(0, 0);
      }}
      className={`group cursor-pointer bg-white border transition-all duration-300 overflow-hidden ${
        isOutOfStock
          ? "border-gray-300 opacity-90"
          : "border-gray-200 hover:border-black hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
      }`}
    >
      <div className="relative overflow-hidden aspect-[4/5] bg-[#F5F5F5]">
        {showNewArrivalBadge && (
          <div className="absolute top-2 sm:top-3 left-0 z-20 bg-black text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 uppercase">
            New Arrival
          </div>
        )}

        {showBestSellerBadge && (
          <div className="absolute top-2 sm:top-3 left-0 z-20 bg-[#1A1A1A] text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 uppercase">
            Best Seller
          </div>
        )}

        {showDiscountBadge && (
          <div className="absolute top-2 sm:top-3 right-0 z-20 bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 uppercase">
            {safeSalePercent}% Off
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute top-2 sm:top-3 left-0 z-30 bg-black text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 uppercase">
            Out of Stock
          </div>
        )}

        <img
          src={previewImage}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isOutOfStock ? "grayscale opacity-75" : "group-hover:scale-105"
          }`}
        />

        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <span className="bg-black text-white px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em]">
              View Details
            </span>
          </div>
        )}

        {colorVariants.length > 1 && (
          <div
            className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 flex flex-col gap-1.5 sm:gap-2 bg-white/90 px-2 py-2 rounded-lg backdrop-blur-sm"
            onMouseLeave={() => setPreviewImage(defaultImage)}
            onClick={(e) => e.stopPropagation()}
          >
            {colorVariants.map((variant) => {
              const variantImage =
                variant.images && variant.images.length > 0
                  ? normalizeImage(variant.images[0])
                  : defaultImage;

              return (
                <button
                  key={variant._id}
                  type="button"
                  onClick={() => {
                    navigate(`/product/${variant._id}`);
                    window.scrollTo(0, 0);
                  }}
                  onMouseEnter={() => setPreviewImage(variantImage)}
                  className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-full transition-all ${
                    String(variant._id) === String(id)
                      ? "border-black scale-110"
                      : "border-gray-300 hover:border-black"
                  }`}
                  style={{ backgroundColor: variant.colorHex || "#d1d5db" }}
                  aria-label={variant.color || "Product color variant"}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 text-left flex flex-col">
        <p className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em]">
          Saint Clothing
        </p>

        <p className="text-black font-bold text-[13px] sm:text-sm uppercase mt-1 min-h-[36px] sm:min-h-[40px] leading-snug line-clamp-2">
          {name}
        </p>

        <p className="text-[10px] sm:text-[11px] uppercase font-bold mt-1 min-h-[16px] text-gray-500 line-clamp-1">
          {getColorLabel({ color, colorHex })}
        </p>

        {isOutOfStock ? (
          <p className="text-[10px] font-bold uppercase text-gray-500 mt-1 min-h-[16px]">
            Out of stock
          </p>
        ) : (
          <div className="min-h-[16px] mt-1"></div>
        )}

        <div className="flex justify-between items-end gap-2 pt-3">
          {isLoggedIn ? (
            <div className="min-h-[44px] sm:min-h-[48px] flex flex-col justify-end min-w-0">
              {hasDiscount ? (
                <>
                  <p className="text-[11px] sm:text-[12px] text-gray-400 line-through font-bold leading-none">
                    {currency}
                    {safePrice.toFixed(2)}
                  </p>
                  <p className="text-base sm:text-lg font-black text-black leading-tight mt-1 break-words">
                    {currency}
                    {finalPrice}
                  </p>
                </>
              ) : (
                <>
                  <div className="h-[11px] sm:h-[12px]"></div>
                  <p className="text-base sm:text-lg font-black text-black leading-tight mt-1 break-words">
                    {currency}
                    {safePrice.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="min-h-[44px] sm:min-h-[48px] flex items-end min-w-0">
              <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase leading-tight">
                Login to see price
              </p>
            </div>
          )}

          <div
            className={`h-8 w-8 sm:h-9 sm:w-9 shrink-0 border flex items-center justify-center text-sm transition-all duration-300 ${
              isOutOfStock
                ? "border-gray-300 text-gray-400"
                : "border-black text-black group-hover:bg-black group-hover:text-white"
            }`}
          >
            →
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;