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
    images?.length > 0 ? normalizeImage(images[0]) : "fallback-image.jpg";

  const hoverImage =
    images?.length > 1 ? normalizeImage(images[1]) : defaultImage;

  const [previewImage, setPreviewImage] = useState(defaultImage);

  useEffect(() => {
    setPreviewImage(defaultImage);
  }, [defaultImage, productId]);

  // 🔥 FIXED VARIANTS (no branch filter + always at least 1)
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
      {/* IMAGE */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[#F2F1ED]"
        onMouseEnter={() => setPreviewImage(hoverImage)}
        onMouseLeave={() => setPreviewImage(defaultImage)}
      >
        {isOutOfStock && (
          <div className="absolute left-0 top-2 z-30 bg-black px-2.5 py-1 text-[9px] font-black uppercase text-white">
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

        {/* 🔥 COLOR CIRCLES (clean, no text) */}
        {colorVariants.length > 0 && (
          <div
            className="absolute bottom-2 left-2 z-20 flex flex-col gap-1.5 rounded-lg bg-[#FAFAF8]/90 px-2 py-2 backdrop-blur-sm"
            onMouseLeave={() => setPreviewImage(defaultImage)}
            onClick={(e) => e.stopPropagation()}
          >
            {visibleColorVariants.map((variant) => {
              const variantImage =
                variant.images?.length > 0
                  ? normalizeImage(variant.images[0])
                  : defaultImage;

              return (
                <button
                  key={variant._id}
                  type="button"
                  onClick={() => {
                    if (!variant._id) return;
                    navigate(`/product/${variant._id}`);
                    window.scrollTo(0, 0);
                  }}
                  onMouseEnter={() => setPreviewImage(variantImage)}
                  className={`h-4 w-4 rounded-full border-2 transition-all ${
                    String(variant._id) === String(productId)
                      ? "scale-110 border-black"
                      : "border-gray-300 hover:border-black"
                  }`}
                  style={{ backgroundColor: variant.colorHex || "#d1d5db" }}
                />
              );
            })}

            {hiddenColorCount > 0 && (
              <div className="flex h-4 items-center justify-center rounded-full bg-black px-1.5 text-[8px] font-black text-white">
                +{hiddenColorCount}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAILS */}
      <div className="flex flex-col p-3 text-left">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400">
          Saint Clothing
        </p>

        <p className="mt-1 text-[13px] font-bold uppercase text-black line-clamp-2">
          {name}
        </p>

        <p className="mt-1 text-[10px] font-bold uppercase text-gray-500">
          {getColorLabel({ color, colorHex })}
        </p>

        <div className="flex items-end justify-between pt-3">
          {isLoggedIn ? (
            <div>
              {hasDiscount ? (
                <>
                  <p className="text-[11px] text-gray-400 line-through">
                    {currency}
                    {safePrice.toFixed(2)}
                  </p>
                  <p className="text-base font-black">
                    {currency}
                    {finalPrice}
                  </p>
                </>
              ) : (
                <p className="text-base font-black">
                  {currency}
                  {safePrice.toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[10px] font-black text-gray-400">
              Login to see price
            </p>
          )}

          <div className="flex h-8 w-8 items-center justify-center border text-sm transition-all group-hover:bg-black group-hover:text-white">
            →
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;