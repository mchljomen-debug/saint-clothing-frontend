import React, { useContext, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

import gcashQr from "../assets/gcash_qr.jpeg";
import mayaQr from "../assets/maya_qr.jpeg";
import gotymeQr from "../assets/gotyme_qr.jpeg";

const normalizePaymentMethod = (value = "") => {
  const method = String(value).trim().toLowerCase();

  if (method === "gcash") return "GCash";
  if (method === "maya" || method === "paymaya") return "Maya";
  if (method === "gotyme" || method === "go tyme") return "GoTyme";
  return "GCash";
};

const ManualPayment = () => {
  const { backendUrl, token, setCartItems, user, fetchProducts } =
    useContext(ShopContext);

  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();

  const method = normalizePaymentMethod(searchParams.get("method") || "GCash");

  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentProofImage, setPaymentProofImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const qrImage = useMemo(() => {
    if (method === "GCash") return gcashQr;
    if (method === "Maya") return mayaQr;
    if (method === "GoTyme") return gotymeQr;
    return gcashQr;
  }, [method]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!orderId) {
      toast.error("Order ID is missing");
      return;
    }

    if (!referenceNumber.trim()) {
      toast.error("Reference number is required");
      return;
    }

    if (!paymentProofImage) {
      toast.error("Please upload your payment proof image");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("referenceNumber", referenceNumber.trim());
      formData.append("paymentMethod", method);
      formData.append("paymentProofImage", paymentProofImage);

      const response = await axios.post(
        `${backendUrl}/api/order/submit-payment-proof`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(`${method} payment proof submitted successfully!`);

        setCartItems({});
        localStorage.removeItem(`cart_${user?._id}`);
        localStorage.removeItem("checkout_cart");

        try {
          await axios.post(
            `${backendUrl}/api/cart/clear`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.log("CART CLEAR WARNING:", err.response?.data || err.message);
        }

        if (fetchProducts) {
          await fetchProducts();
        }

        navigate("/payment-submitted");
      } else {
        throw new Error(response.data.message || "Failed to submit payment proof");
      }
    } catch (error) {
      console.log("MANUAL PAYMENT ERROR:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-4 py-10 font-['Outfit']">
      <div className="max-w-3xl mx-auto rounded-[28px] border border-black/10 bg-white/60 backdrop-blur-md p-6 md:p-8">
        <h1 className="text-2xl font-black uppercase text-[#0A0D17]">
          {method} Payment
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Scan the QR code, complete the payment, then enter the reference number
          and upload your proof of payment.
        </p>

        <div className="mt-8 grid md:grid-cols-2 gap-6 items-start">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
              Scan QR
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-black/10 p-4 bg-[#fafafa]">
              <img
                src={qrImage}
                alt={`${method} QR`}
                className="w-full max-w-[320px] mx-auto object-contain"
              />
            </div>

            <div className="mt-4 rounded-xl bg-[#fafafa] px-4 py-3 text-xs text-gray-500">
              <p className="font-semibold text-[#0A0D17]">Instructions:</p>
              <p className="mt-1">1. Scan the QR code using {method}.</p>
              <p>2. Complete the payment.</p>
              <p>3. Enter the reference number.</p>
              <p>4. Upload a screenshot/photo of the payment proof.</p>
            </div>
          </div>

          <form
            onSubmit={onSubmitHandler}
            className="rounded-2xl border border-black/10 bg-white p-5"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
              Submit Payment
            </p>

            <div className="mt-4">
              <label className="text-sm font-semibold text-[#0A0D17]">
                Payment Method
              </label>
              <input
                type="text"
                value={method}
                readOnly
                className="mt-2 w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-3 outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold text-[#0A0D17]">
                Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter reference number"
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold text-[#0A0D17]">
                Upload Payment Proof
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPaymentProofImage(e.target.files?.[0] || null)}
                className="mt-2 block w-full rounded-xl border border-black/10 px-4 py-3"
              />
            </div>

            {paymentProofImage && (
              <p className="mt-2 text-xs text-gray-500">
                Selected file: {paymentProofImage.name}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 h-12 w-full rounded-2xl bg-black text-white text-[11px] font-black uppercase tracking-[0.22em] transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Submitting..." : `Submit ${method} Payment Proof`}
            </button>

            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="mt-3 h-11 w-full rounded-2xl border border-black/10 bg-white text-[11px] font-black uppercase tracking-[0.18em] text-[#0A0D17] transition hover:border-black"
            >
              Back to Orders
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManualPayment;