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
  const hiddenColorCount = Math.max(
    colorVariants.length - visibleColorVariants.length,
    0
  );

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
      className={`group relative cursor-pointer overflow-hidden rounded-[5px] border bg-white transition-all duration-300 ${
        isOutOfStock
          ? "border-black/10 opacity-90"
          : "border-black/10 hover:-translate-y-1 hover:border-black hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]"
      }`}
    >
      {/* IMAGE */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[radial-gradient(circle_at_center,#ffffff_0%,#f6f6f3_48%,#ededeb_100%)]"
        onMouseEnter={() => setPreviewImage(hoverImage)}
        onMouseLeave={() => setPreviewImage(defaultImage)}
      >
        <div className="absolute inset-x-4 bottom-4 top-8 rounded-[5px] bg-white/45 blur-2xl transition-opacity duration-300 group-hover:opacity-80" />

        {badgeMode !== "none" && (
          <div className="absolute left-2 top-2 z-30 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="w-fit rounded-[5px] bg-red-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                -{safeSalePercent}%
              </span>
            )}

            {!hasDiscount && newArrival && (
              <span className="w-fit rounded-[5px] bg-black px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                New
              </span>
            )}

            {!hasDiscount && !newArrival && bestseller && (
              <span className="w-fit rounded-[5px] bg-black px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                Best
              </span>
            )}
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute right-2 top-2 z-30 rounded-[5px] bg-black/85 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Out of Stock
          </div>
        )}

        <img
          src={previewImage}
          alt={name}
          className={`relative z-10 h-full w-full object-contain px-3 py-4 transition-all duration-500 ${
            isOutOfStock
              ? "grayscale opacity-60"
              : "group-hover:scale-[1.06]"
          }`}
        />

        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/[0.06] via-transparent to-white/20" />

        {colorVariants.length > 0 && (
          <div
            className="absolute bottom-2 left-2 z-30 flex items-center gap-1.5 rounded-[5px] border border-black/10 bg-white/90 px-2 py-1.5 shadow-sm backdrop-blur-md"
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
                  title={getColorLabel({
                    color: variant.color,
                    colorHex: variant.colorHex,
                  })}
                  onClick={() => {
                    if (!variant._id) return;
                    navigate(`/product/${variant._id}`);
                    window.scrollTo(0, 0);
                  }}
                  onMouseEnter={() => setPreviewImage(variantImage)}
                  className={`h-4 w-4 rounded-[5px] border transition-all ${
                    String(variant._id) === String(productId)
                      ? "scale-110 border-black ring-1 ring-black"
                      : "border-black/20 hover:border-black"
                  }`}
                  style={{ backgroundColor: variant.colorHex || "#d1d5db" }}
                />
              );
            })}

            {hiddenColorCount > 0 && (
              <div className="flex h-4 items-center justify-center rounded-[5px] bg-black px-1.5 text-[8px] font-black text-white">
                +{hiddenColorCount}
              </div>
            )}
          </div>
        )}

        <div className="absolute bottom-2 right-2 z-30 flex h-8 w-8 translate-y-2 items-center justify-center rounded-[5px] border border-black/10 bg-white text-sm font-black text-black opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          →
        </div>
      </div>

      {/* DETAILS */}
      <div className="flex min-h-[128px] flex-col border-t border-black/10 bg-white p-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
              Saint Clothing
            </p>

            <p className="mt-1 line-clamp-2 text-[13px] font-black uppercase leading-5 text-black">
              {name}
            </p>
          </div>

          {colorHex && (
            <span
              className="mt-1 h-4 w-4 shrink-0 rounded-[5px] border border-black/20"
              style={{ backgroundColor: colorHex }}
            />
          )}
        </div>

        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
          {getColorLabel({ color, colorHex })}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          {isLoggedIn ? (
            <div className="min-w-0">
              {hasDiscount ? (
                <>
                  <p className="text-[11px] font-bold text-gray-400 line-through">
                    {currency}
                    {safePrice.toFixed(2)}
                  </p>
                  <p className="text-base font-black leading-none text-red-600">
                    {currency}
                    {finalPrice}
                  </p>
                </>
              ) : (
                <p className="text-base font-black leading-none text-black">
                  {currency}
                  {safePrice.toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
              Login to see price
            </p>
          )}

          <div className="hidden rounded-[5px] border border-black/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500 sm:block">
            View
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;