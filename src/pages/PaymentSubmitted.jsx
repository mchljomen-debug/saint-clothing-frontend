import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";
import useRecommendations from "../hooks/useRecommendations";
import axios from "axios";

const PaymentSubmitted = () => {
  const navigate = useNavigate();
  const { backendUrl, user, token, products } = useContext(ShopContext);

  const checkoutCart = JSON.parse(localStorage.getItem("checkout_cart") || "[]");
  const checkoutProductIds = Array.isArray(checkoutCart)
    ? checkoutCart.map((item) => item?._id).filter(Boolean)
    : [];

  const checkoutCategory =
    Array.isArray(checkoutCart) && checkoutCart.length > 0
      ? checkoutCart[0]?.category || "Tshirt"
      : "Tshirt";

  const checkoutColor =
    Array.isArray(checkoutCart) && checkoutCart.length > 0
      ? checkoutCart[0]?.color || ""
      : "";

  const { recommendations: recommendedProducts } = useRecommendations({
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

        const checkoutCartData = JSON.parse(localStorage.getItem("checkout_cart") || "[]");
        if (!Array.isArray(checkoutCartData) || checkoutCartData.length === 0) return;

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
            if (error?.response?.status !== 404) {
              console.error("TRACK ORDER SIGNAL ERROR:", error);
            }
          }
        }
      } catch (error) {
        console.error("TRACK ORDER SIGNAL ERROR:", error);
      }
    };

    trackOrderSignals();
  }, [backendUrl, token, user]);

  return (
    <div className="min-h-screen px-4 py-10 font-['Outfit'] bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto rounded-[28px] border border-black/10 bg-white/60 backdrop-blur-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-white text-2xl font-black">
            ✓
          </div>

          <h1 className="mt-6 text-2xl md:text-3xl font-black uppercase text-[#0A0D17]">
            Payment Submitted
          </h1>

          <p className="mt-3 text-sm md:text-base text-gray-500 leading-7">
            Your payment proof has been submitted successfully. Please wait while
            we verify your payment.
          </p>

          <div className="mt-6 rounded-2xl border border-black/10 bg-[#FAFAF8] px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-gray-400">
              Saint Styling
            </p>
            <p className="mt-2 text-sm font-semibold text-[#0A0D17]">
              Complete the look with matching pieces below
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/orders")}
              className="h-12 px-6 rounded-2xl bg-black text-white text-[11px] font-black uppercase tracking-[0.22em] hover:opacity-90"
            >
              Go to Orders
            </button>

            <button
              onClick={() => navigate("/collection")}
              className="h-12 px-6 rounded-2xl border border-black/10 bg-white text-[11px] font-black uppercase tracking-[0.18em] text-[#0A0D17] hover:border-black"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {recommendedProducts.length > 0 && (
          <div className="mt-14">
            <div className="text-center mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-gray-400">
                Complete the Look
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase text-[#0A0D17]">
                Recommended Pieces
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendedProducts.map((item) => (
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
        )}
      </div>
    </div>
  );
};

export default PaymentSubmitted;