import React,{useContext,useEffect,useMemo,useState}from"react";
import{ShopContext}from"../context/ShopContext";
import{assets}from"../assets/assets";
import{toast}from"react-toastify";
import ProductItem from"../components/ProductItem";
import useRecommendations from"../hooks/useRecommendations";

const getMediaUrl=(value,backendUrl)=>{
  if(!value)return"";
  const stringValue=String(value).trim();
  if(stringValue.startsWith("http://")||stringValue.startsWith("https://")||stringValue.startsWith("data:"))return stringValue;
  if(stringValue.startsWith("/uploads/"))return`${backendUrl}${stringValue}`;
  return`${backendUrl}/uploads/${stringValue.replace(/^\/+/,"")}`;
};

const normalizeStockMap=(stock={})=>{
  if(!stock||typeof stock!=="object"||Array.isArray(stock))return{};
  const normalized={};
  Object.entries(stock).forEach(([size,qty])=>{
    normalized[String(size).trim().toUpperCase()]=Number(qty||0);
  });
  return normalized;
};

const formatRestockDate=(value)=>{
  if(!value)return"";
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return String(value);
  return date.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
};

const Cart=()=>{
  const{products,currency,cartItems,updateQuantity,navigate,backendUrl,token,authReady,user}=useContext(ShopContext);
  const[cartData,setCartData]=useState([]);
  const[selectedItems,setSelectedItems]=useState({});

  useEffect(()=>{
    if(authReady&&!token){
      toast.error("Please login to view your cart");
      navigate("/login");
    }
  },[token,navigate,authReady]);

  useEffect(()=>{
    if(!authReady||products.length===0)return;
    const tempData=[];

    for(const productId in cartItems){
      const product=products.find((p)=>String(p._id)===String(productId));
      if(!product)continue;

      for(const size in cartItems[productId]){
        const quantity=Number(cartItems[productId][size]||0);
        if(quantity<=0)continue;

        const normalizedSize=String(size).trim().toUpperCase();
        const stock=normalizeStockMap(product.stock);
        const preorderStock=normalizeStockMap(product.preorderStock);
        const actualStock=Number(stock[normalizedSize]||0);
        const availablePreorderStock=Number(preorderStock[normalizedSize]||0);
        const preorderEnabled=product.preorderEnabled!==false;
        const isPreorder=preorderEnabled&&actualStock<=0&&availablePreorderStock>0;

        tempData.push({
          ...product,
          size:normalizedSize,
          quantity,
          images:Array.isArray(product.images)?product.images:[],
          actualStock,
          availablePreorderStock,
          isPreorder
        });
      }
    }

    setCartData(tempData);
  },[cartItems,products,authReady]);

  useEffect(()=>{
    setSelectedItems((prev)=>{
      const next={};

      cartData.forEach((item)=>{
        const key=`${item._id}_${item.size}`;
        next[key]=prev[key]!==undefined?prev[key]:true;
      });

      return next;
    });
  },[cartData]);

  const getItemKey=(item)=>`${item._id}_${item.size}`;

  const getFinalPrice=(item)=>{
    const basePrice=Number(item.price||0);
    const salePercent=Number(item.salePercent||0);
    if(item.onSale&&salePercent>0)return Math.max(basePrice-(basePrice*salePercent)/100,0);
    return basePrice;
  };

  const selectedCartData=useMemo(()=>{
    return cartData.filter((item)=>selectedItems[getItemKey(item)]);
  },[cartData,selectedItems]);

  const allSelected=cartData.length>0&&cartData.every((item)=>selectedItems[getItemKey(item)]);
  const selectedItemsCount=selectedCartData.length;

  const selectedSubtotal=useMemo(()=>{
    return selectedCartData.reduce((sum,item)=>sum+getFinalPrice(item)*Number(item.quantity||0),0);
  },[selectedCartData]);

  const selectedTotalQuantity=useMemo(()=>{
    return selectedCartData.reduce((sum,item)=>sum+Number(item.quantity||0),0);
  },[selectedCartData]);

  const selectedPreorderCount=useMemo(()=>{
    return selectedCartData.filter((item)=>item.isPreorder).length;
  },[selectedCartData]);

  const selectedProductIds=useMemo(()=>{
    return selectedCartData.map((item)=>item._id);
  },[selectedCartData]);

  const selectedCategories=useMemo(()=>{
    return[...new Set(selectedCartData.map((item)=>item.category).filter(Boolean))];
  },[selectedCartData]);

  const selectedColors=useMemo(()=>{
    return[...new Set(selectedCartData.map((item)=>item.color).filter(Boolean))];
  },[selectedCartData]);

  const{recommendations:recommendedProducts}=useRecommendations({
    backendUrl,
    products,
    productIds:selectedProductIds,
    category:selectedCategories[0]||"Tshirt",
    color:selectedColors[0]||"",
    userId:user?._id||null,
    limit:4,
    enabled:selectedCartData.length>0
  });

  const handleToggleItem=(item)=>{
    const key=getItemKey(item);
    setSelectedItems((prev)=>({...prev,[key]:!prev[key]}));
  };

  const handleSelectAll=()=>{
    const next={};

    cartData.forEach((item)=>{
      next[getItemKey(item)]=!allSelected;
    });

    setSelectedItems(next);
  };

  const handleCheckout=()=>{
    if(selectedCartData.length===0){
      toast.error("Please select at least one item");
      return;
    }

    localStorage.setItem("checkout_cart",JSON.stringify(selectedCartData));
    toast.success("Selected items are ready for checkout");
    navigate("/place-order");
  };

  const handleQtyChange=(item,nextQty)=>{
    const qty=Number(nextQty);

    if(!Number.isFinite(qty)||qty<1){
      updateQuantity(item._id,item.size,1);
      return;
    }

    const availableStock=item.isPreorder?item.availablePreorderStock:item.actualStock;

    if(availableStock>0&&qty>availableStock){
      toast.error(item.isPreorder?`Only ${availableStock} pre-order slot${availableStock!==1?"s":""} available`:`Only ${availableStock} item${availableStock!==1?"s":""} available`);
      return;
    }

    updateQuantity(item._id,item.size,qty);
  };

  const handleRemove=(item)=>{
    updateQuantity(item._id,item.size,0);
    toast.success("Item removed from cart");
  };

  if(!authReady){
    return(
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F5F4F0]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-black"/>
          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.35em] text-black/35">
            Loading Cart
          </p>
        </div>
      </div>
    );
  }

  if(!cartData.length){
    return(
      <div className="min-h-[80vh] bg-[#F5F4F0] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center border border-black/10 bg-[#ECEAE4] px-6 py-20 text-center sm:py-24">
          <div className="flex h-14 w-14 items-center justify-center border border-black">
            <span className="text-[8px] font-black uppercase tracking-[0.1em]">
              Cart
            </span>
          </div>

          <p className="mt-7 text-[8px] font-black uppercase tracking-[0.35em] text-black/35">
            Saint Clothing
          </p>

          <h1 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">
            Your Cart Is Empty
          </h1>

          <p className="mt-4 max-w-md text-[11px] font-medium leading-6 text-black/45">
            You haven't added anything to your cart yet. Explore the latest Saint Clothing pieces and build your fit.
          </p>

          <button
            type="button"
            onClick={()=>navigate("/collection")}
            className="group mt-8 flex h-13 min-w-[210px] items-center justify-between bg-black px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black/80"
          >
            <span>Start Shopping</span>
            <span className="text-lg transition group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-[#F5F4F0] font-['Outfit'] text-black">
      <section className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-white/30"/>
                <p className="text-[8px] font-black uppercase tracking-[0.35em] text-white/40">
                  Saint Clothing / Checkout
                </p>
              </div>

              <h1 className="mt-3 text-2xl font-black uppercase tracking-[-0.035em] sm:text-3xl">
                Your Cart
              </h1>

              <p className="mt-1.5 text-[9px] font-medium text-white/40">
                Review your items before checkout.
              </p>
            </div>

            <div className="flex border border-white/15">
              <div className="min-w-[95px] border-r border-white/15 px-4 py-3">
                <p className="text-[6px] font-black uppercase tracking-[0.22em] text-white/30">
                  Products
                </p>

                <p className="mt-1 text-lg font-black">
                  {cartData.length.toString().padStart(2,"0")}
                </p>
              </div>

              <div className="min-w-[95px] px-4 py-3">
                <p className="text-[6px] font-black uppercase tracking-[0.22em] text-white/30">
                  Selected
                </p>

                <p className="mt-1 text-lg font-black">
                  {selectedItemsCount.toString().padStart(2,"0")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-12">
          <div>
            <div className="mb-5 flex flex-col gap-4 border-b border-black pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.28em] text-black/35">
                  Cart Products
                </p>

                <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.03em]">
                  Your Selection
                </h2>
              </div>

              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.2em]"
              >
                <span className={`flex h-5 w-5 items-center justify-center border transition ${allSelected?"border-black bg-black text-white":"border-black/25"}`}>
                  {allSelected?"✓":""}
                </span>

                {allSelected?"Unselect All":"Select All"}
              </button>
            </div>

            <div className="space-y-3">
              {cartData.map((item,index)=>{
                const key=getItemKey(item);
                const isSelected=!!selectedItems[key];
                const imageSrc=item.images?.length?getMediaUrl(item.images[0],backendUrl):item.image?getMediaUrl(item.image,backendUrl):"";
                const finalPrice=getFinalPrice(item);
                const lineTotal=finalPrice*Number(item.quantity||0);

                return(
                  <article
                    key={key}
                    className={`relative overflow-hidden border transition-all duration-300 ${isSelected?"border-black bg-[#ECEAE4]":"border-black/10 bg-[#F5F4F0] opacity-60"}`}
                  >
                    {isSelected&&<div className="absolute bottom-0 left-0 top-0 w-1 bg-black"/>}

                    <div className="grid gap-5 p-4 sm:grid-cols-[24px_130px_minmax(0,1fr)] sm:p-5 lg:grid-cols-[24px_145px_minmax(0,1fr)_150px]">
                      <div className="flex items-start justify-start pt-1">
                        <button
                          type="button"
                          onClick={()=>handleToggleItem(item)}
                          className={`flex h-5 w-5 items-center justify-center border text-[9px] font-black transition ${isSelected?"border-black bg-black text-white":"border-black/25 bg-transparent"}`}
                          aria-label={isSelected?"Unselect item":"Select item"}
                        >
                          {isSelected?"✓":""}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={()=>navigate(`/product/${item._id}`)}
                        className="relative aspect-[4/5] w-full overflow-hidden bg-[#E2E0DA]"
                      >
                        {imageSrc?(
                          <img
                            src={imageSrc}
                            alt={item.name}
                            className="h-full w-full object-contain p-3 transition duration-500 hover:scale-105"
                          />
                        ):(
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-black/30">
                              No Image
                            </span>
                          </div>
                        )}

                        <span className="absolute bottom-2 left-2 text-[7px] font-black uppercase tracking-[0.18em] text-black/30">
                          {(index+1).toString().padStart(2,"0")}
                        </span>

                        {item.isPreorder&&(
                          <span className="absolute left-0 right-0 top-0 bg-black py-2 text-center text-[7px] font-black uppercase tracking-[0.18em] text-white">
                            Pre-Order
                          </span>
                        )}
                      </button>

                      <div className="flex min-w-0 flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-black/35">
                                {item.category||"Saint Clothing"}
                              </p>

                              <button
                                type="button"
                                onClick={()=>navigate(`/product/${item._id}`)}
                                className="mt-2 block max-w-full text-left"
                              >
                                <h3 className="text-xl font-black uppercase leading-[0.95] tracking-[-0.04em] transition hover:text-black/50 sm:text-2xl">
                                  {item.name}
                                </h3>
                              </button>
                            </div>

                            {item.onSale&&Number(item.salePercent)>0&&(
                              <span className="shrink-0 bg-black px-2.5 py-1.5 text-[7px] font-black uppercase tracking-[0.15em] text-white">
                                {item.salePercent}% Off
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                            <div>
                              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-black/30">
                                Size
                              </p>

                              <p className="mt-1 text-[10px] font-black uppercase">
                                {item.size}
                              </p>
                            </div>

                            {item.color&&(
                              <div>
                                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-black/30">
                                  Color
                                </p>

                                <div className="mt-1 flex items-center gap-1.5">
                                  {item.colorHex&&(
                                    <span
                                      className="h-2.5 w-2.5 rounded-full border border-black/10"
                                      style={{backgroundColor:item.colorHex}}
                                    />
                                  )}

                                  <p className="text-[10px] font-black uppercase">
                                    {item.color}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div>
                              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-black/30">
                                Reference
                              </p>

                              <p className="mt-1 text-[10px] font-black uppercase">
                                {String(item._id).slice(-6)}
                              </p>
                            </div>
                          </div>

                          {item.isPreorder&&(
                            <div className="mt-4 border-l-2 border-black pl-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em]">
                                  Pre-Order Item
                                </p>

                                <span className="bg-black px-2 py-1 text-[6px] font-black uppercase tracking-[0.14em] text-white">
                                  {item.availablePreorderStock} Slot{item.availablePreorderStock!==1?"s":""} Left
                                </span>
                              </div>

                              <p className="mt-1.5 text-[9px] font-medium leading-4 text-black/45">
                                Size {item.size} is reserved from upcoming stock.
                                {item.preorderRestockDate?` Expected restock: ${formatRestockDate(item.preorderRestockDate)}.`:""}
                              </p>

                              {item.preorderNote&&(
                                <p className="mt-1 text-[8px] font-medium leading-4 text-black/35">
                                  {item.preorderNote}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap items-end gap-5">
                          <div>
                            <p className="mb-2 text-[7px] font-black uppercase tracking-[0.2em] text-black/30">
                              Quantity
                            </p>

                            <div className="inline-flex h-10 border border-black">
                              <button
                                type="button"
                                onClick={()=>handleQtyChange(item,item.quantity-1)}
                                className="flex w-10 items-center justify-center text-base font-black transition hover:bg-black hover:text-white"
                              >
                                −
                              </button>

                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e)=>handleQtyChange(item,e.target.value)}
                                className="w-11 border-x border-black bg-transparent text-center text-[10px] font-black outline-none"
                              />

                              <button
                                type="button"
                                onClick={()=>handleQtyChange(item,item.quantity+1)}
                                className="flex w-10 items-center justify-center text-base font-black transition hover:bg-black hover:text-white"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={()=>handleRemove(item)}
                            className="group flex h-10 items-center gap-2 border-b border-transparent text-[8px] font-black uppercase tracking-[0.18em] text-black/35 transition hover:border-black hover:text-black"
                          >
                            <img
                              src={assets.bin_icon}
                              alt=""
                              className="w-3.5 opacity-40 transition group-hover:opacity-100"
                            />

                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-row items-end justify-between border-t border-black/10 pt-4 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                        <div className="lg:text-right">
                          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-black/30">
                            Unit Price
                          </p>

                          {item.onSale&&Number(item.salePercent)>0?(
                            <>
                              <p className="mt-1 text-[9px] font-bold text-black/30 line-through">
                                {currency}{Number(item.price||0).toFixed(2)}
                              </p>

                              <p className="text-base font-black">
                                {currency}{finalPrice.toFixed(2)}
                              </p>
                            </>
                          ):(
                            <p className="mt-1 text-base font-black">
                              {currency}{finalPrice.toFixed(2)}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-black/30">
                            Total
                          </p>

                          <p className="mt-1 text-xl font-black tracking-[-0.04em]">
                            {currency}{lineTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="xl:sticky xl:top-24">
            <div className="bg-black p-6 text-white sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-5">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/35">
                    Checkout
                  </p>

                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em]">
                    Cart Summary
                  </h2>
                </div>

                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">
                  {selectedItemsCount}/{cartData.length}
                </span>
              </div>

              <div className="py-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/45">
                    Selected Products
                  </span>

                  <span className="text-[11px] font-black">
                    {selectedItemsCount}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 py-4">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/45">
                    Total Quantity
                  </span>

                  <span className="text-[11px] font-black">
                    {selectedTotalQuantity}
                  </span>
                </div>

                {selectedPreorderCount>0&&(
                  <div className="flex items-center justify-between border-b border-white/10 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-white"/>

                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/45">
                        Pre-Order Items
                      </span>
                    </div>

                    <span className="text-[11px] font-black">
                      {selectedPreorderCount}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/15 pt-6">
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/35">
                  Estimated Subtotal
                </p>

                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="text-[9px] font-medium leading-5 text-white/35">
                    Shipping and payment fees are calculated at checkout.
                  </p>

                  <p className="shrink-0 text-3xl font-black tracking-[-0.05em]">
                    {currency}{selectedSubtotal.toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedPreorderCount>0&&(
                <div className="mt-5 border border-white/15 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white"/>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.18em]">
                        Pre-Order Included
                      </p>

                      <p className="mt-1 text-[8px] font-medium leading-4 text-white/40">
                        Your selected cart contains pre-order products. Delivery may depend on their expected restock dates.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={selectedCartData.length===0}
                className={`group mt-7 flex h-14 w-full items-center justify-between px-5 text-[9px] font-black uppercase tracking-[0.2em] transition ${
                  selectedCartData.length===0
                    ?"cursor-not-allowed bg-white/10 text-white/25"
                    :"bg-white text-black hover:bg-[#E5E3DD]"
                }`}
              >
                <span>Proceed to Checkout</span>
                <span className="text-lg transition group-hover:translate-x-1">→</span>
              </button>

              <button
                type="button"
                onClick={()=>navigate("/collection")}
                className="mt-3 h-12 w-full border border-white/20 text-[8px] font-black uppercase tracking-[0.2em] text-white/60 transition hover:border-white hover:text-white"
              >
                Continue Shopping
              </button>

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.12em]">
                      Secure
                    </p>

                    <p className="mt-1 text-[7px] text-white/30">
                      Checkout
                    </p>
                  </div>

                  <div className="border-x border-white/10">
                    <p className="text-[7px] font-black uppercase tracking-[0.12em]">
                      Official
                    </p>

                    <p className="mt-1 text-[7px] text-white/30">
                      Saint
                    </p>
                  </div>

                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.12em]">
                      Support
                    </p>

                    <p className="mt-1 text-[7px] text-white/30">
                      Available
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {recommendedProducts.length>0&&(
          <section className="mt-16 border-t border-black pt-8">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black/35">
                  Complete The Look
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase leading-none tracking-[-0.04em] sm:text-3xl">
                  You May Also Like
                </h2>
              </div>

              <p className="max-w-sm text-[9px] font-medium leading-5 text-black/40">
                Recommendations based on the products currently selected in your cart.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {recommendedProducts.map((item)=>(
                <ProductItem
                  key={item._id}
                  id={item._id}
                  name={item.name}
                  images={item.images}
                  price={item.price}
                  bestseller={item.bestseller}
                  newArrival={item.newArrival}
                  groupCode={item.groupCode}
                  color={item.color}
                  colorHex={item.colorHex}
                  onSale={item.onSale}
                  salePercent={item.salePercent}
                  stock={item.stock}
                  branch={item.branch}
                  badgeMode="none"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Cart;