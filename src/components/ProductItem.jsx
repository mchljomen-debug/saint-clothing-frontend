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

  const hasDiscount =
    Boolean(onSale) && safeSalePercent > 0;

  const normalizeImage = (img) => {
    if (!img) return "fallback-image.jpg";

    if (String(img).startsWith("http")) {
      return img;
    }

    return `${backendUrl}/uploads/${img}`;
  };

  const defaultImage =
    images?.length > 0
      ? normalizeImage(images[0])
      : "fallback-image.jpg";

  const hoverImage =
    images?.length > 1
      ? normalizeImage(images[1])
      : defaultImage;

  const [previewImage, setPreviewImage] =
    useState(defaultImage);

  useEffect(() => {
    setPreviewImage(defaultImage);
  }, [defaultImage, productId]);

  /* =========================================
     COLOR VARIANTS
  ========================================= */

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
      (item) =>
        item &&
        item.groupCode === groupCode &&
        !item.isDeleted
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
  }, [
    products,
    groupCode,
    productId,
    color,
    colorHex,
    images,
  ]);

  const visibleColorVariants =
    colorVariants.slice(0, 5);

  const hiddenColorCount = Math.max(
    colorVariants.length -
    visibleColorVariants.length,
    0
  );

  /* =========================================
     STOCK
  ========================================= */

  const totalStock = getTotalStock(stock);

  const isOutOfStock = totalStock <= 0;

  const finalPrice = hasDiscount
    ? (
      safePrice -
      (safePrice * safeSalePercent) / 100
    ).toFixed(2)
    : safePrice.toFixed(2);

  const handleNavigateToProduct = () => {
    if (!productId) return;

    navigate(`/product/${productId}`);

    window.scrollTo(0, 0);
  };

  return (
    <div
      onClick={handleNavigateToProduct}
      className="group relative cursor-pointer transition-all duration-300"
    >
      {/* ================= IMAGE ================= */}

      <div
        className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f2]"
        onMouseEnter={() => setPreviewImage(hoverImage)}
        onMouseLeave={() => setPreviewImage(defaultImage)}
      >
        {/* FLOOR SHADOW */}

        {!isOutOfStock && (
          <div className="absolute bottom-5 left-1/2 h-6 w-40 -translate-x-1/2 rounded-full bg-black/10 blur-2xl transition-all duration-500 group-hover:w-44 group-hover:opacity-80" />
        )}

        {/* BADGES */}

        {badgeMode !== "none" && (
          <div className="absolute left-3 top-3 z-30 flex flex-col gap-2">
            {hasDiscount && (
              <span className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                -{safeSalePercent}%
              </span>
            )}

            {!hasDiscount && newArrival && (
              <span className="rounded bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                New
              </span>
            )}

            {!hasDiscount && !newArrival && bestseller && (
              <span className="rounded bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Best
              </span>
            )}
          </div>
        )}

        {/* OUT OF STOCK */}

        {isOutOfStock && (
          <div className="absolute right-3 top-3 z-30 rounded bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Out of Stock
          </div>
        )}

        {/* PRODUCT IMAGE */}

        <img
          src={previewImage}
          alt={name}
          className={`relative z-10 h-full w-full object-contain p-1 transition-all duration-500 ${isOutOfStock
              ? "grayscale opacity-60"
              : "scale-105 group-hover:scale-110"
            }`}
          style={{
            filter: isOutOfStock
              ? undefined
              : "drop-shadow(0 18px 24px rgba(0,0,0,0.14))",
          }}
        />

        {/* COLOR DOTS */}

        {colorVariants.length > 0 && (
          <div
            className="absolute bottom-3 left-3 z-30 flex items-center gap-2 rounded-full bg-white/80 px-2 py-1 backdrop-blur-sm"
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
                  className={`h-4 w-4 rounded-full transition-all ${String(variant._id) === String(productId)
                      ? "scale-125 ring-2 ring-black"
                      : "hover:scale-110"
                    }`}
                  style={{
                    backgroundColor: variant.colorHex || "#d1d5db",
                  }}
                />
              );
            })}

            {hiddenColorCount > 0 && (
              <span className="text-[10px] font-semibold text-gray-500">
                +{hiddenColorCount}
              </span>
            )}
          </div>
        )}

        {/* ARROW */}

        <div className="absolute bottom-4 right-4 z-30 text-lg font-light opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
          →
        </div>
      </div>

      {/* ================= DETAILS ================= */}

      <div className="pt-5 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Saint Clothing
        </p>

        <div className="mt-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-[15px] font-semibold leading-5 text-black">
            {name}
          </h3>

          {colorHex && (
            <span
              className="mt-1 h-4 w-4 rounded-full border border-black/10"
              style={{
                backgroundColor: colorHex,
              }}
            />
          )}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {getColorLabel({
            color,
            colorHex,
          })}
        </p>

        <div className="mt-4 flex items-end justify-between">
          {isLoggedIn ? (
            hasDiscount ? (
              <div>
                <p className="text-sm text-gray-400 line-through">
                  {currency}
                  {safePrice.toFixed(2)}
                </p>

                <p className="text-lg font-bold text-red-600">
                  {currency}
                  {finalPrice}
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold text-black">
                {currency}
                {safePrice.toFixed(2)}
              </p>
            )
          ) : (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Login to see price
            </p>
          )}

          <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;