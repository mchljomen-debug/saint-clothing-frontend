import React,{useContext,useEffect,useMemo,useState}from"react";
import{ShopContext}from"../context/ShopContext";
import{assets}from"../assets/assets";
import{toast}from"react-toastify";

const normalizeStockMap=(stock={})=>{
  if(stock instanceof Map){
    return Object.fromEntries(
      [...stock.entries()].map(([key,value])=>[
        String(key).trim().toUpperCase(),
        Number(value||0)
      ])
    );
  }

  if(!stock||typeof stock!=="object"||Array.isArray(stock))return{};

  return Object.fromEntries(
    Object.entries(stock).map(([key,value])=>[
      String(key).trim().toUpperCase(),
      Number(value||0)
    ])
  );
};

const normalizeBranch=(branch)=>{
  const value=String(branch||"").trim();
  return value||"branch1";
};

const getFinalPrice=(item)=>{
  const price=Number(item?.price||0);
  const salePercent=Number(item?.salePercent||0);

  if(item?.onSale&&salePercent>0){
    return Math.max(price-(price*salePercent)/100,0);
  }

  return price;
};

const getCartItemKey=(item)=>{
  return`${item._id||item.productId}_${String(item.size||"S").toUpperCase()}`;
};

const Cart=()=>{
  const{
    products,
    currency,
    cartItems,
    updateQuantity,
    navigate,
    delivery_fee
  }=useContext(ShopContext);

  const[cartData,setCartData]=useState([]);
  const[selectedItems,setSelectedItems]=useState(new Set());

  useEffect(()=>{
    if(!products?.length||!cartItems)return;

    const tempData=[];

    for(const productId in cartItems){
      const product=products.find(
        (item)=>String(item._id)===String(productId)
      );

      if(!product)continue;

      const sizes=cartItems[productId];

      if(!sizes||typeof sizes!=="object")continue;

      for(const size in sizes){
        const quantity=Number(sizes[size]||0);

        if(quantity<=0)continue;

        const normalizedSize=String(size||"S").trim().toUpperCase();
        const stock=normalizeStockMap(product.stock);
        const preorderStock=normalizeStockMap(product.preorderStock);
        const actualStock=Number(stock[normalizedSize]||0);
        const availablePreorderStock=Number(preorderStock[normalizedSize]||0);
        const preorderEnabled=product.preorderEnabled!==false;

        const isPreorder=
          preorderEnabled&&
          actualStock<=0&&
          availablePreorderStock>0;

        tempData.push({
          ...product,
          productId:product._id,
          size:normalizedSize,
          quantity,
          branch:normalizeBranch(product.branch),
          actualStock,
          availablePreorderStock,
          isPreorder,
          expectedRestockDate:isPreorder
            ?product.preorderRestockDate||null
            :null,
          preorderRestockDate:isPreorder
            ?product.preorderRestockDate||null
            :null,
          preorderNote:isPreorder
            ?product.preorderNote||""
            :""
        });
      }
    }

    setCartData(tempData);

    setSelectedItems((previous)=>{
      const validKeys=new Set(
        tempData.map((item)=>getCartItemKey(item))
      );

      return new Set(
        [...previous].filter((key)=>validKeys.has(key))
      );
    });
  },[products,cartItems]);

  const selectedCartData=useMemo(()=>{
    return cartData.filter((item)=>
      selectedItems.has(getCartItemKey(item))
    );
  },[cartData,selectedItems]);

  const selectedQuantity=useMemo(()=>{
    return selectedCartData.reduce(
      (total,item)=>total+Number(item.quantity||0),
      0
    );
  },[selectedCartData]);

  const selectedSubtotal=useMemo(()=>{
    return selectedCartData.reduce((total,item)=>{
      return total+
        getFinalPrice(item)*Number(item.quantity||0);
    },0);
  },[selectedCartData]);

  const selectedTotal=
    selectedSubtotal+
    (selectedCartData.length>0?Number(delivery_fee||0):0);

  const selectedBranches=useMemo(()=>{
    return[
      ...new Set(
        selectedCartData.map((item)=>
          normalizeBranch(item.branch)
        )
      )
    ];
  },[selectedCartData]);

  const allSelected=
    cartData.length>0&&
    selectedItems.size===cartData.length;

  const toggleItem=(item)=>{
    const key=getCartItemKey(item);

    setSelectedItems((previous)=>{
      const next=new Set(previous);

      if(next.has(key)){
        next.delete(key);
      }else{
        next.add(key);
      }

      return next;
    });
  };

  const toggleSelectAll=()=>{
    if(allSelected){
      setSelectedItems(new Set());
      return;
    }

    setSelectedItems(
      new Set(
        cartData.map((item)=>getCartItemKey(item))
      )
    );
  };

  const handleQuantityChange=async(item,newQuantity)=>{
    const quantity=Number(newQuantity);

    if(!Number.isFinite(quantity)||quantity<1)return;

    const availableStock=item.isPreorder
      ?Number(item.availablePreorderStock||0)
      :Number(item.actualStock||0);

    if(availableStock<=0){
      toast.error(
        item.isPreorder
          ?"This pre-order slot is no longer available"
          :"This item is currently out of stock"
      );
      return;
    }

    if(quantity>availableStock){
      toast.error(
        item.isPreorder
          ?`Only ${availableStock} pre-order slot${availableStock===1?"":"s"} available`
          :`Only ${availableStock} item${availableStock===1?"":"s"} available in stock`
      );
      return;
    }

    try{
      await updateQuantity(
        item._id||item.productId,
        item.size,
        quantity
      );
    }catch(error){
      console.log("UPDATE CART QUANTITY ERROR:",error);
      toast.error("Unable to update quantity");
    }
  };

  const removeItem=async(item)=>{
    try{
      await updateQuantity(
        item._id||item.productId,
        item.size,
        0
      );

      setSelectedItems((previous)=>{
        const next=new Set(previous);
        next.delete(getCartItemKey(item));
        return next;
      });
    }catch(error){
      console.log("REMOVE CART ITEM ERROR:",error);
      toast.error("Unable to remove item");
    }
  };

  const handleCheckout=()=>{
    if(!selectedCartData.length){
      toast.error("Select at least one item to checkout");
      return;
    }

    for(const item of selectedCartData){
      const availableStock=item.isPreorder
        ?Number(item.availablePreorderStock||0)
        :Number(item.actualStock||0);

      if(availableStock<=0){
        toast.error(
          item.isPreorder
            ?`${item.name} is no longer available for pre-order`
            :`${item.name} is currently out of stock`
        );
        return;
      }

      if(Number(item.quantity||0)>availableStock){
        toast.error(
          item.isPreorder
            ?`Only ${availableStock} pre-order slot${availableStock===1?"":"s"} available for ${item.name}`
            :`Only ${availableStock} item${availableStock===1?"":"s"} available for ${item.name}`
        );
        return;
      }
    }

    const checkoutData=selectedCartData.map((item)=>({
      ...item,
      productId:item._id||item.productId,
      size:String(item.size||"S").trim().toUpperCase(),
      quantity:Number(item.quantity||0),
      branch:normalizeBranch(item.branch),
      isPreorder:!!item.isPreorder,
      expectedRestockDate:
        item.expectedRestockDate||
        item.preorderRestockDate||
        null,
      preorderRestockDate:
        item.preorderRestockDate||
        item.expectedRestockDate||
        null,
      preorderNote:item.preorderNote||""
    }));

    console.log(
      "CHECKOUT BRANCHES:",
      checkoutData.map((item)=>({
        productId:item.productId,
        name:item.name,
        branch:item.branch,
        size:item.size,
        quantity:item.quantity,
        isPreorder:item.isPreorder
      }))
    );

    localStorage.setItem(
      "checkout_cart",
      JSON.stringify(checkoutData)
    );

    navigate("/place-order");
  };

  const formatRestockDate=(dateValue)=>{
    if(!dateValue)return"Restock date to be announced";

    const date=new Date(dateValue);

    if(Number.isNaN(date.getTime())){
      return"Restock date to be announced";
    }

    return date.toLocaleDateString("en-US",{
      month:"short",
      day:"2-digit",
      year:"numeric"
    });
  };

  if(!cartData.length){
    return(
      <div className="min-h-[70vh] bg-[#F6F6F3] px-4 py-16 font-['Outfit'] sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[55vh] max-w-7xl flex-col items-center justify-center bg-transparent px-6 py-20 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-gray-400">
            Saint Clothing
          </p>

          <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] text-black sm:text-5xl">
            Your Cart Is Empty
          </h1>

          <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-gray-500">
            Add your favorite Saint Clothing pieces to your cart and they will appear here.
          </p>

          <button
            type="button"
            onClick={()=>navigate("/collection")}
            className="mt-8 h-12 border border-black bg-black px-8 text-[10px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-transparent hover:text-black"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-[#F6F6F3] px-3 pb-16 pt-5 font-['Outfit'] sm:px-5 md:px-8 lg:px-10 xl:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 bg-[#0A0D17] px-5 py-6 text-white sm:px-6 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.38em] text-white/40">
                Saint Clothing / Checkout
              </p>

              <h1 className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
                Your Cart
              </h1>

              <p className="mt-2 text-xs font-semibold text-white/55">
                Review your items before checkout.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="border border-white/10 bg-white/5 px-5 py-3">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                  Products
                </p>

                <p className="mt-1 text-sm font-black">
                  {cartData.length}
                </p>
              </div>

              <div className="border border-white/10 bg-white/5 px-5 py-3">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                  Selected
                </p>

                <p className="mt-1 text-sm font-black">
                  {selectedItems.size}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="border border-black/10 bg-white">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-3"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center border transition ${
                    allSelected
                      ?"border-black bg-black"
                      :"border-black/20 bg-white"
                  }`}
                >
                  {allSelected&&(
                    <span className="text-[11px] font-black text-white">
                      ✓
                    </span>
                  )}
                </span>

                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-black">
                  Select All
                </span>
              </button>

              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                {cartData.length} {cartData.length===1?"Product":"Products"}
              </p>
            </div>

            <div>
              {cartData.map((item,index)=>{
                const key=getCartItemKey(item);
                const selected=selectedItems.has(key);
                const finalPrice=getFinalPrice(item);
                const basePrice=Number(item.price||0);
                const salePercent=Number(item.salePercent||0);
                const itemBranch=normalizeBranch(item.branch);

                return(
                  <div
                    key={`${key}_${index}`}
                    className="border-b border-black/10 px-4 py-5 last:border-b-0 sm:px-6"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={()=>toggleItem(item)}
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center border transition ${
                          selected
                            ?"border-black bg-black"
                            :"border-black/20 bg-white hover:border-black"
                        }`}
                      >
                        {selected&&(
                          <span className="text-[11px] font-black text-white">
                            ✓
                          </span>
                        )}
                      </button>

                      <div
                        onClick={()=>navigate(`/product/${item._id||item.productId}`)}
                        className="h-24 w-20 shrink-0 cursor-pointer bg-[radial-gradient(circle_at_center,#ffffff_0%,#f5f5f2_55%,#ededeb_100%)] sm:h-32 sm:w-28"
                      >
                        {item.images?.[0]||item.image?(
                          <img
                            src={item.images?.[0]||item.image}
                            alt={item.name}
                            className="h-full w-full object-contain p-2"
                          />
                        ):(
                          <div className="flex h-full items-center justify-center text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                              {item.category||"Saint Clothing"}
                            </p>

                            <button
                              type="button"
                              onClick={()=>navigate(`/product/${item._id||item.productId}`)}
                              className="mt-1 block max-w-full text-left"
                            >
                              <h2 className="truncate text-sm font-black uppercase tracking-[0.02em] text-black transition hover:opacity-60 sm:text-base">
                                {item.name}
                              </h2>
                            </button>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className="border border-black/10 bg-[#F6F6F3] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-gray-500">
                                Size {item.size}
                              </span>

                              {item.color&&(
                                <span className="border border-black/10 bg-[#F6F6F3] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-gray-500">
                                  {item.color}
                                </span>
                              )}

                              <span className="border border-black bg-black px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white">
                                {itemBranch}
                              </span>

                              {item.onSale&&salePercent>0&&(
                                <span className="border border-red-200 bg-red-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-red-600">
                                  {salePercent}% Off
                                </span>
                              )}

                              {item.isPreorder&&(
                                <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-amber-700">
                                  Pre-order
                                </span>
                              )}
                            </div>

                            {(item.sku||item.groupCode)&&(
                              <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.12em] text-gray-300">
                                {item.sku?`SKU ${item.sku}`:`REF ${item.groupCode}`}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 sm:text-right">
                            <p className="text-base font-black text-black">
                              {currency}{(finalPrice*Number(item.quantity||0)).toFixed(2)}
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-gray-400">
                              {currency}{finalPrice.toFixed(2)} each
                            </p>

                            {item.onSale&&salePercent>0&&(
                              <p className="mt-1 text-[9px] font-bold text-gray-300 line-through">
                                {currency}{basePrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>

                        {item.isPreorder&&(
                          <div className="mt-4 border border-amber-200 bg-amber-50 px-3 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">
                                  Available for Pre-order
                                </p>

                                <p className="mt-1 text-[10px] font-semibold text-amber-700/80">
                                  {formatRestockDate(item.expectedRestockDate||item.preorderRestockDate)}
                                </p>
                              </div>

                              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-amber-700">
                                {item.availablePreorderStock} Available
                              </p>
                            </div>

                            {item.preorderNote&&(
                              <p className="mt-2 text-[10px] font-semibold leading-5 text-amber-700/70">
                                {item.preorderNote}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
                          <div className="flex h-9 items-center border border-black/10 bg-white">
                            <button
                              type="button"
                              onClick={()=>handleQuantityChange(item,Number(item.quantity)-1)}
                              disabled={Number(item.quantity)<=1}
                              className="flex h-full w-9 items-center justify-center text-sm font-black text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                            >
                              −
                            </button>

                            <div className="flex h-full min-w-10 items-center justify-center border-x border-black/10 px-3 text-[10px] font-black text-black">
                              {item.quantity}
                            </div>

                            <button
                              type="button"
                              onClick={()=>handleQuantityChange(item,Number(item.quantity)+1)}
                              className="flex h-full w-9 items-center justify-center text-sm font-black text-black transition hover:bg-black hover:text-white"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={()=>removeItem(item)}
                            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400 transition hover:text-red-500"
                          >
                            {assets?.bin_icon&&(
                              <img
                                src={assets.bin_icon}
                                alt=""
                                className="h-3.5 w-3.5 object-contain opacity-50"
                              />
                            )}
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24">
            <section className="bg-[#0A0D17] p-5 text-white sm:p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                Cart Summary
              </p>

              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.03em]">
                Your Selection
              </h2>

              <div className="mt-6 space-y-3 border-y border-white/10 py-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                    Selected Products
                  </span>

                  <span className="text-xs font-black">
                    {selectedCartData.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                    Quantity
                  </span>

                  <span className="text-xs font-black">
                    {selectedQuantity}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                    Branches
                  </span>

                  <span className="text-xs font-black">
                    {selectedBranches.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                    Subtotal
                  </span>

                  <span className="text-xs font-black">
                    {currency}{selectedSubtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                    Delivery
                  </span>

                  <span className="text-xs font-black">
                    {selectedCartData.length
                      ?`${currency}${Number(delivery_fee||0).toFixed(2)}`
                      :`${currency}0.00`}
                  </span>
                </div>
              </div>

              {selectedBranches.length>1&&(
                <div className="mt-4 border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                    Multi-Branch Checkout
                  </p>

                  <p className="mt-2 text-[10px] font-semibold leading-5 text-white/65">
                    Your selected products come from {selectedBranches.length} branches. They can be placed in one order.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedBranches.map((branch)=>(
                      <span
                        key={branch}
                        className="border border-white/15 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white/70"
                      >
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                    Estimated Total
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {currency}{selectedTotal.toFixed(2)}
                  </p>
                </div>

                <p className="text-right text-[8px] font-bold uppercase leading-4 tracking-[0.1em] text-white/30">
                  Taxes included
                  <br/>
                  where applicable
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={!selectedCartData.length}
                className="mt-6 h-12 w-full border border-white bg-white text-[10px] font-black uppercase tracking-[0.22em] text-black transition hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/30"
              >
                Proceed to Checkout
              </button>

              <button
                type="button"
                onClick={()=>navigate("/collection")}
                className="mt-2 h-11 w-full border border-white/10 bg-transparent text-[9px] font-black uppercase tracking-[0.18em] text-white/60 transition hover:border-white hover:text-white"
              >
                Continue Shopping
              </button>
            </section>

            <div className="border border-black/10 bg-white px-5 py-4">
              <div className="grid grid-cols-3 divide-x divide-black/10 text-center">
                <div className="px-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Secure
                  </p>
                  <p className="mt-1 text-[9px] font-bold text-black">
                    Checkout
                  </p>
                </div>

                <div className="px-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Official
                  </p>
                  <p className="mt-1 text-[9px] font-bold text-black">
                    Saint Clothing
                  </p>
                </div>

                <div className="px-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Support
                  </p>
                  <p className="mt-1 text-[9px] font-bold text-black">
                    Order Updates
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {products?.length>0&&(
          <section className="mt-10 border-t border-black/10 pt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                  Saint Clothing
                </p>

                <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.03em] text-black">
                  You May Also Like
                </h2>
              </div>

              <button
                type="button"
                onClick={()=>navigate("/collection")}
                className="text-[9px] font-black uppercase tracking-[0.18em] text-black underline underline-offset-4"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products
                .filter((product)=>!product.isDeleted)
                .slice(0,4)
                .map((product)=>(
                  <button
                    type="button"
                    key={product._id}
                    onClick={()=>navigate(`/product/${product._id}`)}
                    className="group border border-black/10 bg-white text-left"
                  >
                    <div className="aspect-[4/5] bg-[radial-gradient(circle_at_center,#ffffff_0%,#f5f5f2_55%,#ededeb_100%)]">
                      {product.images?.[0]&&(
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>

                    <div className="border-t border-black/10 p-3">
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400">
                        {product.category||"Saint Clothing"}
                      </p>

                      <p className="mt-1 truncate text-xs font-black uppercase text-black">
                        {product.name}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-black text-black">
                          {currency}{getFinalPrice(product).toFixed(2)}
                        </p>

                        <span className="text-[7px] font-black uppercase tracking-[0.1em] text-gray-400">
                          {normalizeBranch(product.branch)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Cart;