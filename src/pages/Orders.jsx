import React, { useState, useEffect, useContext, useMemo } from "react";
import Title from "../components/Title";
import { toast } from "react-toastify";
import axios from "axios";
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
  if (!dateValue) return "Waiting for restock date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Waiting for restock date";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
};

const getPreorderShipDate = (order, item) => {
  return (
    order?.preorderShipDate ||
    order?.deliveryEstimate?.shipsOn ||
    item?.preorderShipDate ||
    (item?.expectedRestockDate ? addDays(item.expectedRestockDate, 2) : null)
  );
};

const formatEstimateFromOrder = (order) => {
  if (order?.deliveryEstimate?.range) return order.deliveryEstimate.range;
  if (order?.estimatedDelivery?.range) return order.estimatedDelivery.range;

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

const StarPicker = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition ${
            star <= value
              ? "text-yellow-400"
              : "text-gray-300 hover:text-yellow-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const Orders = () => {
  const { backendUrl, token, user } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const currency = "₱";
  const itemsPerPage = 10;
  const notifyOrdersEnabled = !!user?.preferences?.notifyOrders;

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

    return "Order Placed";
  };

  const normalizePaymentMethod = (paymentMethod) => {
    const value = String(paymentMethod || "").trim().toLowerCase();

    if (value === "cod" || value === "cash on delivery") return "COD";
    if (value === "maya" || value === "paymaya") return "Maya";
    if (value === "gcash") return "GCash";
    if (value === "gotyme" || value === "go tyme") return "GoTyme";
    if (value === "stripe") return "Stripe";

    return paymentMethod || "COD";
  };

  const normalizePaymentStatus = (order) => {
    const statusValue = String(order?.paymentStatus || "").trim().toLowerCase();
    const method = normalizePaymentMethod(order?.paymentMethod);
    const orderStatus = normalizeStatus(order?.status);

    if (method === "COD") {
      if (order?.payment === true) return "paid";
      if (orderStatus === "Delivered") return "to_collect";
      return "cod_pending";
    }

    if (statusValue === "paid") return "paid";
    if (statusValue === "verifying") return "verifying";
    if (statusValue === "failed") return "failed";
    if (statusValue === "pending") return "pending";

    if (orderStatus === "Pending Payment") return "pending";
    if (orderStatus === "Payment Failed") return "failed";
    if (order?.payment === true) return "paid";

    return "pending";
  };

  const getPaymentStatusLabel = (order) => {
    const paymentState = normalizePaymentStatus(order);
    const method = normalizePaymentMethod(order?.paymentMethod);

    if (method === "COD") {
      if (paymentState === "paid") return "Paid";
      if (paymentState === "to_collect") return "Collected on Delivery";
      return "Cash on Delivery";
    }

    if (paymentState === "paid") return "Paid";
    if (paymentState === "verifying") return "Payment Verifying";
    if (paymentState === "failed") return "Payment Failed";
    return "Pending Payment";
  };

  const getPaymentStatusStyles = (order) => {
    const paymentState = normalizePaymentStatus(order);
    const method = normalizePaymentMethod(order?.paymentMethod);

    if (method === "COD") {
      if (paymentState === "paid") {
        return "text-emerald-700 border-emerald-200 bg-emerald-50";
      }
      if (paymentState === "to_collect") {
        return "text-sky-700 border-sky-200 bg-sky-50";
      }
      return "text-amber-700 border-amber-200 bg-amber-50";
    }

    if (paymentState === "paid") {
      return "text-emerald-700 border-emerald-200 bg-emerald-50";
    }
    if (paymentState === "verifying") {
      return "text-violet-700 border-violet-200 bg-violet-50";
    }
    if (paymentState === "failed") {
      return "text-red-700 border-red-200 bg-red-50";
    }
    return "text-amber-700 border-amber-200 bg-amber-50";
  };

  const getOrderStatusStyles = (status) => {
    switch (normalizeStatus(status)) {
      case "Delivered":
        return "text-emerald-700 border-emerald-200 bg-emerald-50";
      case "Out for Delivery":
        return "text-sky-700 border-sky-200 bg-sky-50";
      case "Shipped":
        return "text-gray-700 border-gray-300 bg-gray-100";
      case "Packing":
        return "text-violet-700 border-violet-200 bg-violet-50";
      case "Pending Payment":
        return "text-amber-700 border-amber-200 bg-amber-50";
      case "Payment Failed":
        return "text-red-700 border-red-200 bg-red-50";
      default:
        return "text-amber-700 border-amber-200 bg-amber-50";
    }
  };

  const getNewestOrders = (orders) => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || 0).getTime();
      return dateB - dateA;
    });
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

    if (clean.startsWith("/uploads/")) {
      return `${backendUrl}${clean}`;
    }

    if (clean.startsWith("uploads/")) {
      return `${backendUrl}/${clean}`;
    }

    const normalizedFolder = folder
      ? `${folder.replace(/^\/+|\/+$/g, "")}/`
      : "";
    return `${backendUrl}/uploads/${normalizedFolder}${clean}`;
  };

  const getOrderImageUrl = (image) => {
    return buildAssetUrl(image);
  };

  const notifyStatusChanges = (orders) => {
    if (!notifyOrdersEnabled || !user?._id) return;

    const storageKey = `order_status_map_${user._id}`;
    const previousMap = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const nextMap = {};

    orders.forEach((order) => {
      const normalized = normalizeStatus(order.status);
      nextMap[order._id] = normalized;

      if (previousMap[order._id] && previousMap[order._id] !== normalized) {
        toast.info(
          `Order ${order._id.slice(-8).toUpperCase()} updated: ${normalized}`
        );
      }
    });

    localStorage.setItem(storageKey, JSON.stringify(nextMap));
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/userorders`,
        { userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const sortedOrders = getNewestOrders(res.data.orders || []);
        setOrderData(sortedOrders);
        setCurrentPage(1);
        notifyStatusChanges(sortedOrders);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchOrders();
    }
  }, [token, user]);

  const sortedOrderData = useMemo(() => {
    return getNewestOrders(orderData);
  }, [orderData]);

  const filteredOrders = useMemo(() => {
    return sortedOrderData.filter((order) => {
      const status = normalizeStatus(order.status);
      const paymentState = normalizePaymentStatus(order);

      if (activeFilter === "all") return true;

      if (activeFilter === "toPay") {
        return (
          paymentState === "pending" ||
          paymentState === "verifying" ||
          paymentState === "cod_pending" ||
          status === "Pending Payment"
        );
      }

      if (activeFilter === "processing") {
        return status === "Order Placed" || status === "Packing";
      }

      if (activeFilter === "shipping") {
        return status === "Shipped" || status === "Out for Delivery";
      }

      if (activeFilter === "delivered") {
        return status === "Delivered";
      }

      return true;
    });
  }, [sortedOrderData, activeFilter]);

  const flattenedOrderItems = useMemo(() => {
    return filteredOrders.flatMap((order, index) =>
      (order.items || []).map((item, i) => ({
        key: `${order._id}-${i}-${index}`,
        order,
        item,
      }))
    );
  }, [filteredOrders]);

  const totalPages = Math.max(
    1,
    Math.ceil(flattenedOrderItems.length / itemsPerPage)
  );

  const paginatedOrderItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return flattenedOrderItems.slice(start, start + itemsPerPage);
  }, [flattenedOrderItems, currentPage]);

  const getStepIndex = (status) => {
    const normalized = normalizeStatus(status);
    return ORDER_STEPS.findIndex(
      (step) => step.toLowerCase() === normalized.toLowerCase()
    );
  };

  const markAsReceived = async (orderId) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/receive`,
        { orderId, userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Order marked as received");
        fetchOrders();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order status");
    }
  };

  const openReviewModal = (item, order) => {
    setSelectedReviewItem({
      ...item,
      orderId: order._id,
      orderStatus: order.status,
    });
    setReviewRating(5);
    setReviewComment("");
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    if (submittingReview) return;
    setReviewModalOpen(false);
    setSelectedReviewItem(null);
    setReviewRating(5);
    setReviewComment("");
  };

  const submitReview = async () => {
    if (!selectedReviewItem?.productId) {
      toast.error("Product not found for review");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please write your review");
      return;
    }

    try {
      setSubmittingReview(true);

      const res = await axios.post(
        `${backendUrl}/api/product/review/${selectedReviewItem.productId}`,
        {
          rating: reviewRating,
          comment: reviewComment.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("Review submitted successfully");
        closeReviewModal();
        fetchOrders();
      } else {
        toast.error(res.data.message || "Failed to submit review");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-[8px] pb-16 font-['Outfit']">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="border-t border-black/10 pt-8 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <Title text1="ORDER" text2="ARCHIVE" />
              <p className="mt-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.32em] text-gray-500">
                Purchase history and tracking
              </p>
            </div>

            <div className="hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-gray-400">
                {notifyOrdersEnabled ? "Order Alerts On" : "Live Tracking"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
          {ORDER_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => {
                setActiveFilter(filter.key);
                setCurrentPage(1);
              }}
              className={`shrink-0 rounded-full border px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                activeFilter === filter.key
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white/70 text-[#0A0D17] hover:border-black"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-6 md:mt-8 flex flex-col gap-4">
          {flattenedOrderItems.length === 0 ? (
            <div className="rounded-[22px] border border-black/10 bg-white/45 backdrop-blur-md py-28 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
                No Order History
              </p>
            </div>
          ) : (
            <>
              {paginatedOrderItems.map(({ order, item, key }) => {
                const normalizedStatus = normalizeStatus(order.status);
                const paymentMethod = normalizePaymentMethod(order.paymentMethod);
                const paymentLabel = getPaymentStatusLabel(order);
                const paymentState = normalizePaymentStatus(order);
                const currentStep = getStepIndex(order.status);

                const isPreorder = Boolean(order.isPreorder || item.isPreorder);
                const shipDate = getPreorderShipDate(order, item);

                const isOutForDelivery = normalizedStatus === "Out for Delivery";
                const isDelivered = normalizedStatus === "Delivered";
                const isPendingPayment = normalizedStatus === "Pending Payment";
                const isPaymentFailed = normalizedStatus === "Payment Failed";
                const showProgress = !isPendingPayment && !isPaymentFailed;

                const itemPrice = Number(item.price || 0);
                const salePercent = Number(item.salePercent || 0);
                const finalUnitPrice =
                  item.onSale && salePercent > 0
                    ? Math.max(itemPrice - (itemPrice * salePercent) / 100, 0)
                    : itemPrice;

                return (
                  <div
                    key={key}
                    className="group rounded-[22px] border border-black/10 bg-white/45 backdrop-blur-md p-5 md:p-6 lg:p-7 transition-all duration-300 hover:border-black/20"
                  >
                    <div className="flex flex-col gap-7">
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 flex-1">
                          <div className="relative w-28 h-36 overflow-hidden rounded-[16px] bg-white border border-black/10 flex-shrink-0">
                            <img
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              src={getOrderImageUrl(item.image)}
                              alt={item.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = assets.fallback_image;
                              }}
                            />
                          </div>

                          <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                              <p className="text-2xl font-black italic uppercase tracking-tight text-[#0A0D17] leading-none">
                                {item.name}
                              </p>

                              {isPreorder && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                                  Pre-order
                                </span>
                              )}
                            </div>

                            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                              Order Ref: {order._id.slice(-8).toUpperCase()}
                            </p>

                            <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-3">
                              <p className="text-lg font-black text-[#0A0D17]">
                                {currency}
                                {finalUnitPrice.toLocaleString()}
                              </p>

                              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                                Qty: {item.quantity}
                              </span>

                              <span className="rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                                Size: {item.size}
                              </span>
                            </div>

                            {isPreorder && (
                              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
                                  Ships On
                                </p>
                                <p className="mt-1 text-sm font-black text-amber-700">
                                  {formatDateLong(shipDate)}
                                </p>
                                {item.preorderNote && (
                                  <p className="mt-1 text-xs font-semibold text-amber-700/80">
                                    {item.preorderNote}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                  Date
                                </p>
                                <p className="mt-1 text-[12px] font-bold text-gray-700">
                                  {new Date(
                                    order.createdAt || order.date || Date.now()
                                  ).toLocaleDateString("en-US", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>

                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                  {isPreorder ? "Ships On" : "Est. Delivery"}
                                </p>
                                <p
                                  className={`mt-1 text-[12px] font-bold ${
                                    isPreorder ? "text-amber-700" : "text-gray-700"
                                  }`}
                                >
                                  {isPreorder
                                    ? formatDateLong(shipDate)
                                    : formatEstimateFromOrder(order)}
                                </p>
                              </div>

                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                  Payment Method
                                </p>
                                <p className="mt-1 text-[12px] font-bold uppercase text-gray-700">
                                  {paymentMethod}
                                </p>
                              </div>

                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                  Payment Status
                                </p>
                                <div
                                  className={`mt-1 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getPaymentStatusStyles(
                                    order
                                  )}`}
                                >
                                  {paymentLabel}
                                </div>
                              </div>

                              {(paymentMethod === "GCash" ||
                                paymentMethod === "Maya" ||
                                paymentMethod === "GoTyme") && (
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    Reference No.
                                  </p>
                                  <p className="mt-1 text-[12px] font-bold uppercase text-gray-700 break-all">
                                    {order.referenceNumber || "Not Available"}
                                  </p>
                                </div>
                              )}
                            </div>

                            {(paymentState === "verifying" ||
                              isPendingPayment ||
                              isPaymentFailed) && (
                              <div
                                className={`mt-5 rounded-2xl border px-4 py-3 text-left ${
                                  isPaymentFailed
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                                  {isPaymentFailed
                                    ? "Payment Issue"
                                    : "Payment Update"}
                                </p>
                                <p className="mt-1 text-xs font-semibold">
                                  {isPaymentFailed
                                    ? "Your online payment was not confirmed. Please contact support or try again."
                                    : paymentState === "verifying"
                                    ? "Your payment proof is under verification. We will update your order once confirmed."
                                    : "Waiting for payment confirmation before order processing starts."}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="xl:w-[250px] flex flex-col items-center xl:items-end gap-3">
                          <div
                            className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${getOrderStatusStyles(
                              order.status
                            )}`}
                          >
                            {normalizedStatus}
                          </div>

                          {isPreorder && (
                            <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                              Ships {formatDateLong(shipDate)}
                            </div>
                          )}

                          <button
                            onClick={() =>
                              toast.info(`Current order stage: ${normalizedStatus}`)
                            }
                            className="h-11 w-full xl:w-auto rounded-xl bg-black px-6 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90"
                          >
                            Track Order
                          </button>

                          {isOutForDelivery && (
                            <button
                              onClick={() => markAsReceived(order._id)}
                              className="h-11 w-full xl:w-auto rounded-xl border border-black bg-white px-6 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white"
                            >
                              Mark Received
                            </button>
                          )}

                          {isDelivered && (
                            <button
                              onClick={() => openReviewModal(item, order)}
                              className="h-11 w-full xl:w-auto rounded-xl border border-black/10 bg-white px-6 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black"
                            >
                              Rate & Review
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-black/10 pt-6">
                        {showProgress ? (
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {ORDER_STEPS.map((step, stepIndex) => {
                              const isDone = stepIndex <= currentStep;
                              const isCurrent = stepIndex === currentStep;

                              return (
                                <div
                                  key={step}
                                  className="flex flex-col items-center text-center gap-3"
                                >
                                  <div className="w-full flex items-center">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border ${
                                        isDone
                                          ? "bg-black text-white border-black"
                                          : "bg-white text-gray-400 border-black/10"
                                      }`}
                                    >
                                      {stepIndex + 1}
                                    </div>

                                    {stepIndex !== ORDER_STEPS.length - 1 && (
                                      <div
                                        className={`flex-1 h-[2px] ml-2 ${
                                          stepIndex < currentStep
                                            ? "bg-black"
                                            : "bg-black/10"
                                        }`}
                                      ></div>
                                    )}
                                  </div>

                                  <div>
                                    <p
                                      className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                                        isCurrent
                                          ? "text-black"
                                          : isDone
                                          ? "text-[#0A0D17]"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {step}
                                    </p>
                                    <p className="mt-1 text-[9px] text-gray-400">
                                      {isDone ? "Completed" : "Waiting"}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-black/10 bg-white px-4 py-5 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                              Order Progress
                            </p>
                            <p className="mt-2 text-sm font-bold text-[#0A0D17]">
                              {isPaymentFailed
                                ? "Order processing stopped because payment was not confirmed."
                                : "Order processing will begin after payment confirmation."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                    currentPage === 1
                      ? "cursor-not-allowed border border-black/10 bg-gray-100 text-gray-400"
                      : "border border-black bg-white text-black hover:bg-black hover:text-white"
                  }`}
                >
                  Prev
                </button>

                <div className="h-11 rounded-xl border border-black/10 bg-white px-5 flex items-center justify-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0A0D17]">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                    currentPage === totalPages
                      ? "cursor-not-allowed border border-black/10 bg-gray-100 text-gray-400"
                      : "border border-black bg-white text-black hover:bg-black hover:text-white"
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {reviewModalOpen && selectedReviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-[22px] border border-black/10 bg-white/90 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-lg font-black uppercase text-[#0A0D17]">
                  Rate & Review
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  {selectedReviewItem.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                className="text-xl font-bold text-gray-400 transition hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex items-center gap-4">
                <img
                  src={getOrderImageUrl(selectedReviewItem.image)}
                  alt={selectedReviewItem.name}
                  className="h-24 w-20 rounded-[14px] border border-black/10 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = assets.fallback_image;
                  }}
                />

                <div>
                  <p className="font-black uppercase text-[#0A0D17]">
                    {selectedReviewItem.name}
                  </p>
                  <p className="mt-1 text-xs uppercase text-gray-500">
                    Size: {selectedReviewItem.size}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-black uppercase text-[#0A0D17]">
                  Your Rating
                </p>
                <StarPicker value={reviewRating} onChange={setReviewRating} />
              </div>

              <div>
                <p className="mb-3 text-sm font-black uppercase text-[#0A0D17]">
                  Your Review
                </p>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write your experience about this product..."
                  className="min-h-[140px] w-full resize-none rounded-xl border border-black/10 bg-white p-4 outline-none transition focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-xl border border-black/10 px-5 py-3 text-sm font-black uppercase transition hover:border-black"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="rounded-xl bg-black px-6 py-3 text-sm font-black uppercase text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
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