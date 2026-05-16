import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

const ORDER_STEPS = [
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const ORDER_FILTERS = [
  { key: "all", label: "All" },
  { key: "toPay", label: "To Pay" },
  { key: "processing", label: "Processing" },
  { key: "shipping", label: "Shipping" },
  { key: "delivered", label: "Delivered" },
];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDateLong = (dateValue) => {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatEstimateFromOrder = (order) => {
  if (order?.deliveryEstimate?.range) return order.deliveryEstimate.range;

  const baseDate = new Date(order?.createdAt || order?.date || Date.now());

  const start = addDays(baseDate, 3).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

  const end = addDays(baseDate, 5).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return `${start} - ${end}`;
};

const Orders = () => {
  const { backendUrl, token, user, currency = "₱" } = useContext(ShopContext);

  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [deliveryProofModalOpen, setDeliveryProofModalOpen] = useState(false);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null);
  const [deliveryProofImage, setDeliveryProofImage] = useState(null);
  const [deliveryProofPreview, setDeliveryProofPreview] = useState("");
  const [deliveryProofNote, setDeliveryProofNote] = useState("");
  const [submittingDeliveryProof, setSubmittingDeliveryProof] = useState(false);

  const itemsPerPage = 5;

  const normalizeStatus = (status) => {
    const value = String(status || "").trim().toLowerCase();

    if (value === "pending") return "Order Placed";
    if (value === "order placed") return "Order Placed";
    if (value === "packing") return "Packing";
    if (value === "shipped") return "Shipped";
    if (value === "out for delivery") return "Out for Delivery";
    if (value === "delivered") return "Delivered";
    if (value === "pending payment") return "Pending Payment";
    if (value === "payment failed") return "Payment Failed";
    if (value === "cancelled") return "Cancelled";

    return "Order Placed";
  };

  const normalizePaymentMethod = (method) => {
    const value = String(method || "").trim().toLowerCase();

    if (value === "cod" || value === "cash on delivery") return "COD";
    if (value === "gcash") return "GCash";
    if (value === "maya" || value === "paymaya") return "Maya";
    if (value === "gotyme" || value === "go tyme") return "GoTyme";
    if (value === "paymongo" || value === "online payment") return "PayMongo";

    return method || "COD";
  };

  const normalizePaymentStatus = (order) => {
    const statusValue = String(order?.paymentStatus || "").trim().toLowerCase();
    const method = normalizePaymentMethod(order?.paymentMethod);
    const orderStatus = normalizeStatus(order?.status);

    if (method === "COD") {
      if (order?.payment === true) return "paid";
      if (orderStatus === "Delivered") return "paid";
      return "cod_pending";
    }

    if (statusValue === "paid") return "paid";
    if (statusValue === "verifying") return "verifying";
    if (statusValue === "failed") return "failed";
    if (statusValue === "pending") return "pending";
    if (order?.payment === true) return "paid";

    return "pending";
  };

  const getPaymentStatusLabel = (order) => {
    const method = normalizePaymentMethod(order?.paymentMethod);
    const paymentState = normalizePaymentStatus(order);

    if (method === "COD") {
      if (paymentState === "paid") return "Paid";
      return "Cash on Delivery";
    }

    if (paymentState === "paid") return "Paid";
    if (paymentState === "verifying") return "Payment Verifying";
    if (paymentState === "failed") return "Payment Failed";
    return "Pending Payment";
  };

  const extractImageValue = (input) => {
    if (!input) return "";

    if (Array.isArray(input)) {
      for (const item of input) {
        const found = extractImageValue(item);
        if (found) return found;
      }
      return "";
    }

    if (typeof input === "object") {
      return (
        input.secure_url ||
        input.url ||
        input.image ||
        input.src ||
        input.path ||
        input.filename ||
        ""
      );
    }

    return String(input).trim();
  };

  const buildAssetUrl = (value, folder = "") => {
    const clean = extractImageValue(value);

    if (!clean) return assets.fallback_image;

    if (
      clean.startsWith("http://") ||
      clean.startsWith("https://") ||
      clean.startsWith("data:")
    ) {
      return clean;
    }

    if (clean.startsWith("/uploads/")) return `${backendUrl}${clean}`;
    if (clean.startsWith("uploads/")) return `${backendUrl}/${clean}`;

    const normalizedFolder = folder
      ? `${folder.replace(/^\/+|\/+$/g, "")}/`
      : "";

    return `${backendUrl}/uploads/${normalizedFolder}${clean}`;
  };

  const getOrderImageUrl = (image) => buildAssetUrl(image);

  const getStatusColor = (status) => {
    switch (normalizeStatus(status)) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Out for Delivery":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Packing":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Pending Payment":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Payment Failed":
        return "bg-red-50 text-red-700 border-red-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPaymentColor = (order) => {
    const paymentState = normalizePaymentStatus(order);

    if (paymentState === "paid") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (paymentState === "verifying") {
      return "bg-violet-50 text-violet-700 border-violet-200";
    }

    if (paymentState === "failed") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const getOrderStepIndex = (status) => {
    const normalized = normalizeStatus(status);
    const index = ORDER_STEPS.indexOf(normalized);
    return index >= 0 ? index : 0;
  };

  const fetchOrders = async () => {
    try {
      if (!token || !user?._id) return;

      const res = await axios.post(
        `${backendUrl}/api/order/userorders`,
        { userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const sorted = [...(res.data.orders || [])].sort(
          (a, b) =>
            new Date(b.createdAt || b.date || 0) -
            new Date(a.createdAt || a.date || 0)
        );

        setOrders(sorted);
      } else {
        toast.error(res.data.message || "Failed to load orders");
      }
    } catch (error) {
      console.error("LOAD ORDERS ERROR:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to load orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, user?._id]);

  const filteredOrders = useMemo(() => {
    let temp = [...orders];

    if (activeFilter === "toPay") {
      temp = temp.filter((order) =>
        ["Pending Payment", "Payment Failed"].includes(normalizeStatus(order.status))
      );
    }

    if (activeFilter === "processing") {
      temp = temp.filter((order) =>
        ["Order Placed", "Packing"].includes(normalizeStatus(order.status))
      );
    }

    if (activeFilter === "shipping") {
      temp = temp.filter((order) =>
        ["Shipped", "Out for Delivery"].includes(normalizeStatus(order.status))
      );
    }

    if (activeFilter === "delivered") {
      temp = temp.filter(
        (order) => normalizeStatus(order.status) === "Delivered"
      );
    }

    return temp;
  }, [orders, activeFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const openDeliveryProofModal = (order) => {
    setSelectedDeliveryOrder(order);
    setDeliveryProofImage(null);
    setDeliveryProofPreview("");
    setDeliveryProofNote("");
    setDeliveryProofModalOpen(true);
  };

  const closeDeliveryProofModal = () => {
    if (submittingDeliveryProof) return;

    setDeliveryProofModalOpen(false);
    setSelectedDeliveryOrder(null);
    setDeliveryProofImage(null);
    setDeliveryProofPreview("");
    setDeliveryProofNote("");
  };

  const handleDeliveryProofFile = (file) => {
    setDeliveryProofImage(file || null);

    if (!file) {
      setDeliveryProofPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setDeliveryProofPreview(previewUrl);
  };

  const submitDeliveryProof = async () => {
    try {
      if (!selectedDeliveryOrder?._id) {
        toast.error("Order is missing");
        return;
      }

      if (!deliveryProofImage) {
        toast.error("Please upload delivery proof photo");
        return;
      }

      const formData = new FormData();
      formData.append("orderId", selectedDeliveryOrder._id);
      formData.append("deliveryProofNote", deliveryProofNote || "");
      formData.append("deliveryProofImage", deliveryProofImage);

      setSubmittingDeliveryProof(true);

      const res = await axios.post(`${backendUrl}/api/order/receive`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        toast.success("Order marked as received with proof");
        closeDeliveryProofModal();
        await fetchOrders();
      } else {
        toast.error(res.data.message || "Failed to submit delivery proof");
      }
    } catch (error) {
      console.error(
        "DELIVERY PROOF ERROR:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit delivery proof"
      );
    } finally {
      setSubmittingDeliveryProof(false);
    }
  };

  const openJntTracking = () => {
    window.open("https://www.jtexpress.ph/track-and-trace", "_blank");
  };

  const canUploadDeliveryProof = (order) => {
    return (
      normalizeStatus(order.status) === "Out for Delivery" &&
      !order.deliveryProofImage
    );
  };

  return (
    <div className="min-h-screen bg-transparent px-4 py-10 font-['Outfit']">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Title text1="MY" text2="ORDERS" />

          <p className="mt-2 text-sm text-gray-500">
            Track your orders, shipping status, payment status, and delivery
            proof.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {ORDER_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-[5px] border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${
                activeFilter === filter.key
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white text-black hover:border-black"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {currentOrders.length === 0 ? (
          <div className="rounded-[5px] border border-dashed border-black/15 bg-white/70 py-20 text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-black/40">
              No Orders Found
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {currentOrders.map((order) => {
              const status = normalizeStatus(order.status);
              const activeStep = getOrderStepIndex(order.status);
              const paymentLabel = getPaymentStatusLabel(order);

              return (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-[5px] border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                >
                  <div className="border-b border-black/10 bg-[#0A0D17] px-4 py-4 text-white md:px-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                          Order ID
                        </p>

                        <p className="mt-1 break-all text-sm font-black">
                          #{String(order._id).slice(-10).toUpperCase()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-[5px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {status}
                        </span>

                        <span
                          className={`rounded-[5px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${getPaymentColor(
                            order
                          )}`}
                        >
                          {paymentLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:p-5">
                    <div className="mb-5 rounded-[5px] border border-black/10 bg-[#FAFAF8] p-4">
                      <div className="flex items-center justify-between gap-3 overflow-x-auto">
                        {ORDER_STEPS.map((step, index) => {
                          const done = index <= activeStep;
                          return (
                            <div
                              key={step}
                              className="flex min-w-[105px] flex-1 items-center"
                            >
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-black ${
                                    done
                                      ? "border-black bg-black text-white"
                                      : "border-black/10 bg-white text-black/40"
                                  }`}
                                >
                                  {index + 1}
                                </div>

                                <p
                                  className={`mt-2 text-center text-[9px] font-black uppercase tracking-[0.12em] ${
                                    done ? "text-black" : "text-black/35"
                                  }`}
                                >
                                  {step}
                                </p>
                              </div>

                              {index < ORDER_STEPS.length - 1 && (
                                <div
                                  className={`mx-2 h-[2px] flex-1 ${
                                    index < activeStep
                                      ? "bg-black"
                                      : "bg-black/10"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.8fr]">
                      <div className="space-y-3">
                        {(order.items || []).map((item, index) => {
                          const basePrice = Number(item.price || 0);
                          const salePercent = Number(item.salePercent || 0);
                          const finalPrice =
                            item.onSale && salePercent > 0
                              ? Math.max(
                                  basePrice - (basePrice * salePercent) / 100,
                                  0
                                )
                              : basePrice;

                          return (
                            <div
                              key={`${order._id}-${item.productId}-${item.size}-${index}`}
                              className="flex gap-3 rounded-[5px] border border-black/10 bg-white p-3"
                            >
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[5px] border border-black/10 bg-[#f5f5f5]">
                                <img
                                  src={getOrderImageUrl(item.image)}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = assets.fallback_image;
                                  }}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-black uppercase text-[#0A0D17]">
                                    {item.name}
                                  </p>

                                  {item.isPreorder && (
                                    <span className="rounded-[5px] bg-amber-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700">
                                      Pre-order
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs font-semibold text-gray-500">
                                  Size {item.size || "S"} · Qty{" "}
                                  {item.quantity || 1}
                                </p>

                                <p className="mt-1 text-sm font-black text-black">
                                  {currency}
                                  {(
                                    finalPrice * Number(item.quantity || 1)
                                  ).toLocaleString()}
                                </p>

                                {item.isPreorder && (
                                  <p className="mt-1 text-[11px] font-bold text-amber-700">
                                    Ships on{" "}
                                    {formatDateLong(
                                      order.preorderShipDate ||
                                        order.deliveryEstimate?.shipsOn ||
                                        item.expectedRestockDate
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-[5px] border border-black/10 bg-[#FAFAF8] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
                            Order Summary
                          </p>

                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-black/55">Total</span>
                              <span className="font-black">
                                {currency}
                                {Number(order.amount || 0).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="text-black/55">Payment</span>
                              <span className="font-bold">
                                {normalizePaymentMethod(order.paymentMethod)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="text-black/55">Order Date</span>
                              <span className="text-right font-bold">
                                {formatDateTime(order.createdAt || order.date)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="text-black/55">
                                Estimated Delivery
                              </span>
                              <span className="text-right font-bold">
                                {formatEstimateFromOrder(order)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(order.jntTrackingNumber || status === "Shipped" || status === "Out for Delivery") && (
                          <div className="rounded-[5px] border border-black/10 bg-white p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
                              Courier Tracking
                            </p>

                            <p className="mt-2 text-sm font-black">
                              {order.courier || "J&T Express"}
                            </p>

                            <p className="mt-1 break-all text-xs text-black/60">
                              Tracking No:{" "}
                              <span className="font-bold text-black">
                                {order.jntTrackingNumber || "Waiting for tracking number"}
                              </span>
                            </p>

                            <button
                              type="button"
                              onClick={openJntTracking}
                              className="mt-3 h-10 w-full rounded-[5px] border border-black/10 bg-black text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:opacity-90"
                            >
                              Track J&T Parcel
                            </button>
                          </div>
                        )}

                        {order.deliveryProofImage && (
                          <div className="rounded-[5px] border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                              Delivery Proof Submitted
                            </p>

                            <img
                              src={order.deliveryProofImage}
                              alt="Delivery Proof"
                              className="mt-3 max-h-60 w-full rounded-[5px] border border-emerald-200 bg-white object-contain"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = assets.fallback_image;
                              }}
                            />

                            {order.deliveryProofNote && (
                              <p className="mt-3 text-xs font-semibold text-emerald-800">
                                Note: {order.deliveryProofNote}
                              </p>
                            )}

                            {order.deliveryProofSubmittedAt && (
                              <p className="mt-2 text-[11px] text-emerald-700/70">
                                Submitted:{" "}
                                {formatDateTime(order.deliveryProofSubmittedAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {canUploadDeliveryProof(order) && (
                          <button
                            type="button"
                            onClick={() => openDeliveryProofModal(order)}
                            className="h-12 w-full rounded-[5px] bg-black text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:opacity-90"
                          >
                            I Received My Order
                          </button>
                        )}

                        {status === "Delivered" && !order.deliveryProofImage && (
                          <div className="rounded-[5px] border border-black/10 bg-white p-4 text-xs font-semibold text-black/55">
                            This order is marked delivered.
                          </div>
                        )}

                        {status === "Pending Payment" && (
                          <div className="rounded-[5px] border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-700">
                            Payment is still pending. Your order will continue
                            once payment is confirmed.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredOrders.length > itemsPerPage && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-[5px] border border-black/10 bg-white px-4 py-2 text-xs font-black uppercase disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-3 text-xs font-black uppercase tracking-[0.16em] text-black/50">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="rounded-[5px] border border-black/10 bg-white px-4 py-2 text-xs font-black uppercase disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {deliveryProofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-[5px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="bg-[#0A0D17] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                    Delivery Confirmation
                  </p>

                  <h2 className="mt-1 text-lg font-black uppercase">
                    Upload Proof
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDeliveryProofModal}
                  disabled={submittingDeliveryProof}
                  className="h-9 w-9 rounded-[5px] border border-white/15 bg-white/5 text-xl leading-none text-white"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sm font-semibold text-black/60">
                Upload a clear photo showing that you received the package.
                This will be visible to admin as delivery proof.
              </p>

              <div className="mt-5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
                  Proof Photo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleDeliveryProofFile(e.target.files?.[0] || null)
                  }
                  className="mt-2 w-full rounded-[5px] border border-black/10 bg-white px-3 py-3 text-sm"
                />
              </div>

              {deliveryProofPreview && (
                <div className="mt-4 rounded-[5px] border border-black/10 bg-[#FAFAF8] p-3">
                  <img
                    src={deliveryProofPreview}
                    alt="Delivery Proof Preview"
                    className="max-h-72 w-full rounded-[5px] object-contain"
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
                  Note Optional
                </label>

                <textarea
                  value={deliveryProofNote}
                  onChange={(e) => setDeliveryProofNote(e.target.value)}
                  placeholder="Example: Received by me / package received in good condition"
                  className="mt-2 h-28 w-full resize-none rounded-[5px] border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeDeliveryProofModal}
                  disabled={submittingDeliveryProof}
                  className="h-11 rounded-[5px] border border-black/10 bg-white text-[11px] font-black uppercase tracking-[0.16em] text-black disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitDeliveryProof}
                  disabled={submittingDeliveryProof}
                  className="h-11 rounded-[5px] bg-black text-[11px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
                >
                  {submittingDeliveryProof ? "Submitting..." : "Submit Proof"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;