import React from "react";
import { toast } from "react-toastify";

const ProductInfo = ({
  productData,
  currency,
  isLoggedIn,
  averageRating,
  reviews,
  scrollToReviews,
  finalPrice,
  isProductOutOfStock,
  isProductPreOrder,
  isProductSellingFast,
  displayColor,
  colorVariants,
  backendUrl,
  getMediaUrl,
  getColorLabel,
  navigate,
  expectedRestockDate,
  user,
  availableSizes,
  normalizedStock,
  normalizedPreorderStock,
  preorderEnabled,
  preorderThreshold,
  size,
  setSize,
  isSelectedSizePreOrder,
  selectedPreorderStock,
  selectedActualStock,
  isSelectedSizeOutOfStock,
  quantity,
  setQuantity,
  selectedStock,
  handleAddToCart,
  handleBuyNow,
  addToCartBtnRef,
  setShowSizeChart,
}) => {
  return (
    <div className="min-w-0 lg:pt-2">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between gap-4">
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-black/40">
          {productData.category || "Product"}
        </p>

        {productData.bestseller && (
          <span className="border border-black px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em]">
            Bestseller
          </span>
        )}
      </div>

      <h1 className="mt-5 max-w-[700px] text-[34px] font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-[42px] md:text-[50px] xl:text-[58px]">
        {productData.name}
      </h1>

      {productData.sku && (
        <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.22em] text-black/35">
          SKU / {productData.sku}
        </p>
      )}

      {/* =====================================================
          STATUS
      ===================================================== */}

      <div className="mt-6 flex flex-wrap gap-2">

        {isProductOutOfStock && (
          <span className="inline-flex items-center gap-2 bg-black px-3 py-2 text-[9px] font-black uppercase tracking-[0.17em] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Out of Stock
          </span>
        )}

        {!isProductOutOfStock &&
          isProductPreOrder && (
            <span className="inline-flex items-center gap-2 border border-black bg-transparent px-3 py-2 text-[9px] font-black uppercase tracking-[0.17em]">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
              Pre-order
            </span>
          )}

        {!isProductOutOfStock &&
          isProductSellingFast && (
            <span className="inline-flex items-center border border-black bg-transparent px-3 py-2 text-[9px] font-black uppercase tracking-[0.17em]">
              Selling Fast
            </span>
          )}
      </div>

      <div className="my-7 h-px bg-black/10" />

      {/* =====================================================
          RATING
      ===================================================== */}

      <div className="flex items-center gap-4">

        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(
            (star) => (
              <span
                key={star}
                className={`text-[13px] ${
                  star <=
                  Math.round(
                    Number(
                      averageRating
                    )
                  )
                    ? "text-black"
                    : "text-black/15"
                }`}
              >
                ★
              </span>
            )
          )}
        </div>

        <span className="text-[10px] font-black uppercase tracking-[0.12em]">
          {averageRating}
        </span>

        <button
          type="button"
          onClick={scrollToReviews}
          className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 underline underline-offset-4 transition hover:text-black"
        >
          {reviews.length} Review
          {reviews.length !== 1
            ? "s"
            : ""}
        </button>

      </div>

      {/* =====================================================
          PRICE
      ===================================================== */}

      <div className="mt-7">

        {isLoggedIn ? (
          productData.onSale &&
          Number(
            productData.salePercent
          ) > 0 ? (
            <div>

              <p className="text-sm font-bold text-black/30 line-through">
                {currency}
                {Number(
                  productData.price || 0
                ).toFixed(2)}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">

                <p className="text-[30px] font-black tracking-[-0.04em] sm:text-[36px]">
                  {currency}
                  {finalPrice}
                </p>

                <span className="bg-black px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white">
                  {productData.salePercent}% Off
                </span>

              </div>
            </div>
          ) : (
            <p className="text-[30px] font-black tracking-[-0.04em] sm:text-[36px]">
              {currency}
              {Number(
                productData.price || 0
              ).toFixed(2)}
            </p>
          )
        ) : (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35">
            Login to see price
          </p>
        )}

      </div>

      {/* =====================================================
          METADATA
      ===================================================== */}

      <div className="mt-7 grid grid-cols-2 border-y border-black/10">

        <div className="border-r border-black/10 py-4 pr-4">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black/35">
            Color
          </p>

          <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.08em]">
            {displayColor}
          </p>
        </div>

        <div className="py-4 pl-4">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black/35">
            Fit
          </p>

          <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.08em]">
            {productData.fitType ||
              "Standard"}
          </p>
        </div>

      </div>

      {/* =====================================================
          COLORS
      ===================================================== */}

      {colorVariants.length > 1 && (
        <div className="mt-8">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em]">
                Color
              </p>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-black/40">
                {getColorLabel(
                  productData
                )}
              </p>
            </div>

            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-black/30">
              {colorVariants.length} Options
            </p>

          </div>

          <div className="mt-4 flex flex-wrap gap-2">

            {colorVariants.map(
              (variant) => {

                const active =
                  String(
                    variant._id
                  ) ===
                  String(
                    productData._id
                  );

                const image =
                  variant.images?.[0]
                    ? getMediaUrl(
                        variant
                          .images[0],
                        backendUrl
                      )
                    : "";

                return (
                  <button
                    key={
                      variant._id
                    }
                    type="button"
                    title={getColorLabel(
                      variant
                    )}
                    onClick={() => {

                      if (
                        !variant._id ||
                        active
                      ) {
                        return;
                      }

                      navigate(
                        `/product/${variant._id}`
                      );

                      window.scrollTo({
                        top: 0,
                        behavior:
                          "smooth",
                      });
                    }}
                    className={`group relative h-12 w-12 overflow-hidden border transition ${
                      active
                        ? "border-black"
                        : "border-black/10 hover:border-black"
                    }`}
                  >

                    <span
                      className="absolute inset-1"
                      style={{
                        backgroundColor:
                          variant.colorHex ||
                          "#d1d5db",
                      }}
                    />

                    {image && (
                      <img
                        src={image}
                        alt={getColorLabel(
                          variant
                        )}
                        className="absolute inset-0 h-full w-full object-contain opacity-0 transition group-hover:opacity-100"
                      />
                    )}

                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
                    )}

                  </button>
                );
              }
            )}

          </div>
        </div>
      )}

      {/* =====================================================
          PREORDER
      ===================================================== */}

      {isProductPreOrder && (
        <div className="mt-8 border-l-2 border-black bg-[#ECEAE4] px-4 py-4">

          <p className="text-[9px] font-black uppercase tracking-[0.22em]">
            Pre-order Information
          </p>

          <p className="mt-2 text-[11px] font-medium leading-5 text-black/60">
            This item is currently
            available for pre-order.
            Expected restock:
            <span className="ml-1 font-black text-black">
              {expectedRestockDate}
            </span>
          </p>

          {productData.preorderNote && (
            <p className="mt-2 text-[11px] font-medium leading-5 text-black/55">
              {
                productData.preorderNote
              }
            </p>
          )}

        </div>
      )}

      {/* =====================================================
          SIZE
      ===================================================== */}

      <div className="mt-9">

        <div className="flex items-end justify-between gap-4">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.22em]">
              Select Size
            </p>

            {user?.preferences
              ?.preferredSize && (
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-black/35">
                Preferred /{" "}
                {String(
                  user.preferences
                    .preferredSize
                ).toUpperCase()}
              </p>
            )}

          </div>

          {productData.sizeChartImage && (
            <button
              type="button"
              onClick={() =>
                setShowSizeChart(true)
              }
              className="text-[9px] font-black uppercase tracking-[0.16em] underline underline-offset-4 transition hover:text-black/50"
            >
              Size Guide
            </button>
          )}

        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">

          {availableSizes.map(
            (s) => {

              const actual =
                Number(
                  normalizedStock[
                    s
                  ] || 0
                );

              const preorder =
                Number(
                  normalizedPreorderStock[
                    s
                  ] || 0
                );

              const pre =
                preorderEnabled &&
                actual <=
                  preorderThreshold &&
                preorder > 0;

              const out =
                actual <= 0 &&
                (!preorderEnabled ||
                  preorder <= 0);

              const preferred =
                String(
                  user?.preferences
                    ?.preferredSize ||
                    ""
                ).toUpperCase() ===
                s;

              return (
                <button
                  key={s}
                  type="button"
                  disabled={out}
                  onClick={() =>
                    !out &&
                    setSize(s)
                  }
                  className={`relative h-12 border text-[10px] font-black uppercase tracking-[0.14em] transition ${
                    size === s
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-transparent text-black hover:border-black"
                  } ${
                    out
                      ? "cursor-not-allowed opacity-25 line-through"
                      : ""
                  }`}
                >

                  {s}

                  {preferred &&
                    !out && (
                      <span
                        className={`absolute -right-px -top-px px-1.5 py-1 text-[6px] font-black uppercase tracking-[0.08em] ${
                          size === s
                            ? "bg-white text-black"
                            : "bg-black text-white"
                        }`}
                      >
                        Pref
                      </span>
                    )}

                  {pre &&
                    !out && (
                      <span className="absolute -bottom-px left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap bg-black px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.08em] text-white">
                        Pre
                      </span>
                    )}

                </button>
              );
            }
          )}

        </div>

        {isSelectedSizePreOrder && (
          <div className="mt-5 border border-black/10 bg-[#ECEAE4] p-4">

            <div className="flex items-center justify-between gap-4">

              <p className="text-[9px] font-black uppercase tracking-[0.18em]">
                Pre-order Size
              </p>

              <p className="text-[9px] font-black uppercase tracking-[0.1em]">
                {selectedPreorderStock} Slots
              </p>

            </div>

            <p className="mt-2 text-[10px] leading-5 text-black/50">
              Size{" "}
              <span className="font-black text-black">
                {size}
              </span>{" "}
              is available for pre-order.
              Expected restock:{" "}
              <span className="font-black text-black">
                {expectedRestockDate}
              </span>
            </p>

          </div>
        )}

      </div>

      {/* =====================================================
          QUANTITY
      ===================================================== */}

      <div className="mt-8">

        <div className="flex items-center justify-between gap-4">

          <p className="text-[9px] font-black uppercase tracking-[0.22em]">
            Quantity
          </p>

          {size && (
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-black/35">
              {isSelectedSizePreOrder
                ? `Pre-order slots / ${selectedPreorderStock}`
                : `Stock / ${selectedActualStock}`}
            </p>
          )}

        </div>

        <div className="mt-4 inline-flex border border-black">

          <button
            type="button"
            onClick={() =>
              setQuantity(
                (q) =>
                  Math.max(
                    1,
                    q - 1
                  )
              )
            }
            className="h-11 w-11 text-base font-black transition hover:bg-black hover:text-white"
          >
            −
          </button>

          <span className="flex h-11 min-w-[50px] items-center justify-center border-x border-black text-[11px] font-black">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => {

              if (!size) {
                toast.error(
                  "Please select a size first"
                );
                return;
              }

              if (selectedStock <= 0) {
                toast.error(
                  `Size ${size} is out of stock`
                );
                return;
              }

              setQuantity(
                (q) =>
                  q < selectedStock
                    ? q + 1
                    : q
              );

            }}
            className="h-11 w-11 text-base font-black transition hover:bg-black hover:text-white"
          >
            +
          </button>

        </div>
      </div>

      {/* =====================================================
          ADD TO BAG / BUY NOW
      ===================================================== */}

      <div className="mt-8">

        <button
          ref={addToCartBtnRef}
          data-add-to-cart="true"
          type="button"
          onClick={handleAddToCart}
          disabled={isProductOutOfStock}
          className={`group flex h-14 w-full items-center justify-between px-5 text-[10px] font-black uppercase tracking-[0.2em] transition sm:px-6 ${
            isProductOutOfStock
              ? "cursor-not-allowed bg-black/10 text-black/25"
              : "bg-black text-white hover:bg-black/85"
          }`}
        >

          <span>
            {isProductOutOfStock
              ? "Out of Stock"
              : isSelectedSizePreOrder
                ? "Pre-order"
                : "Add to Bag"}
          </span>

          {!isProductOutOfStock && (
            <span className="text-xl transition group-hover:translate-x-1">
              →
            </span>
          )}

        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isProductOutOfStock}
          className={`mt-2 flex h-14 w-full items-center justify-between border px-5 text-[10px] font-black uppercase tracking-[0.2em] transition sm:px-6 ${
            isProductOutOfStock
              ? "cursor-not-allowed border-black/10 text-black/20"
              : "border-black bg-transparent hover:bg-black hover:text-white"
          }`}
        >

          <span>
            {isProductOutOfStock
              ? "Unavailable"
              : isSelectedSizePreOrder
                ? "Pre-order Now"
                : "Buy Now"}
          </span>

          {!isProductOutOfStock && (
            <span className="text-xl transition group-hover:translate-x-1">
              →
            </span>
          )}

        </button>

      </div>

      {/* =====================================================
          SHIPPING
      ===================================================== */}

      <div className="mt-8 grid grid-cols-3 border-y border-black/10">

        <div className="py-4 pr-3">
          <p className="text-[8px] font-black uppercase tracking-[0.15em]">
            Secure
          </p>

          <p className="mt-1 text-[8px] leading-4 text-black/40">
            Protected checkout
          </p>
        </div>

        <div className="border-x border-black/10 px-3 py-4">
          <p className="text-[8px] font-black uppercase tracking-[0.15em]">
            Quality
          </p>

          <p className="mt-1 text-[8px] leading-4 text-black/40">
            Saint Clothing
          </p>
        </div>

        <div className="py-4 pl-3">
          <p className="text-[8px] font-black uppercase tracking-[0.15em]">
            Support
          </p>

          <p className="mt-1 text-[8px] leading-4 text-black/40">
            Branch availability
          </p>
        </div>

      </div>

    </div>
  );
};

export default ProductInfo;