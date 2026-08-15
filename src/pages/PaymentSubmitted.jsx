import React, {
  useContext,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";
import useRecommendations from "../hooks/useRecommendations";
import axios from "axios";

const PaymentSubmitted = () => {
  const navigate = useNavigate();

  const {
    backendUrl,
    user,
    token,
    products,
  } = useContext(ShopContext);

  const checkoutCart = JSON.parse(
    localStorage.getItem("checkout_cart") || "[]"
  );

  const checkoutProductIds =
    Array.isArray(checkoutCart)
      ? checkoutCart
          .map((item) => item?._id)
          .filter(Boolean)
      : [];

  const checkoutCategory =
    Array.isArray(checkoutCart) &&
    checkoutCart.length > 0
      ? checkoutCart[0]?.category || "Tshirt"
      : "Tshirt";

  const checkoutColor =
    Array.isArray(checkoutCart) &&
    checkoutCart.length > 0
      ? checkoutCart[0]?.color || ""
      : "";

  const {
    recommendations: recommendedProducts,
  } = useRecommendations({
    backendUrl,
    products,
    productIds: checkoutProductIds,
    category: checkoutCategory,
    color: checkoutColor,
    userId: user?._id || null,
    limit: 4,
    enabled: !!products?.length,
  });

  useEffect(() => {
    const trackOrderSignals = async () => {
      try {
        if (!token || !user?._id) return;

        const checkoutCartData =
          JSON.parse(
            localStorage.getItem(
              "checkout_cart"
            ) || "[]"
          );

        if (
          !Array.isArray(checkoutCartData) ||
          checkoutCartData.length === 0
        ) {
          return;
        }

        for (const item of checkoutCartData) {
          if (!item?._id) continue;

          try {
            await axios.post(
              `${backendUrl}/api/recommendation/track`,
              {
                userId: user._id,
                productId: item._id,
                signalType: "order",
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          } catch (error) {
            if (
              error?.response?.status !== 404
            ) {
              console.error(
                "TRACK ORDER SIGNAL ERROR:",
                error
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "TRACK ORDER SIGNAL ERROR:",
          error
        );
      }
    };

    trackOrderSignals();
  }, [backendUrl, token, user]);

  return (
    <div className="min-h-screen bg-[#F6F6F3] px-3 pb-16 pt-5 font-['Outfit'] sm:px-5 md:px-8 lg:px-10 xl:px-12">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
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

                <span className="h-px w-8 bg-black/20" />

                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Complete
                </span>
              </div>

              <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.03em] text-[#0A0D17] sm:text-4xl">
                Payment Submitted
              </h1>

              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Your order is being processed
              </p>
            </div>

            <div className="border border-black/10 bg-[#F6F6F3] px-5 py-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                Status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center bg-black text-[10px] font-black text-white">
                  ✓
                </span>

                <p className="text-sm font-black uppercase text-black">
                  Submitted
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* LEFT */}
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

                {/* SUCCESS ICON */}
                <div className="flex h-20 w-20 items-center justify-center border border-black bg-black">
                  <span className="text-3xl font-black text-white">
                    ✓
                  </span>
                </div>

                <p className="mt-6 text-[9px] font-black uppercase tracking-[0.32em] text-gray-400">
                  Saint Clothing
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-[#0A0D17] sm:text-3xl">
                  Payment Submitted
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-6 text-gray-500">
                  Your payment proof has been
                  submitted successfully. Please
                  wait while we verify your payment
                  and process your order.
                </p>
              </div>

              {/* ORDER STATUS */}
              <div className="mt-8 border border-black/10 bg-[#F6F6F3]">
                <div className="grid sm:grid-cols-3">

                  <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Status
                    </p>

                    <p className="mt-2 text-sm font-black uppercase text-black">
                      Submitted
                    </p>
                  </div>

                  <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Verification
                    </p>

                    <p className="mt-2 text-sm font-black uppercase text-black">
                      Pending
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

              {/* MESSAGE */}
              <div className="mt-4 border border-black/10 bg-white px-5 py-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                  What happens next?
                </p>

                <p className="mt-2 text-xs font-semibold leading-6 text-gray-500">
                  Our team will verify your payment
                  and update your order status.
                  You can check your order anytime
                  from your Orders page.
                </p>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate("/orders")
                  }
                  className="h-12 border border-black bg-black px-6 text-[10px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black"
                >
                  Go to Orders
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/collection")
                  }
                  className="h-12 border border-black/10 bg-white px-6 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="space-y-5">

            {/* ORDER COMPLETE */}
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
                    ✓
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                      Payment
                    </p>

                    <p className="mt-1 text-xs font-black uppercase text-black">
                      Successfully Submitted
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/orders")
                  }
                  className="mt-4 h-11 w-full border border-black/10 bg-white text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black"
                >
                  View My Orders
                </button>
              </div>
            </section>

            {/* TRUST */}
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

        {/* RECOMMENDATIONS */}
        {recommendedProducts.length > 0 && (
          <section className="mt-5 border border-black/10 bg-white">

            <div className="border-b border-black/10 px-5 py-6 text-center sm:px-6">
              <p className="text-[9px] font-black uppercase tracking-[0.34em] text-gray-400">
                Saint Styling
              </p>

              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em] text-[#0A0D17] sm:text-2xl">
                Recommended Pieces
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-xs font-semibold text-gray-500">
                Complete your look with pieces
                selected based on your order.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
                {recommendedProducts.map(
                  (item) => (
                    <ProductItem
                      key={item._id}
                      id={item._id}
                      name={item.name}
                      images={item.images}
                      price={item.price}
                      bestseller={
                        item.bestseller
                      }
                      newArrival={
                        item.newArrival
                      }
                      groupCode={
                        item.groupCode
                      }
                      color={item.color}
                      colorHex={
                        item.colorHex
                      }
                      onSale={item.onSale}
                      salePercent={
                        item.salePercent
                      }
                      stock={item.stock}
                      branch={item.branch}
                      badgeMode="none"
                    />
                  )
                )}
              </div>
            </div>

          </section>
        )}

        {/* BOTTOM BRAND MESSAGE */}
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