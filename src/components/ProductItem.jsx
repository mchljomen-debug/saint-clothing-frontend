import React, { useContext, useMemo, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../App";

const getTotalStock = (stockObj) => {
  if (!stockObj) return 0;

  if (typeof stockObj.get === "function") {
    let total = 0;
    for (const [, value] of stockObj.entries()) total += Number(value) || 0;
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
  _id,
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

  const productId = _id || id || "";
  const isLoggedIn = !!user;
  const safePrice = Number(price || 0);
  const safeSalePercent = Number(salePercent || 0);
  const hasDiscount = Boolean(onSale) && safeSalePercent > 0;

  const normalizeImage = (img) => {
    if (!img) return "fallback-image.jpg";
    if (String(img).startsWith("http")) return img;
    return `${backendUrl}/uploads/${img}`;
  };

  const defaultImage =
    images && images.length > 0 ? normalizeImage(images[0]) : "fallback-image.jpg";

  const hoverImage =
    images && images.length > 1 ? normalizeImage(images[1]) : defaultImage;

  const [previewImage, setPreviewImage] = useState(defaultImage);

  useEffect(() => {
    setPreviewImage(defaultImage);
  }, [defaultImage, productId]);

  const colorVariants = useMemo(() => {
    if (!groupCode) {
      return [
        {
          _id: productId,
          color,
          colorHex,
          images,
        },
      ];
    }

    const sameGroup = products.filter(
      (item) => item.groupCode === groupCode && !item.isDeleted
    );

    const uniqueVariants = sameGroup.filter(
      (item, index, arr) =>
        index ===
        arr.findIndex(
          (x) =>
            String(x.color || "").toLowerCase() ===
              String(item.color || "").toLowerCase() &&
            String(x.colorHex || "").toLowerCase() ===
              String(item.colorHex || "").toLowerCase()
        )
    );

    return uniqueVariants.length
      ? uniqueVariants
      : [
          {
            _id: productId,
            color,
            colorHex,
            images,
          },
        ];
  }, [products, groupCode, productId, color, colorHex, images]);

  const visibleColorVariants = colorVariants.slice(0, 5);
  const hiddenColorCount = Math.max(colorVariants.length - visibleColorVariants.length, 0);

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

  const handleNavigateToProduct = () => {
    if (!productId) return;
    navigate(`/product/${productId}`);
    window.scrollTo(0, 0);
  };

  return (
    <div
      onClick={handleNavigateToProduct}
      className={`group cursor-pointer overflow-hidden border bg-[#FAFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.035)] transition-all duration-300 hover:-translate-y-1 ${
        isOutOfStock
          ? "border-gray-300 opacity-90"
          : "border-black/10 hover:border-black hover:bg-[#F7F4EE] hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)]"
      }`}
    >
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[#F2F1ED]"
        onMouseEnter={() => setPreviewImage(hoverImage)}
        onMouseLeave={() => setPreviewImage(defaultImage)}
      >
        {showNewArrivalBadge && (
          <div className="absolute left-0 top-2 z-20 bg-black px-2.5 py-1 text-[9px] font-black uppercase text-white sm:top-3 sm:px-3 sm:text-[10px]">
            New Arrival
          </div>
        )}

        {showBestSellerBadge && (
          <div className="absolute left-0 top-2 z-20 bg-[#1A1A1A] px-2.5 py-1 text-[9px] font-black uppercase text-white sm:top-3 sm:px-3 sm:text-[10px]">
            Best Seller
          </div>
        )}

        {showDiscountBadge && (
          <div className="absolute right-0 top-2 z-20 bg-red-600 px-2.5 py-1 text-[9px] font-black uppercase text-white sm:top-3 sm:px-3 sm:text-[10px]">
            {safeSalePercent}% Off
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute left-0 top-2 z-30 bg-black px-2.5 py-1 text-[9px] font-black uppercase text-white sm:top-3 sm:px-3 sm:text-[10px]">
            Out of Stock
          </div>
        )}

        <img
          src={previewImage}
          alt={name}
          className={`h-full w-full object-cover transition-all duration-500 ${
            isOutOfStock ? "grayscale opacity-75" : "group-hover:scale-105"
          }`}
        />

        {!isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <span className="bg-black px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white sm:px-4 sm:text-[10px] sm:tracking-[0.2em]">
              View Details
            </span>
          </div>
        )}

        {colorVariants.length > 0 && (
          <div
            className="absolute bottom-2 left-2 z-20 flex flex-col gap-1.5 rounded-lg bg-[#FAFAF8]/90 px-2 py-2 backdrop-blur-sm sm:bottom-3 sm:left-3 sm:gap-2"
            onMouseLeave={() => setPreviewImage(defaultImage)}
            onClick={(e) => e.stopPropagation()}
          >
            {visibleColorVariants.map((variant) => {
              const variantImage =
                variant.images && variant.images.length > 0
                  ? normalizeImage(variant.images[0])
                  : defaultImage;

              const variantLabel = getColorLabel({
                color: variant.color,
                colorHex: variant.colorHex,
              });

              return (
                <button
                  key={variant._id || variantLabel}
                  type="button"
                  title={variantLabel}
                  onClick={() => {
                    if (!variant._id) return;
                    navigate(`/product/${variant._id}`);
                    window.scrollTo(0, 0);
                  }}
                  onMouseEnter={() => setPreviewImage(variantImage)}
                  className={`relative h-4 w-4 rounded-full border-2 transition-all sm:h-5 sm:w-5 ${
                    String(variant._id) === String(productId)
                      ? "scale-110 border-black"
                      : "border-gray-300 hover:border-black"
                  }`}
                  style={{ backgroundColor: variant.colorHex || "#d1d5db" }}
                  aria-label={variantLabel}
                >
                  <span className="pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white group-hover:block">
                    {variantLabel}
                  </span>
                </button>
              );
            })}

            {hiddenColorCount > 0 && (
              <div className="flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1.5 text-[8px] font-black text-white sm:h-5">
                +{hiddenColorCount}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col p-3 text-left sm:p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400 sm:text-[10px] sm:tracking-[0.18em]">
          Saint Clothing
        </p>

        <p className="mt-1 min-h-[36px] text-[13px] font-bold uppercase leading-snug text-black line-clamp-2 sm:min-h-[40px] sm:text-sm">
          {name}
        </p>

        <p className="mt-1 min-h-[16px] text-[10px] font-bold uppercase text-gray-500 line-clamp-1 sm:text-[11px]">
          {getColorLabel({ color, colorHex })}
        </p>

        {isOutOfStock ? (
          <p className="mt-1 min-h-[16px] text-[10px] font-bold uppercase text-gray-500">
            Out of stock
          </p>
        ) : (
          <div className="mt-1 min-h-[16px]"></div>
        )}

        <div className="flex items-end justify-between gap-2 pt-3">
          {isLoggedIn ? (
            <div className="flex min-h-[44px] min-w-0 flex-col justify-end sm:min-h-[48px]">
              {hasDiscount ? (
                <>
                  <p className="text-[11px] font-bold leading-none text-gray-400 line-through sm:text-[12px]">
                    {currency}
                    {safePrice.toFixed(2)}
                  </p>
                  <p className="mt-1 break-words text-base font-black leading-tight text-black sm:text-lg">
                    {currency}
                    {finalPrice}
                  </p>
                </>
              ) : (
                <>
                  <div className="h-[11px] sm:h-[12px]"></div>
                  <p className="mt-1 break-words text-base font-black leading-tight text-black sm:text-lg">
                    {currency}
                    {safePrice.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="flex min-h-[44px] min-w-0 items-end sm:min-h-[48px]">
              <p className="text-[10px] font-black uppercase leading-tight text-gray-400 sm:text-[11px]">
                Login to see price
              </p>
            </div>
          )}

          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center border text-sm transition-all duration-300 sm:h-9 sm:w-9 ${
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