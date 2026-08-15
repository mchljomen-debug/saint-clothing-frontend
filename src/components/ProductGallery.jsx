import React from "react";

const ProductGallery = ({
  productData,
  selectedImage,
  setSelectedImage,
  backendUrl,
  getMediaUrl,
  isProductPreOrder,
  isProductOutOfStock,
  previewVideoUrl,
  handleTryItOn,
  handleShow3D,
  has3DModel,
}) => {
  return (
    <div className="min-w-0">
      <div className="relative">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ECEAE4]">
          {productData.onSale &&
            Number(productData.salePercent) > 0 && (
              <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
                <span className="inline-flex items-center bg-black px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white">
                  Sale — {productData.salePercent}%
                </span>
              </div>
            )}

          {isProductPreOrder && !isProductOutOfStock && (
            <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
              <span className="inline-flex items-center border border-black bg-[#F5F4F0] px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em]">
                Pre-order
              </span>
            </div>
          )}

          {previewVideoUrl ? (
            <video
              src={previewVideoUrl}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : selectedImage ? (
            <img
              src={selectedImage}
              alt={productData.name}
              className="absolute inset-0 h-full w-full object-contain p-4 sm:p-8 lg:p-10 transition-transform duration-700 hover:scale-[1.035]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">
                No Image
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/[0.03] via-transparent to-black/[0.05]" />

          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black/35">
              Saint / 01
            </p>
          </div>
        </div>

        {productData.images?.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-thin-hide">
            {productData.images.map((img, index) => {
              const imageUrl = getMediaUrl(img, backendUrl);
              const active = selectedImage === imageUrl;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(imageUrl)}
                  className={`group relative aspect-square w-[68px] shrink-0 overflow-hidden bg-[#ECEAE4] transition sm:w-[82px] ${
                    active
                      ? "ring-1 ring-black"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Product preview ${index + 1}`}
                    className="h-full w-full object-contain p-1 transition duration-500 group-hover:scale-105"
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-black/35">
            {productData.images?.length || 0} Images
          </p>

          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-black/35">
            Scroll to Explore
          </p>
        </div>
      </div>

      {/* Product tools */}
      <div className="mt-5 grid grid-cols-2 gap-px border border-black bg-black">
        <button
          type="button"
          onClick={handleTryItOn}
          className="group bg-[#F5F4F0] px-4 py-4 text-left transition hover:bg-black hover:text-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">
              Virtual
            </span>

            <span className="text-lg transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em]">
            Try It On
          </p>
        </button>

        <button
          type="button"
          onClick={handleShow3D}
          disabled={!has3DModel}
          className={`group px-4 py-4 text-left transition ${
            has3DModel
              ? "bg-[#F5F4F0] hover:bg-black hover:text-white"
              : "cursor-not-allowed bg-[#E9E7E1] text-black/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">
              Interactive
            </span>

            <span className="text-lg transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em]">
            View In 3D
          </p>
        </button>
      </div>
    </div>
  );
};

export default ProductGallery;