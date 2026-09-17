import React from"react";

const ProductGallery=({
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
  has3DModel
})=>{
  return(
    <div className="min-w-0">
      <div className="relative">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ECEAE4]">
          {productData.onSale&&Number(productData.salePercent)>0&&(
            <div className="absolute left-4 top-4 z-30 sm:left-6 sm:top-6">
              <span className="inline-flex items-center bg-black px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white">
                Sale — {productData.salePercent}%
              </span>
            </div>
          )}

          {isProductPreOrder&&!isProductOutOfStock&&(
            <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
              <div className="flex items-center gap-2 bg-black px-4 py-2.5 text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"/>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                  Pre-Order
                </span>
              </div>
            </div>
          )}

          {isProductOutOfStock&&(
            <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
              <span className="inline-flex items-center bg-black px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                Out of Stock
              </span>
            </div>
          )}

          {previewVideoUrl?(
            <video
              src={previewVideoUrl}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ):selectedImage?(
            <img
              src={selectedImage}
              alt={productData.name}
              className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-700 hover:scale-[1.035] sm:p-8 lg:p-10"
            />
          ):(
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/70">
                No Image
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/[0.03] via-transparent to-black/[0.05]"/>

          {isProductPreOrder&&!isProductOutOfStock&&(
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-black px-4 py-3 text-white sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.24em] text-white/50">
                    Availability
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em]">
                    Available for Pre-Order
                  </p>
                </div>

                <span className="shrink-0 border border-white/20 px-2.5 py-1.5 text-[7px] font-black uppercase tracking-[0.14em]">
                  Reserve Yours
                </span>
              </div>
            </div>
          )}

          {!isProductPreOrder&&!isProductOutOfStock&&(
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black/70">
                Saint / 01
              </p>
            </div>
          )}
        </div>

        {productData.images?.length>0&&(
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-thin-hide">
            {productData.images.map((img,index)=>{
              const imageUrl=getMediaUrl(img,backendUrl);
              const active=selectedImage===imageUrl;

              return(
                <button
                  key={index}
                  type="button"
                  onClick={()=>setSelectedImage(imageUrl)}
                  className={`group relative aspect-square w-[68px] shrink-0 overflow-hidden bg-[#ECEAE4] transition sm:w-[82px] ${active?"ring-1 ring-black":"opacity-60 hover:opacity-100"}`}
                >
                  <img
                    src={imageUrl}
                    alt={`Product preview ${index+1}`}
                    className="h-full w-full object-contain p-1 transition duration-500 group-hover:scale-105"
                  />

                  {isProductPreOrder&&!isProductOutOfStock&&index===0&&(
                    <span className="absolute bottom-0 left-0 right-0 bg-black py-1 text-center text-[5px] font-black uppercase tracking-[0.1em] text-white">
                      Pre-Order
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-black/70">
            {productData.images?.length||0} Images
          </p>

          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-black/70">
            Scroll to Explore
          </p>
        </div>
      </div>

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

        {has3DModel?(
          <button
            type="button"
            onClick={handleShow3D}
            className="group bg-[#F5F4F0] px-4 py-4 text-left transition hover:bg-black hover:text-white"
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
        ):(
          <div className="relative overflow-hidden bg-[#E5E3DD] px-4 py-4 text-left">
            <div className="absolute right-0 top-0 bg-black px-2 py-1 text-[6px] font-black uppercase tracking-[0.14em] text-white">
              Coming Soon
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/35">
                Interactive
              </span>

              <span className="text-[10px] font-black text-black/20">
                3D
              </span>
            </div>

            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/45">
              3D Coming Soon
            </p>
          </div>
        )}
      </div>

      {!has3DModel&&(
        <div className="border-x border-b border-black/10 bg-[#ECEAE4] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-black/15 text-[8px] font-black">
              3D
            </div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em]">
                3D Preview In Development
              </p>

              <p className="mt-1 text-[8px] font-medium leading-4 text-black/40">
                Interactive 3D viewing for this product will be available soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;