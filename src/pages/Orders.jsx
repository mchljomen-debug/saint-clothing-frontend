import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiExternalLink,
  FiUpload,
  FiStar,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiHash,
  FiShoppingBag,
} from "react-icons/fi";

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
  { key: "all", label: "All Orders", icon: FiShoppingBag },
  { key: "toPay", label: "To Pay", icon: FiCreditCard },
  { key: "processing", label: "Processing", icon: FiPackage },
  { key: "shipping", label: "Shipping", icon: FiTruck },
  { key: "delivered", label: "Delivered", icon: FiCheckCircle },
];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDateLong = (dateValue) => {
  if (!dateValue) return "Waiting for restock date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Waiting for restock date";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
};

const formatOrderDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const getPreorderShipDate = (order, item) => {
  return (
    order?.preorderShipDate ||
    order?.deliveryEstimate?.shipsOn ||
    item?.preorderShipDate ||
    (item?.expectedRestockDate
      ? addDays(item.expectedRestockDate, 2)
      : null)
  );
};

const formatEstimateFromOrder = (order) => {
  if (order?.deliveryEstimate?.range) {
    return order.deliveryEstimate.range;
  }

  if (order?.estimatedDelivery?.range) {
    return order.estimatedDelivery.range;
  }

  const baseDate = new Date(
    order?.createdAt || order?.date || Date.now()
  );

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
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-2xl transition ${
            star <= value
              ? "bg-amber-50 text-amber-400"
              : "text-gray-300 hover:bg-gray-50 hover:text-amber-300"
          }`}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
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
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [deliveryProofModalOpen, setDeliveryProofModalOpen] =
    useState(false);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null);
  const [deliveryProofImage, setDeliveryProofImage] = useState(null);
  const [deliveryProofPreview, setDeliveryProofPreview] = useState("");
  const [deliveryProofNote, setDeliveryProofNote] = useState("");
  const [submittingDeliveryProof, setSubmittingDeliveryProof] =
    useState(false);

  const currency = "₱";
  const itemsPerPage = 8;
  const notifyOrdersEnabled = !!user?.preferences?.notifyOrders;

  const normalizeStatus = useCallback((status) => {
    const value = String(status || "")
      .trim()
      .toLowerCase();

    if (value === "pending") return "Order Placed";
    if (value === "order placed") return "Order Placed";
    if (value === "packing") return "Packing";
    if (value === "shipped") return "Shipped";
    if (value === "out for delivery") return "Out for Delivery";
    if (value === "delivered") return "Delivered";
    if (value === "pending payment") return "Pending Payment";
    if (value === "payment failed") return "Payment Failed";

    return "Order Placed";
  }, []);

  const normalizePaymentMethod = useCallback((paymentMethod) => {
    const value = String(paymentMethod || "")
      .trim()
      .toLowerCase();

    if (value === "cod" || value === "cash on delivery") return "COD";
    if (value === "maya" || value === "paymaya") return "Maya";
    if (value === "gcash") return "GCash";
    if (value === "gotyme" || value === "go tyme") return "GoTyme";
    if (value === "stripe") return "Stripe";
    if (value === "paymongo" || value === "online payment") {
      return "PayMongo";
    }

    return paymentMethod || "COD";
  }, []);

  const normalizePaymentStatus = useCallback(
    (order) => {
      const statusValue = String(order?.paymentStatus || "")
        .trim()
        .toLowerCase();

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
    },
    [normalizePaymentMethod, normalizeStatus]
  );

  const getPaymentStatusLabel = useCallback(
    (order) => {
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
    },
    [normalizePaymentMethod, normalizePaymentStatus]
  );

  const getPaymentStatusStyles = useCallback(
    (order) => {
      const paymentState = normalizePaymentStatus(order);
      const method = normalizePaymentMethod(order?.paymentMethod);

      if (method === "COD") {
        if (paymentState === "paid") {
          return "border-emerald-200 bg-emerald-50 text-emerald-700";
        }

        if (paymentState === "to_collect") {
          return "border-sky-200 bg-sky-50 text-sky-700";
        }

        return "border-amber-200 bg-amber-50 text-amber-700";
      }

      if (paymentState === "paid") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      }

      if (paymentState === "verifying") {
        return "border-violet-200 bg-violet-50 text-violet-700";
      }

      if (paymentState === "failed") {
        return "border-red-200 bg-red-50 text-red-700";
      }

      return "border-amber-200 bg-amber-50 text-amber-700";
    },
    [normalizePaymentMethod, normalizePaymentStatus]
  );

  const getOrderStatusStyles = useCallback(
    (status) => {
      switch (normalizeStatus(status)) {
        case "Delivered":
          return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case "Out for Delivery":
          return "border-sky-200 bg-sky-50 text-sky-700";

        case "Shipped":
          return "border-gray-200 bg-gray-50 text-gray-700";

        case "Packing":
          return "border-violet-200 bg-violet-50 text-violet-700";

        case "Pending Payment":
          return "border-amber-200 bg-amber-50 text-amber-700";

        case "Payment Failed":
          return "border-red-200 bg-red-50 text-red-700";

        default:
          return "border-amber-200 bg-amber-50 text-amber-700";
      }
    },
    [normalizeStatus]
  );

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "Delivered":
        return FiCheckCircle;

      case "Out for Delivery":
      case "Shipped":
        return FiTruck;

      case "Packing":
        return FiPackage;

      default:
        return FiClock;
    }
  }, []);

  const getNewestOrders = useCallback((orders) => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(
        a.createdAt || a.date || 0
      ).getTime();

      const dateB = new Date(
        b.createdAt || b.date || 0
      ).getTime();

      return dateB - dateA;
    });
  }, []);

  const extractImageValue = useCallback((input) => {
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
  }, []);

  const buildAssetUrl = useCallback(
    (value, folder = "") => {
      const clean = extractImageValue(value);

      if (!clean) {
        return assets.fallback_image;
      }

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
    },
    [backendUrl, extractImageValue]
  );

  const getOrderImageUrl = useCallback(
    (image) => buildAssetUrl(image),
    [buildAssetUrl]
  );

  const notifyStatusChanges = useCallback(
    (orders) => {
      if (!notifyOrdersEnabled || !user?._id) return;

      const storageKey = `order_status_map_${user._id}`;

      let previousMap = {};

      try {
        previousMap = JSON.parse(
          localStorage.getItem(storageKey) || "{}"
        );
      } catch {
        previousMap = {};
      }

      const nextMap = {};

      orders.forEach((order) => {
        const normalized = normalizeStatus(order.status);

        nextMap[order._id] = normalized;

        if (
          previousMap[order._id] &&
          previousMap[order._id] !== normalized
        ) {
          toast.info(
            `Order ${String(order._id)
              .slice(-8)
              .toUpperCase()} updated: ${normalized}`
          );
        }
      });

      localStorage.setItem(
        storageKey,
        JSON.stringify(nextMap)
      );
    },
    [notifyOrdersEnabled, user, normalizeStatus]
  );

  const fetchOrders = useCallback(async () => {
    if (!token || !user?._id) return;

    try {
      setLoadingOrders(true);

      const res = await axios.post(
        `${backendUrl}/api/order/userorders`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        const sortedOrders = getNewestOrders(
          res.data.orders || []
        );

        setOrderData(sortedOrders);
        setCurrentPage(1);
        notifyStatusChanges(sortedOrders);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [
    backendUrl,
    token,
    user,
    getNewestOrders,
    notifyStatusChanges,
  ]);

  useEffect(() => {
    if (token && user) {
      fetchOrders();
    }
  }, [token, user, fetchOrders]);

  const sortedOrderData = useMemo(
    () => getNewestOrders(orderData),
    [orderData, getNewestOrders]
  );

  const filteredOrders = useMemo(() => {
    return sortedOrderData.filter((order) => {
      const status = normalizeStatus(order.status);
      const paymentState = normalizePaymentStatus(order);

      if (activeFilter === "all") {
        return true;
      }

      if (activeFilter === "toPay") {
        return (
          paymentState === "pending" ||
          paymentState === "verifying" ||
          paymentState === "cod_pending" ||
          status === "Pending Payment"
        );
      }

      if (activeFilter === "processing") {
        return (
          status === "Order Placed" ||
          status === "Packing"
        );
      }

      if (activeFilter === "shipping") {
        return (
          status === "Shipped" ||
          status === "Out for Delivery"
        );
      }

      if (activeFilter === "delivered") {
        return status === "Delivered";
      }

      return true;
    });
  }, [
    sortedOrderData,
    activeFilter,
    normalizeStatus,
    normalizePaymentStatus,
  ]);

  const filterCounts = useMemo(() => {
    return {
      all: sortedOrderData.length,

      toPay: sortedOrderData.filter((order) => {
        const status = normalizeStatus(order.status);
        const paymentState = normalizePaymentStatus(order);

        return (
          paymentState === "pending" ||
          paymentState === "verifying" ||
          paymentState === "cod_pending" ||
          status === "Pending Payment"
        );
      }).length,

      processing: sortedOrderData.filter((order) => {
        const status = normalizeStatus(order.status);

        return (
          status === "Order Placed" ||
          status === "Packing"
        );
      }).length,

      shipping: sortedOrderData.filter((order) => {
        const status = normalizeStatus(order.status);

        return (
          status === "Shipped" ||
          status === "Out for Delivery"
        );
      }).length,

      delivered: sortedOrderData.filter(
        (order) =>
          normalizeStatus(order.status) === "Delivered"
      ).length,
    };
  }, [
    sortedOrderData,
    normalizeStatus,
    normalizePaymentStatus,
  ]);

  const flattenedOrderItems = useMemo(() => {
    return filteredOrders.flatMap((order, orderIndex) =>
      (order.items || []).map((item, itemIndex) => ({
        key: `${order._id}-${itemIndex}-${orderIndex}`,
        order,
        item,
      }))
    );
  }, [filteredOrders]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      flattenedOrderItems.length / itemsPerPage
    )
  );

  const paginatedOrderItems = useMemo(() => {
    const start =
      (currentPage - 1) * itemsPerPage;

    return flattenedOrderItems.slice(
      start,
      start + itemsPerPage
    );
  }, [
    flattenedOrderItems,
    currentPage,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStepIndex = useCallback(
    (status) => {
      const normalized = normalizeStatus(status);

      return ORDER_STEPS.findIndex(
        (step) =>
          step.toLowerCase() ===
          normalized.toLowerCase()
      );
    },
    [normalizeStatus]
  );

  const openDeliveryProofModal = (order) => {
    setSelectedDeliveryOrder(order);
    setDeliveryProofImage(null);
    setDeliveryProofPreview("");
    setDeliveryProofNote("");
    setDeliveryProofModalOpen(true);
  };

  const closeDeliveryProofModal = () => {
    if (submittingDeliveryProof) return;

    if (deliveryProofPreview) {
      URL.revokeObjectURL(
        deliveryProofPreview
      );
    }

    setDeliveryProofModalOpen(false);
    setSelectedDeliveryOrder(null);
    setDeliveryProofImage(null);
    setDeliveryProofPreview("");
    setDeliveryProofNote("");
  };

  const handleDeliveryProofChange = (e) => {
    const file =
      e.target.files?.[0] || null;

    setDeliveryProofImage(file);

    if (deliveryProofPreview) {
      URL.revokeObjectURL(
        deliveryProofPreview
      );
    }

    if (file) {
      setDeliveryProofPreview(
        URL.createObjectURL(file)
      );
    } else {
      setDeliveryProofPreview("");
    }
  };

  const markAsReceived = async () => {
    if (!selectedDeliveryOrder?._id) {
      toast.error("Order is missing");
      return;
    }

    if (!deliveryProofImage) {
      toast.error(
        "Please attach a delivery proof photo"
      );
      return;
    }

    try {
      setSubmittingDeliveryProof(true);

      const proofData = new FormData();

      proofData.append(
        "orderId",
        selectedDeliveryOrder._id
      );

      proofData.append(
        "deliveryProofImage",
        deliveryProofImage
      );

      proofData.append(
        "deliveryProofNote",
        deliveryProofNote.trim()
      );

      const res = await axios.post(
        `${backendUrl}/api/order/receive`,
        proofData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      if (res.data.success) {
        toast.success(
          "Delivery proof uploaded successfully"
        );

        closeDeliveryProofModal();
        fetchOrders();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to submit delivery proof"
      );
    } finally {
      setSubmittingDeliveryProof(false);
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
      toast.error(
        "Product not found for review"
      );
      return;
    }

    if (!reviewComment.trim()) {
      toast.error(
        "Please write your review"
      );
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        toast.success(
          "Review submitted successfully"
        );

        closeReviewModal();
        fetchOrders();
      } else {
        toast.error(
          res.data.message ||
            "Failed to submit review"
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to submit review"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-4 font-['Outfit']">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8 border-b border-black/10 pb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                <FiShoppingBag />
                <span>My Account</span>
                <span>/</span>
                <span className="text-black">
                  Orders
                </span>
              </div>

              <h1 className="text-4xl font-black uppercase tracking-[-0.04em] text-[#0A0D17] sm:text-5xl">
                My Orders
              </h1>

              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-gray-500">
                View your purchases, monitor delivery
                progress, manage payments, and review
                products you've received.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/70 px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Total Orders
                </p>
                <p className="mt-1 text-2xl font-black text-[#0A0D17]">
                  {sortedOrderData.length}
                </p>
              </div>

              <div className="hidden rounded-2xl border border-black/10 bg-white/70 px-5 py-4 sm:block">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Tracking
                </p>

                <p className="mt-1 text-[11px] font-black uppercase text-emerald-600">
                  {notifyOrdersEnabled
                    ? "Alerts Active"
                    : "Available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-8 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {ORDER_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const count =
                filterCounts[filter.key] || 0;

              const active =
                activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(
                      filter.key
                    );
                    setCurrentPage(1);
                  }}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white/70 text-[#0A0D17] hover:border-black/30"
                  }`}
                >
                  <Icon className="text-base" />

                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                    {filter.label}
                  </span>

                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[9px] font-black ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-black/5 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        {loadingOrders ? (
          <div className="space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[24px] border border-black/10 bg-white/50 p-6"
              >
                <div className="flex gap-5">
                  <div className="h-32 w-24 rounded-2xl bg-black/5" />

                  <div className="flex-1 space-y-4">
                    <div className="h-5 w-1/3 rounded bg-black/5" />
                    <div className="h-3 w-1/2 rounded bg-black/5" />
                    <div className="h-3 w-2/3 rounded bg-black/5" />
                    <div className="h-10 w-full rounded bg-black/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : flattenedOrderItems.length === 0 ? (
          <div className="rounded-[28px] border border-black/10 bg-white/60 px-6 py-24 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
              <FiShoppingBag className="text-2xl text-gray-400" />
            </div>

            <h2 className="mt-6 text-xl font-black uppercase tracking-tight text-[#0A0D17]">
              No Orders Found
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-gray-500">
              {activeFilter === "all"
                ? "Your purchased products will appear here once you place your first order."
                : "There are no orders matching this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {paginatedOrderItems.map(
              ({ order, item, key }) => {
                const normalizedStatus =
                  normalizeStatus(order.status);

                const paymentMethod =
                  normalizePaymentMethod(
                    order.paymentMethod
                  );

                const paymentLabel =
                  getPaymentStatusLabel(order);

                const paymentState =
                  normalizePaymentStatus(order);

                const currentStep =
                  getStepIndex(order.status);

                const isPreorder = Boolean(
                  order.isPreorder ||
                    item.isPreorder
                );

                const shipDate =
                  getPreorderShipDate(
                    order,
                    item
                  );

                const isDelivered =
                  normalizedStatus ===
                  "Delivered";

                const isPendingPayment =
                  normalizedStatus ===
                  "Pending Payment";

                const isPaymentFailed =
                  normalizedStatus ===
                  "Payment Failed";

                const showProgress =
                  !isPendingPayment &&
                  !isPaymentFailed;

                const itemPrice = Number(
                  item.price || 0
                );

                const salePercent = Number(
                  item.salePercent || 0
                );

                const finalUnitPrice =
                  item.onSale &&
                  salePercent > 0
                    ? Math.max(
                        itemPrice -
                          (itemPrice *
                            salePercent) /
                            100,
                        0
                      )
                    : itemPrice;

                const StatusIcon =
                  getStatusIcon(
                    normalizedStatus
                  );

                return (
                  <article
                    key={key}
                    className="overflow-hidden rounded-[26px] border border-black/10 bg-white/65 shadow-[0_10px_40px_rgba(0,0,0,0.03)] backdrop-blur-md transition hover:border-black/20"
                  >
                    {/* ORDER TOP BAR */}
                    <div className="flex flex-col gap-4 border-b border-black/10 bg-white/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
                            Order Number
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <FiHash className="text-xs text-gray-400" />

                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0A0D17]">
                              {String(
                                order._id || ""
                              )
                                .slice(-8)
                                .toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="hidden h-7 w-px bg-black/10 sm:block" />

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
                            Ordered
                          </p>

                          <p className="mt-1 text-[11px] font-bold text-gray-700">
                            {formatOrderDate(
                              order.createdAt ||
                                order.date
                            )}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] ${getOrderStatusStyles(
                          order.status
                        )}`}
                      >
                        <StatusIcon />

                        {normalizedStatus}
                      </div>
                    </div>

                    {/* PRODUCT */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
                          <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-[#F5F5F2] sm:h-36 sm:w-28">
                            <img
                              src={getOrderImageUrl(
                                item.image
                              )}
                              alt={item.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-500 hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.onerror =
                                  null;

                                e.currentTarget.src =
                                  assets.fallback_image;
                              }}
                            />

                            {item.quantity > 1 && (
                              <div className="absolute bottom-2 right-2 rounded-full bg-black px-2 py-1 text-[8px] font-black text-white">
                                ×{item.quantity}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-[#0A0D17] sm:text-2xl">
                                {item.name}
                              </h2>

                              {isPreorder && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-amber-700">
                                  Pre-order
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-lg bg-black px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                                Size {item.size || "—"}
                              </span>

                              <span className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-gray-600">
                                Qty {item.quantity || 1}
                              </span>
                            </div>

                            <div className="mt-5">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                                Item Price
                              </p>

                              <p className="mt-1 text-xl font-black text-[#0A0D17]">
                                {currency}
                                {finalUnitPrice.toLocaleString()}
                              </p>
                            </div>

                            {/* PREORDER */}
                            {isPreorder && (
                              <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                                  <FiCalendar />
                                </div>

                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">
                                    Estimated Ship Date
                                  </p>

                                  <p className="mt-1 text-sm font-black text-amber-800">
                                    {formatDateLong(
                                      shipDate
                                    )}
                                  </p>

                                  {item.preorderNote && (
                                    <p className="mt-1 text-[11px] font-medium leading-5 text-amber-700/80">
                                      {
                                        item.preorderNote
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="flex w-full flex-col gap-2 lg:w-52">
                          {order.jntTrackingNumber && (
                            <a
                              href={
                                order.jntTrackingUrl ||
                                "https://www.jtexpress.ph/track-and-trace"
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-4 text-[9px] font-black uppercase tracking-[0.15em] text-white transition hover:bg-[#222]"
                            >
                              <FiTruck />
                              Track Parcel
                              <FiExternalLink />
                            </a>
                          )}

                          {isDelivered &&
                            !order.deliveryProofImage && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDeliveryProofModal(
                                    order
                                  )
                                }
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black bg-white px-4 text-[9px] font-black uppercase tracking-[0.15em] text-black transition hover:bg-black hover:text-white"
                              >
                                <FiUpload />
                                Confirm Delivery
                              </button>
                            )}

                          {isDelivered &&
                            order.deliveryProofImage && (
                              <>
                                <a
                                  href={
                                    order.deliveryProofImage
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700 transition hover:border-emerald-400"
                                >
                                  <FiCheckCircle />
                                  Delivery Confirmed
                                </a>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openReviewModal(
                                      item,
                                      order
                                    )
                                  }
                                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-[9px] font-black uppercase tracking-[0.15em] text-black transition hover:border-black"
                                >
                                  <FiStar />
                                  Rate Product
                                </button>
                              </>
                            )}
                        </div>
                      </div>

                      {/* INFO GRID */}
                      <div className="mt-7 grid grid-cols-2 gap-3 border-t border-black/10 pt-6 md:grid-cols-3 lg:grid-cols-6">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Delivery
                          </p>

                          <p className="mt-2 text-[11px] font-bold leading-4 text-gray-700">
                            {isPreorder
                              ? formatDateLong(
                                  shipDate
                                )
                              : formatEstimateFromOrder(
                                  order
                                )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Payment
                          </p>

                          <p className="mt-2 text-[11px] font-black uppercase text-gray-700">
                            {paymentMethod}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Payment Status
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${getPaymentStatusStyles(
                              order
                            )}`}
                          >
                            {paymentLabel}
                          </span>
                        </div>

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Courier
                          </p>

                          <p className="mt-2 text-[11px] font-bold uppercase text-gray-700">
                            {order.courier ||
                              "J&T Express"}
                          </p>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Tracking
                          </p>

                          <p className="mt-2 break-all text-[11px] font-bold uppercase text-gray-700">
                            {order.jntTrackingNumber ||
                              "Not Available"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Quantity
                          </p>

                          <p className="mt-2 text-[11px] font-black text-gray-700">
                            {item.quantity || 1} Item
                            {Number(
                              item.quantity || 1
                            ) > 1
                              ? "s"
                              : ""}
                          </p>
                        </div>
                      </div>

                      {/* PAYMENT NOTICE */}
                      {(paymentState ===
                        "verifying" ||
                        isPendingPayment ||
                        isPaymentFailed) && (
                        <div
                          className={`mt-6 rounded-2xl border p-4 ${
                            isPaymentFailed
                              ? "border-red-200 bg-red-50"
                              : "border-amber-200 bg-amber-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`rounded-lg p-2 ${
                                isPaymentFailed
                                  ? "bg-red-100 text-red-600"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              <FiCreditCard />
                            </div>

                            <div>
                              <p
                                className={`text-[9px] font-black uppercase tracking-[0.16em] ${
                                  isPaymentFailed
                                    ? "text-red-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {isPaymentFailed
                                  ? "Payment Issue"
                                  : "Payment Update"}
                              </p>

                              <p
                                className={`mt-1 text-[11px] font-medium leading-5 ${
                                  isPaymentFailed
                                    ? "text-red-700/80"
                                    : "text-amber-700/80"
                                }`}
                              >
                                {isPaymentFailed
                                  ? "Your online payment was not confirmed. Please contact support or try again."
                                  : paymentState ===
                                    "verifying"
                                  ? "Your payment proof is under verification. We will update your order once confirmed."
                                  : "Waiting for payment confirmation before order processing starts."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PROGRESS */}
                      <div className="mt-7 border-t border-black/10 pt-7">
                        {showProgress ? (
                          <div className="relative">
                            <div className="hidden md:grid md:grid-cols-5">
                              {ORDER_STEPS.map(
                                (
                                  step,
                                  stepIndex
                                ) => {
                                  const isDone =
                                    stepIndex <=
                                    currentStep;

                                  const isCurrent =
                                    stepIndex ===
                                    currentStep;

                                  return (
                                    <div
                                      key={step}
                                      className="relative flex flex-col items-center text-center"
                                    >
                                      {stepIndex <
                                        ORDER_STEPS.length -
                                          1 && (
                                        <div
                                          className={`absolute left-1/2 top-4 h-[2px] w-full ${
                                            stepIndex <
                                            currentStep
                                              ? "bg-black"
                                              : "bg-black/10"
                                          }`}
                                        />
                                      )}

                                      <div
                                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[9px] font-black ${
                                          isDone
                                            ? "border-black bg-black text-white"
                                            : "border-black/10 bg-white text-gray-400"
                                        } ${
                                          isCurrent
                                            ? "ring-4 ring-black/5"
                                            : ""
                                        }`}
                                      >
                                        {isDone ? (
                                          <FiCheckCircle className="text-sm" />
                                        ) : (
                                          stepIndex +
                                          1
                                        )}
                                      </div>

                                      <p
                                        className={`mt-3 text-[8px] font-black uppercase tracking-[0.12em] ${
                                          isCurrent
                                            ? "text-black"
                                            : isDone
                                            ? "text-gray-700"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {step}
                                      </p>

                                      <p className="mt-1 text-[8px] font-medium text-gray-400">
                                        {isDone
                                          ? "Completed"
                                          : "Waiting"}
                                      </p>
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            {/* MOBILE */}
                            <div className="space-y-3 md:hidden">
                              {ORDER_STEPS.map(
                                (
                                  step,
                                  stepIndex
                                ) => {
                                  const isDone =
                                    stepIndex <=
                                    currentStep;

                                  const isCurrent =
                                    stepIndex ===
                                    currentStep;

                                  return (
                                    <div
                                      key={step}
                                      className="flex items-center gap-3"
                                    >
                                      <div
                                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-[9px] font-black ${
                                          isDone
                                            ? "border-black bg-black text-white"
                                            : "border-black/10 bg-white text-gray-400"
                                        }`}
                                      >
                                        {isDone ? (
                                          <FiCheckCircle />
                                        ) : (
                                          stepIndex +
                                          1
                                        )}
                                      </div>

                                      <div className="flex-1">
                                        <p
                                          className={`text-[9px] font-black uppercase tracking-[0.12em] ${
                                            isCurrent
                                              ? "text-black"
                                              : isDone
                                              ? "text-gray-700"
                                              : "text-gray-400"
                                          }`}
                                        >
                                          {step}
                                        </p>

                                        <p className="mt-0.5 text-[8px] text-gray-400">
                                          {isDone
                                            ? "Completed"
                                            : "Waiting"}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-black/10 bg-gray-50 p-5 text-center">
                            <FiCreditCard className="mx-auto text-xl text-gray-400" />

                            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
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
                  </article>
                );
              }
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.max(prev - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-black transition hover:border-black disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300"
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>

                <div className="flex h-11 items-center rounded-xl border border-black/10 bg-white px-5">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-600">
                    Page {currentPage} of{" "}
                    {totalPages}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        totalPages
                      )
                    )
                  }
                  disabled={
                    currentPage === totalPages
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-black transition hover:border-black disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300"
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DELIVERY PROOF MODAL */}
      {deliveryProofModalOpen &&
        selectedDeliveryOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-2xl">
              <div className="flex items-center justify-between bg-[#0A0D17] px-5 py-5 text-white">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">
                    Confirm Delivery
                  </p>

                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/50">
                    Order #
                    {String(
                      selectedDeliveryOrder._id ||
                        ""
                    )
                      .slice(-8)
                      .toUpperCase()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDeliveryProofModal
                  }
                  disabled={
                    submittingDeliveryProof
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white disabled:opacity-40"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-5 bg-[#FAFAF8] p-5">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">
                    Delivery Confirmation
                  </p>

                  <p className="mt-2 text-[11px] font-medium leading-5 text-amber-700/80">
                    Upload a photo showing that the
                    parcel was successfully received.
                  </p>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.16em] text-[#0A0D17]">
                    Delivery Proof
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleDeliveryProofChange
                    }
                    className="mt-2 block w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-[11px] font-semibold text-[#0A0D17] file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-[9px] file:font-black file:uppercase file:text-white"
                  />
                </div>

                {deliveryProofPreview && (
                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-2">
                    <img
                      src={
                        deliveryProofPreview
                      }
                      alt="Delivery proof preview"
                      className="max-h-[220px] w-full rounded-xl object-contain"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.16em] text-[#0A0D17]">
                    Note{" "}
                    <span className="font-medium text-gray-400">
                      Optional
                    </span>
                  </label>

                  <textarea
                    value={
                      deliveryProofNote
                    }
                    onChange={(e) =>
                      setDeliveryProofNote(
                        e.target.value
                      )
                    }
                    placeholder="Example: Received by customer"
                    className="mt-2 min-h-[90px] w-full resize-none rounded-xl border border-black/10 bg-white p-3 text-xs font-medium outline-none transition focus:border-black"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={
                      closeDeliveryProofModal
                    }
                    disabled={
                      submittingDeliveryProof
                    }
                    className="h-11 flex-1 rounded-xl border border-black/10 bg-white text-[9px] font-black uppercase tracking-[0.16em] text-black transition hover:border-black disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={markAsReceived}
                    disabled={
                      submittingDeliveryProof
                    }
                    className="h-11 flex-1 rounded-xl bg-black text-[9px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#222] disabled:opacity-50"
                  >
                    {submittingDeliveryProof
                      ? "Submitting..."
                      : "Confirm Delivery"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* REVIEW MODAL */}
      {reviewModalOpen &&
        selectedReviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-5 sm:px-6">
                <div>
                  <p className="text-lg font-black uppercase tracking-tight text-[#0A0D17]">
                    Rate Product
                  </p>

                  <p className="mt-1 max-w-[280px] truncate text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                    {selectedReviewItem.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={submittingReview}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-gray-400 transition hover:bg-black hover:text-white disabled:opacity-40"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <div className="flex gap-4 rounded-2xl border border-black/10 bg-gray-50 p-4">
                  <img
                    src={getOrderImageUrl(
                      selectedReviewItem.image
                    )}
                    alt={
                      selectedReviewItem.name
                    }
                    className="h-24 w-20 rounded-xl object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror =
                        null;

                      e.currentTarget.src =
                        assets.fallback_image;
                    }}
                  />

                  <div>
                    <p className="text-sm font-black uppercase text-[#0A0D17]">
                      {
                        selectedReviewItem.name
                      }
                    </p>

                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                      Size{" "}
                      {selectedReviewItem.size ||
                        "—"}
                    </p>

                    <p className="mt-1 text-[10px] font-medium text-gray-400">
                      Share your experience
                      with this product.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#0A0D17]">
                    Your Rating
                  </p>

                  <StarPicker
                    value={reviewRating}
                    onChange={
                      setReviewRating
                    }
                  />
                </div>

                <div>
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#0A0D17]">
                    Your Review
                  </p>

                  <textarea
                    value={reviewComment}
                    onChange={(e) =>
                      setReviewComment(
                        e.target.value
                      )
                    }
                    placeholder="Tell us what you think about this product..."
                    className="min-h-[140px] w-full resize-none rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm font-medium outline-none transition focus:border-black focus:bg-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    disabled={submittingReview}
                    className="h-11 flex-1 rounded-xl border border-black/10 bg-white text-[9px] font-black uppercase tracking-[0.16em] text-black transition hover:border-black disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="h-11 flex-1 rounded-xl bg-black text-[9px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#222] disabled:opacity-50"
                  >
                    {submittingReview
                      ? "Submitting..."
                      : "Submit Review"}
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