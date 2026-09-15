import React,{useContext,useEffect,useMemo,useRef,useState}from"react";
import{useLocation,useNavigate}from"react-router-dom";
import{ShopContext}from"../context/ShopContext";
import ProductItem from"../components/ProductItem";
import useRecommendations from"../hooks/useRecommendations";
import axios from"axios";

const PaymentSubmitted=()=>{
  const navigate=useNavigate();
  const location=useLocation();

  const{
    backendUrl,
    user,
    token,
    products,
    fetchCart,
    getProductsData
  }=useContext(ShopContext);

  const cleanupStartedRef=useRef(false);
  const trackingStartedRef=useRef(false);
  const mountedRef=useRef(true);

  const[cleanupFinished,setCleanupFinished]=useState(false);
  const[paymentWaiting,setPaymentWaiting]=useState(false);
  const[paymentError,setPaymentError]=useState("");

  const isCOD=location.state?.paymentMethod==="COD";

  const urlOrderId=useMemo(()=>{
    const params=new URLSearchParams(location.search);
    return params.get("orderId")||"";
  },[location.search]);

  const pendingOrderId=useMemo(()=>{
    return urlOrderId||
      location.state?.orderId||
      localStorage.getItem("pending_paymongo_order")||
      "";
  },[urlOrderId,location.state?.orderId]);

  const checkoutCart=useMemo(()=>{
    try{
      const pendingPaymongoCart=JSON.parse(
        localStorage.getItem("pending_paymongo_cart")||"[]"
      );

      if(Array.isArray(pendingPaymongoCart)&&pendingPaymongoCart.length>0){
        return pendingPaymongoCart;
      }

      const normalCheckoutCart=JSON.parse(
        localStorage.getItem("checkout_cart")||"[]"
      );

      return Array.isArray(normalCheckoutCart)?normalCheckoutCart:[];
    }catch(error){
      console.log("CHECKOUT CART PARSE ERROR:",error);
      return[];
    }
  },[]);

  const checkoutProductIds=useMemo(()=>{
    return checkoutCart
      .map((item)=>item?._id||item?.productId)
      .filter(Boolean);
  },[checkoutCart]);

  const checkoutCategory=checkoutCart.length>0
    ?checkoutCart[0]?.category||"Tshirt"
    :"Tshirt";

  const checkoutColor=checkoutCart.length>0
    ?checkoutCart[0]?.color||""
    :"";

  const{recommendations:recommendedProducts}=useRecommendations({
    backendUrl,
    products,
    productIds:checkoutProductIds,
    category:checkoutCategory,
    color:checkoutColor,
    userId:user?._id||null,
    limit:4,
    enabled:!!products?.length
  });

  const clearCheckoutStorage=()=>{
    localStorage.removeItem("checkout_cart");
    localStorage.removeItem("pending_paymongo_cart");
    localStorage.removeItem("pending_paymongo_order");
    localStorage.removeItem("pending_paymongo_created_at");
  };

  const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));

  useEffect(()=>{
    mountedRef.current=true;

    return()=>{
      mountedRef.current=false;
    };
  },[]);

  useEffect(()=>{
    const finishCheckout=async()=>{
      if(cleanupStartedRef.current)return;
      if(!token||!user?._id)return;

      cleanupStartedRef.current=true;
      setPaymentError("");

      if(isCOD){
        try{
          if(fetchCart){
            await fetchCart(token,user._id,true);
          }

          if(getProductsData){
            await getProductsData();
          }

          localStorage.removeItem("checkout_cart");

          if(mountedRef.current){
            setCleanupFinished(true);
          }
        }catch(error){
          console.error(
            "COD CART REFRESH ERROR:",
            error.response?.data||error.message
          );

          if(mountedRef.current){
            setCleanupFinished(true);
          }
        }

        return;
      }

      if(!pendingOrderId){
        console.error("PAYMONGO RETURN: Missing order ID");

        if(mountedRef.current){
          setPaymentError("Unable to verify the PayMongo order.");
          setCleanupFinished(true);
        }

        return;
      }

      setPaymentWaiting(true);

      try{
        let paid=false;
        let lastStatus="pending";

        for(let attempt=0;attempt<20;attempt++){
          try{
            const response=await axios.post(
              `${backendUrl}/api/order/payment-status`,
              {
                orderId:pendingOrderId
              },
              {
                headers:{
                  Authorization:`Bearer ${token}`
                },
                timeout:20000
              }
            );

            if(response.data?.success){
              lastStatus=String(
                response.data.paymentStatus||"pending"
              ).toLowerCase();

              console.log(
                "PAYMONGO PAYMENT STATUS:",
                lastStatus,
                "ATTEMPT:",
                attempt+1
              );

              if(response.data.paid===true||lastStatus==="paid"){
                paid=true;
                break;
              }

              if(lastStatus==="failed"){
                break;
              }
            }
          }catch(error){
            console.error(
              "PAYMONGO STATUS CHECK ERROR:",
              error.response?.data||error.message
            );

            if(error.response?.status===401||
              error.response?.status===403||
              error.response?.status===404){
              throw error;
            }
          }

          if(attempt<19){
            await sleep(1500);
          }
        }

        if(!paid){
          if(lastStatus==="failed"){
            throw new Error("PayMongo payment was not completed.");
          }

          throw new Error(
            "Payment confirmation is taking longer than expected. Please check your Orders page."
          );
        }

        console.log("PAYMONGO PAYMENT CONFIRMED:",pendingOrderId);

        if(fetchCart){
          await fetchCart(token,user._id,true);
        }

        if(getProductsData){
          await getProductsData();
        }

        clearCheckoutStorage();

        if(mountedRef.current){
          setPaymentWaiting(false);
          setCleanupFinished(true);
        }
      }catch(error){
        console.error(
          "PAYMONGO PAYMENT CONFIRMATION ERROR:",
          error.response?.data||error.message
        );

        if(fetchCart){
          try{
            await fetchCart(token,user._id,true);
          }catch(fetchError){
            console.error(
              "PAYMONGO CART REFRESH ERROR:",
              fetchError.response?.data||fetchError.message
            );
          }
        }

        if(mountedRef.current){
          setPaymentWaiting(false);
          setPaymentError(
            error.response?.data?.message||
            error.message||
            "Unable to confirm payment."
          );
          setCleanupFinished(true);
        }
      }
    };

    finishCheckout();
  },[
    token,
    user?._id,
    isCOD,
    pendingOrderId,
    backendUrl,
    fetchCart,
    getProductsData
  ]);

  useEffect(()=>{
    const trackOrderSignals=async()=>{
      if(trackingStartedRef.current)return;
      if(!token||!user?._id)return;
      if(!checkoutCart.length)return;

      trackingStartedRef.current=true;

      try{
        for(const item of checkoutCart){
          const productId=item?._id||item?.productId;

          if(!productId)continue;

          try{
            await axios.post(
              `${backendUrl}/api/recommendation/track`,
              {
                userId:user._id,
                productId,
                signalType:"order"
              },
              {
                headers:{
                  Authorization:`Bearer ${token}`
                },
                timeout:15000
              }
            );
          }catch(error){
            if(error?.response?.status!==404){
              console.error(
                "TRACK ORDER SIGNAL ERROR:",
                error.response?.data||error.message
              );
            }
          }
        }
      }catch(error){
        console.error(
          "TRACK ORDER SIGNAL ERROR:",
          error.response?.data||error.message
        );
      }
    };

    if(cleanupFinished&&!paymentError){
      trackOrderSignals();
    }
  },[
    backendUrl,
    token,
    user?._id,
    checkoutCart,
    cleanupFinished,
    paymentError
  ]);

  return(
    <div className="min-h-screen bg-[#F6F6F3] px-3 pb-16 pt-5 font-['Outfit'] sm:px-5 md:px-8 lg:px-10 xl:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 border-b border-black/10 bg-white px-5 py-6 sm:px-6 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.38em] text-gray-400">
                Saint Clothing
              </p>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Order
                </span>

                <span className="h-px w-8 bg-black/20"/>

                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Complete
                </span>
              </div>

              <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.03em] text-[#0A0D17] sm:text-4xl">
                Payment Submitted
              </h1>

              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                {paymentWaiting
                  ?"Confirming your payment"
                  :paymentError
                    ?"Payment confirmation"
                    :"Your order is being processed"}
              </p>
            </div>

            <div className="border border-black/10 bg-[#F6F6F3] px-5 py-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                Status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center bg-black text-[10px] font-black text-white">
                  {paymentWaiting?"…":"✓"}
                </span>

                <p className="text-sm font-black uppercase text-black">
                  {paymentWaiting?"Confirming":"Submitted"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="border border-black/10 bg-white">
            <div className="border-b border-black/10 px-5 py-5 sm:px-6">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                01
              </p>

              <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-black">
                Payment Submitted
              </h2>
            </div>

            <div className="px-5 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center border border-black bg-black">
                  {paymentWaiting?(
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white"/>
                  ):(
                    <span className="text-3xl font-black text-white">
                      ✓
                    </span>
                  )}
                </div>

                <p className="mt-6 text-[9px] font-black uppercase tracking-[0.32em] text-gray-400">
                  Saint Clothing
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-[#0A0D17] sm:text-3xl">
                  {paymentWaiting
                    ?"Confirming Payment"
                    :"Payment Submitted"}
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-6 text-gray-500">
                  {paymentWaiting
                    ?"Your payment was submitted to PayMongo. We are waiting for secure payment confirmation before updating your order and shopping cart."
                    :"Your order has been submitted successfully. Purchased items are removed from your shopping cart while products you did not checkout remain in your cart."}
                </p>

                {!cleanupFinished&&(
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-black"/>

                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                      {paymentWaiting
                        ?"Confirming Payment"
                        :"Updating Your Cart"}
                    </p>
                  </div>
                )}

                {cleanupFinished&&!paymentError&&(
                  <div className="mt-5 border border-black/10 bg-[#F6F6F3] px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black">
                      Cart Updated
                    </p>
                  </div>
                )}

                {paymentError&&(
                  <div className="mt-5 max-w-xl border border-black/10 bg-[#F6F6F3] px-5 py-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                      Payment Status
                    </p>

                    <p className="mt-2 text-xs font-semibold leading-5 text-black">
                      {paymentError}
                    </p>

                    <button
                      type="button"
                      onClick={()=>navigate("/orders")}
                      className="mt-4 border border-black bg-black px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-white"
                    >
                      Check My Orders
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 border border-black/10 bg-[#F6F6F3]">
                <div className="grid sm:grid-cols-3">
                  <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Status
                    </p>

                    <p className="mt-2 text-sm font-black uppercase text-black">
                      {paymentWaiting?"Confirming":"Submitted"}
                    </p>
                  </div>

                  <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Payment
                    </p>

                    <p className="mt-2 text-sm font-black uppercase text-black">
                      {isCOD?"Cash on Delivery":"PayMongo"}
                    </p>
                  </div>

                  <div className="px-5 py-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Next Step
                    </p>

                    <p className="mt-2 text-sm font-black uppercase text-black">
                      Order Processing
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border border-black/10 bg-white px-5 py-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                  What happens next?
                </p>

                <p className="mt-2 text-xs font-semibold leading-6 text-gray-500">
                  Your order has been received. You can monitor the order status anytime from your Orders page.
                </p>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={()=>navigate("/orders")}
                  disabled={!cleanupFinished}
                  className="h-12 border border-black bg-black px-6 text-[10px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Go to Orders
                </button>

                <button
                  type="button"
                  onClick={()=>navigate("/collection")}
                  disabled={!cleanupFinished}
                  className="h-12 border border-black/10 bg-white px-6 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="border border-black/10 bg-white">
              <div className="border-b border-black/10 px-5 py-5">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                  Order
                </p>

                <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-black">
                  Complete
                </h2>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3 border border-black/10 bg-[#F6F6F3] px-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-black text-sm font-black text-white">
                    {paymentWaiting?"…":"✓"}
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                      Order
                    </p>

                    <p className="mt-1 text-xs font-black uppercase text-black">
                      {paymentWaiting
                        ?"Confirming Payment"
                        :"Successfully Submitted"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={()=>navigate("/orders")}
                  disabled={!cleanupFinished}
                  className="mt-4 h-11 w-full border border-black/10 bg-white text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  View My Orders
                </button>
              </div>
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

        {recommendedProducts.length>0&&(
          <section className="mt-5 border border-black/10 bg-white">
            <div className="border-b border-black/10 px-5 py-6 text-center sm:px-6">
              <p className="text-[9px] font-black uppercase tracking-[0.34em] text-gray-400">
                Saint Styling
              </p>

              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em] text-[#0A0D17] sm:text-2xl">
                Recommended Pieces
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-xs font-semibold text-gray-500">
                Complete your look with pieces selected based on your order.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
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
            </div>
          </section>
        )}

        <div className="mt-5 border border-black/10 bg-black px-5 py-5 text-center sm:px-6">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/50">
            Saint Clothing
          </p>

          <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-white">
            Thank you for shopping with us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSubmitted;