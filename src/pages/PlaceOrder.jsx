import React, { useContext, useState, useEffect, useMemo } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import ShippingAddressFields from "../components/ShippingAddressFields";

import gcashLogo from "../assets/gcash_logo.png";
import mayaLogo from "../assets/maya_logo.png";
import gotymeLogo from "../assets/gotyme_logo.png";
import codIcon from "../assets/cod_logo.png";

const emptyAddress = {
  firstName: "",
  lastName: "",
  email: "",
  houseUnit: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  region: "",
  zipcode: "",
  country: "Philippines",
  phone: "",
  latitude: "",
  longitude: "",
  psgcRegionCode: "",
  psgcProvinceCode: "",
  psgcMunicipalityCode: "",
  psgcBarangayCode: "",
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDeliveryRange = (minDays, maxDays) => {
  const today = new Date();

  const start = addDays(today, minDays).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

  const end = addDays(today, maxDays).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return `${start} - ${end}`;
};

const formatShipDate = (dateValue) => {
  if (!dateValue) return "After restock confirmation";

  const date = addDays(new Date(dateValue), 2);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
};

const getEstimatedDelivery = (address) => {
  const region = String(address?.region || "").toLowerCase();
  const province = String(address?.province || "").toLowerCase();

  if (region.includes("national capital") || region.includes("ncr")) {
    return {
      minDays: 2,
      maxDays: 4,
      label: "2-4 business days",
      range: formatDeliveryRange(2, 4),
    };
  }

  if (
    province.includes("cavite") ||
    province.includes("laguna") ||
    province.includes("bulacan") ||
    province.includes("rizal")
  ) {
    return {
      minDays: 3,
      maxDays: 5,
      label: "3-5 business days",
      range: formatDeliveryRange(3, 5),
    };
  }

  return {
    minDays: 5,
    maxDays: 7,
    label: "5-7 business days",
    range: formatDeliveryRange(5, 7),
  };
};

const getFirstName = (user) => {
  if (user?.firstName?.trim()) return user.firstName;
  if (user?.name?.trim()) return user.name.trim().split(" ")[0] || "";
  return "";
};

const getLastName = (user) => {
  if (user?.lastName?.trim()) return user.lastName;
  if (user?.name?.trim()) return user.name.trim().split(" ").slice(1).join(" ");
  return "";
};

const normalizePaymentMethod = (value = "") => {
  const method = String(value).trim().toLowerCase();

  if (method === "cod" || method === "cash on delivery") return "COD";
  if (method === "gcash") return "GCash";
  if (method === "maya" || method === "paymaya") return "Maya";
  if (method === "gotyme" || method === "go tyme") return "GoTyme";

  return "COD";
};

const PAYMENT_OPTIONS = [
  {
    key: "COD",
    title: "Cash on Delivery",
    subtitle: "Pay when your order arrives",
    preorderSubtitle: "Not available for pre-order items",
    badge: "Pay on Arrival",
    logo: codIcon,
    cardClass:
      "border-stone-300 bg-gradient-to-br from-stone-50 via-white to-stone-100 hover:border-stone-500",
    activeClass:
      "border-stone-900 ring-2 ring-stone-200 shadow-[0_10px_30px_rgba(28,25,23,0.15)]",
    titleClass: "text-stone-900",
    subtitleClass: "text-stone-600",
    badgeClass: "bg-stone-900 text-white",
  },
  {
    key: "GCash",
    title: "GCash",
    subtitle: "Scan QR and upload proof of payment",
    badge: "Instant QR",
    logo: gcashLogo,
    cardClass:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 hover:border-blue-500",
    activeClass:
      "border-blue-600 ring-2 ring-blue-200 shadow-[0_10px_30px_rgba(37,99,235,0.18)]",
    titleClass: "text-blue-700",
    subtitleClass: "text-blue-600/80",
    badgeClass: "bg-blue-600 text-white",
  },
  {
    key: "Maya",
    title: "Maya",
    subtitle: "Scan QR and upload proof of payment",
    badge: "Digital Wallet",
    logo: mayaLogo,
    cardClass:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50 hover:border-emerald-500",
    activeClass:
      "border-emerald-600 ring-2 ring-emerald-200 shadow-[0_10px_30px_rgba(5,150,105,0.18)]",
    titleClass: "text-emerald-700",
    subtitleClass: "text-emerald-700/75",
    badgeClass: "bg-emerald-600 text-white",
  },
  {
    key: "GoTyme",
    title: "GoTyme",
    subtitle: "Scan QR and upload proof of payment",
    badge: "Manual Proof",
    logo: gotymeLogo,
    cardClass:
      "border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-amber-50 hover:border-yellow-500",
    activeClass:
      "border-yellow-500 ring-2 ring-yellow-200 shadow-[0_10px_30px_rgba(234,179,8,0.18)]",
    titleClass: "text-yellow-700",
    subtitleClass: "text-yellow-700/80",
    badgeClass: "bg-yellow-500 text-black",
  },
];

const PlaceOrder = () => {
  const {
    navigate,
    backendUrl,
    token,
    setCartItems,
    delivery_fee,
    user,
    fetchProducts,
    currency,
  } = useContext(ShopContext);

  const userId = user?._id;
  const [method, setMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [addressMode, setAddressMode] = useState("saved");

  const [formData, setFormData] = useState(emptyAddress);
  const [savedAddress, setSavedAddress] = useState(emptyAddress);
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("checkout_cart") || "[]");

    if (!savedCart.length) {
      toast.error("No items to checkout!");
      navigate("/cart");
      return;
    }

    setCartData(savedCart);

    const containsPreorder = savedCart.some((item) => item.isPreorder);
    if (containsPreorder) setMethod("GCash");

    if (user) {
      const mainAddress = {
        firstName: getFirstName(user),
        lastName: getLastName(user),
        email: user.email || "",
        phone: String(user.phone || "").replace(/\D/g, ""),
        houseUnit: user.address?.houseUnit || "",
        street: user.address?.street || "",
        barangay: user.address?.barangay || "",
        city: user.address?.city || "",
        province: user.address?.province || "",
        region: user.address?.region || "",
        zipcode: user.address?.zipcode || "",
        country: user.address?.country || "Philippines",
        latitude: user.address?.latitude || "",
        longitude: user.address?.longitude || "",
        psgcRegionCode: user.address?.psgcRegionCode || "",
        psgcProvinceCode: user.address?.psgcProvinceCode || "",
        psgcMunicipalityCode: user.address?.psgcMunicipalityCode || "",
        psgcBarangayCode: user.address?.psgcBarangayCode || "",
      };

      setSavedAddress(mainAddress);

      setFormData((prev) => {
        const alreadyEditing =
          prev.firstName ||
          prev.lastName ||
          prev.email ||
          prev.phone ||
          prev.houseUnit ||
          prev.street ||
          prev.barangay ||
          prev.city ||
          prev.province ||
          prev.region ||
          prev.zipcode ||
          prev.psgcRegionCode ||
          prev.psgcProvinceCode ||
          prev.psgcMunicipalityCode ||
          prev.psgcBarangayCode;

        return alreadyEditing ? prev : mainAddress;
      });

      const hasAddress =
        mainAddress.street ||
        mainAddress.barangay ||
        mainAddress.city ||
        mainAddress.province ||
        mainAddress.region;

      setAddressMode((prev) => {
        if (prev === "other") return "other";
        return hasAddress ? "saved" : "other";
      });
    }
  }, [navigate, user?._id]);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const hasPreorderItems = useMemo(() => {
    return cartData.some((item) => item.isPreorder);
  }, [cartData]);

  const latestPreorderRestockDate = useMemo(() => {
    const dates = cartData
      .filter((item) => item.isPreorder)
      .map((item) => item.expectedRestockDate || item.preorderRestockDate)
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b - a);

    return dates[0] || null;
  }, [cartData]);

  const preorderShipsOn = useMemo(() => {
    return latestPreorderRestockDate
      ? formatShipDate(latestPreorderRestockDate)
      : "After restock confirmation";
  }, [latestPreorderRestockDate]);

  const hasSavedMainAddress = Boolean(
    savedAddress.street ||
      savedAddress.barangay ||
      savedAddress.city ||
      savedAddress.province ||
      savedAddress.region
  );

  const displayedAddress = addressMode === "saved" ? savedAddress : formData;

  const deliveryEstimate = useMemo(() => {
    return getEstimatedDelivery(displayedAddress);
  }, [
    displayedAddress.region,
    displayedAddress.province,
    displayedAddress.city,
    displayedAddress.barangay,
  ]);

  const formatSavedAddress = () => {
    const parts = [
      savedAddress.houseUnit,
      savedAddress.street,
      savedAddress.barangay,
      savedAddress.city,
      savedAddress.province,
      savedAddress.region,
      savedAddress.zipcode,
      savedAddress.country,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "No main address saved in profile";
  };

  const subtotal = cartData.reduce((acc, item) => {
    const basePrice = Number(item.price || 0);
    const salePercent = Number(item.salePercent || 0);
    const finalPrice =
      item.onSale && salePercent > 0
        ? Math.max(basePrice - (basePrice * salePercent) / 100, 0)
        : basePrice;

    return acc + finalPrice * Number(item.quantity || 0);
  }, 0);

  const totalQuantity = cartData.reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0
  );

  const validateAddress = (address) => {
    if (!address.firstName?.trim()) return "First name is required";
    if (!address.lastName?.trim()) return "Last name is required";
    if (!address.email?.trim()) return "Email is required";
    if (!address.phone?.trim()) return "Phone is required";
    if (!/^\d+$/.test(address.phone)) return "Phone must contain numbers only";
    if (!address.street?.trim()) return "Street is required";
    if (!address.barangay?.trim()) return "Barangay is required";
    if (!address.city?.trim()) return "City is required";
    if (
      !address.province?.trim() &&
      address.region !== "National Capital Region (NCR)"
    ) {
      return "Province is required";
    }
    if (!address.region?.trim()) return "Region is required";
    if (!address.zipcode?.trim()) return "ZIP code is required";
    return "";
  };

  const buildOrderPayload = (finalAddress, selectedMethod) => ({
    userId,
    address: {
      firstName: finalAddress.firstName,
      lastName: finalAddress.lastName,
      email: finalAddress.email,
      phone: finalAddress.phone,
      houseUnit: finalAddress.houseUnit,
      street: finalAddress.street,
      barangay: finalAddress.barangay,
      city: finalAddress.city,
      province: finalAddress.province,
      region: finalAddress.region,
      zipcode: finalAddress.zipcode,
      country: finalAddress.country || "Philippines",
      latitude: finalAddress.latitude ? Number(finalAddress.latitude) : null,
      longitude: finalAddress.longitude ? Number(finalAddress.longitude) : null,
      psgcRegionCode: finalAddress.psgcRegionCode || "",
      psgcProvinceCode: finalAddress.psgcProvinceCode || "",
      psgcMunicipalityCode: finalAddress.psgcMunicipalityCode || "",
      psgcBarangayCode: finalAddress.psgcBarangayCode || "",
    },
    items: cartData.map((item) => ({
      productId: item._id || item.productId,
      name: item.name,
      image: item.images?.[0] || item.image || null,
      price: Number(item.price),
      quantity: Number(item.quantity),
      size: (item.size || "S").toUpperCase(),
      onSale: item.onSale || false,
      salePercent: Number(item.salePercent || 0),
      category: item.category || "",
      sku: item.sku || "",
      groupCode: item.groupCode || "",
      isPreorder: !!item.isPreorder,
      expectedRestockDate:
        item.expectedRestockDate || item.preorderRestockDate || null,
      preorderNote: item.preorderNote || "",
    })),
    amount: subtotal + delivery_fee,
    paymentMethod: normalizePaymentMethod(selectedMethod),
    deliveryEstimate: {
      minDays: deliveryEstimate.minDays,
      maxDays: deliveryEstimate.maxDays,
      label: hasPreorderItems ? "Pre-order delivery" : deliveryEstimate.label,
      range: deliveryEstimate.range,
      shipsOn: latestPreorderRestockDate
        ? addDays(latestPreorderRestockDate, 2)
        : null,
    },
  });

  const clearCartEverywhere = async () => {
    setCartItems({});
    localStorage.removeItem(`cart_${userId}`);
    localStorage.removeItem("checkout_cart");

    await axios.post(
      `${backendUrl}/api/cart/clear`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (fetchProducts) fetchProducts();
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!cartData.length) return toast.error("Cart is empty");

    const selectedMethod = normalizePaymentMethod(method);

    if (hasPreorderItems && selectedMethod === "COD") {
      toast.error(
        "Cash on Delivery is not available for pre-order items. Please choose GCash, Maya, or GoTyme."
      );
      return;
    }

    const activeAddress = addressMode === "saved" ? savedAddress : formData;

    const finalAddress = {
      ...activeAddress,
      firstName: activeAddress.firstName?.trim() || getFirstName(user),
      lastName: activeAddress.lastName?.trim() || getLastName(user),
      email: activeAddress.email?.trim() || user?.email || "",
      phone: String(activeAddress.phone?.trim() || user?.phone || "").replace(
        /\D/g,
        ""
      ),
    };

    const validationError = validateAddress(finalAddress);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);

      const orderData = buildOrderPayload(finalAddress, selectedMethod);

      const response = await axios.post(
        `${backendUrl}/api/order/place`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to place order");
      }

      if (selectedMethod === "COD") {
        toast.success("Order placed successfully!");
        await clearCartEverywhere();
        navigate("/payment-submitted");
        return;
      }

      if (["GCash", "Maya", "GoTyme"].includes(selectedMethod)) {
        navigate(
          `/manual-payment/${response.data.orderId}?method=${encodeURIComponent(
            selectedMethod
          )}`
        );
        return;
      }
    } catch (error) {
      console.log("PLACE ORDER ERROR:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#0A0D17] outline-none transition placeholder:text-gray-300 focus:border-black";

  if (!cartData.length) return null;

  return (
    <div className="min-h-screen bg-transparent font-['Outfit'] pt-8 pb-20 px-4 md:px-6 lg:px-8">
      <form
        onSubmit={onSubmitHandler}
        className="max-w-7xl mx-auto grid xl:grid-cols-[1.1fr_0.72fr] gap-6 items-start"
      >
        <div className="space-y-6">
          <div className="rounded-[24px] border border-black/10 bg-white/45 backdrop-blur-md p-6 md:p-7">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <Title text1={"PLACE"} text2={"ORDER"} />
                <p className="mt-3 text-[11px] font-semibold text-gray-500 uppercase tracking-[0.24em]">
                  Shipping and delivery details
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                    Items
                  </p>
                  <p className="mt-1 text-sm font-black text-[#0A0D17]">
                    {cartData.length}
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                    Quantity
                  </p>
                  <p className="mt-1 text-sm font-black text-[#0A0D17]">
                    {totalQuantity}
                  </p>
                </div>

                {hasPreorderItems && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
                      Type
                    </p>
                    <p className="mt-1 text-sm font-black text-amber-700">
                      Pre-order
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/10 bg-white/45 backdrop-blur-md p-6 md:p-7">
            <div className="mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#0A0D17]">
                Delivery Address
              </h3>
              <p className="mt-2 text-[11px] font-semibold text-gray-500">
                Choose your saved location or enter another address for this order
              </p>
            </div>

            <div className="grid gap-3">
              <label
                className={`rounded-2xl border p-4 cursor-pointer transition ${
                  addressMode === "saved"
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white hover:border-black"
                } ${!hasSavedMainAddress ? "opacity-60" : ""}`}
              >
                <div className="flex gap-3 items-start">
                  <input
                    type="radio"
                    name="addressMode"
                    checked={addressMode === "saved"}
                    onChange={() => setAddressMode("saved")}
                    disabled={!hasSavedMainAddress}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-black uppercase tracking-[0.12em] ${
                        addressMode === "saved"
                          ? "text-white"
                          : "text-[#0A0D17]"
                      }`}
                    >
                      Use Main Address
                    </p>
                    <p
                      className={`mt-2 text-xs leading-5 ${
                        addressMode === "saved" ? "text-white/75" : "text-gray-500"
                      }`}
                    >
                      {formatSavedAddress()}
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`rounded-2xl border p-4 cursor-pointer transition ${
                  addressMode === "other"
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white hover:border-black"
                }`}
              >
                <div className="flex gap-3 items-start">
                  <input
                    type="radio"
                    name="addressMode"
                    checked={addressMode === "other"}
                    onChange={() => setAddressMode("other")}
                    className="mt-1"
                  />
                  <div>
                    <p
                      className={`text-sm font-black uppercase tracking-[0.12em] ${
                        addressMode === "other"
                          ? "text-white"
                          : "text-[#0A0D17]"
                      }`}
                    >
                      Use Another Address
                    </p>
                    <p
                      className={`mt-2 text-xs leading-5 ${
                        addressMode === "other" ? "text-white/75" : "text-gray-500"
                      }`}
                    >
                      Enter another delivery address just for this purchase
                    </p>
                  </div>
                </div>
              </label>

              {!hasSavedMainAddress && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                  No main address found in your profile. Please use another
                  address or save one in My Account.
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                required
                name="firstName"
                value={displayedAddress.firstName}
                onChange={addressMode === "other" ? onChangeHandler : undefined}
                readOnly={addressMode === "saved"}
                className={`${inputStyle} ${
                  addressMode === "saved" ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
                placeholder="First name"
              />

              <input
                required
                name="lastName"
                value={displayedAddress.lastName}
                onChange={addressMode === "other" ? onChangeHandler : undefined}
                readOnly={addressMode === "saved"}
                className={`${inputStyle} ${
                  addressMode === "saved" ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
                placeholder="Last name"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                required
                name="email"
                value={displayedAddress.email}
                onChange={addressMode === "other" ? onChangeHandler : undefined}
                readOnly={addressMode === "saved"}
                className={`${inputStyle} ${
                  addressMode === "saved" ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
                placeholder="Email"
              />

              <input
                required
                name="phone"
                value={displayedAddress.phone}
                onChange={addressMode === "other" ? onChangeHandler : undefined}
                readOnly={addressMode === "saved"}
                inputMode="numeric"
                maxLength={11}
                className={`${inputStyle} ${
                  addressMode === "saved" ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
                placeholder="Phone"
              />
            </div>

            <div className="mt-4">
              <ShippingAddressFields
                formData={addressMode === "saved" ? savedAddress : formData}
                setFormData={
                  addressMode === "saved" ? setSavedAddress : setFormData
                }
                backendUrl={backendUrl}
                readOnly={addressMode === "saved"}
              />
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-24 space-y-6">
          <div className="rounded-[24px] border border-black/10 bg-white/45 backdrop-blur-md p-6 md:p-7">
            <div className="mb-5">
              <h3 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#0A0D17]">
                Order Summary
              </h3>
              <p className="mt-2 text-[11px] font-semibold text-gray-500">
                Review your checkout before confirming
              </p>
            </div>

            <div
              className={`mb-4 rounded-2xl border px-4 py-4 ${
                hasPreorderItems
                  ? "border-amber-200 bg-amber-50"
                  : "border-black/10 bg-white"
              }`}
            >
              <p
                className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                  hasPreorderItems ? "text-amber-600" : "text-gray-500"
                }`}
              >
                {hasPreorderItems ? "Pre-order Shipping" : "Estimated Delivery"}
              </p>

              <p
                className={`mt-2 text-lg font-black ${
                  hasPreorderItems ? "text-amber-700" : "text-[#0A0D17]"
                }`}
              >
                {hasPreorderItems ? `Ships on ${preorderShipsOn}` : deliveryEstimate.label}
              </p>

              <p
                className={`mt-1 text-xs font-semibold ${
                  hasPreorderItems ? "text-amber-700/80" : "text-gray-500"
                }`}
              >
                {hasPreorderItems
                  ? "COD is disabled for pre-order items. Please pay using GCash, Maya, or GoTyme."
                  : `Expected arrival: ${deliveryEstimate.range}`}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {cartData.map((item, index) => {
                const basePrice = Number(item.price || 0);
                const salePercent = Number(item.salePercent || 0);
                const finalPrice =
                  item.onSale && salePercent > 0
                    ? Math.max(basePrice - (basePrice * salePercent) / 100, 0)
                    : basePrice;

                return (
                  <div
                    key={`${item._id}_${item.size}_${index}`}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black uppercase text-[#0A0D17] truncate">
                          {item.name}
                        </p>

                        {item.isPreorder && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-700">
                            Pre-order
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[11px] font-semibold text-gray-500 uppercase tracking-[0.08em]">
                        Size {item.size} · Qty {item.quantity}
                      </p>

                      {item.isPreorder && (
                        <p className="mt-1 text-[10px] font-bold text-amber-700">
                          Ships on{" "}
                          {formatShipDate(
                            item.expectedRestockDate || item.preorderRestockDate
                          )}
                        </p>
                      )}
                    </div>

                    <p className="text-sm font-black text-[#0A0D17] whitespace-nowrap">
                      {currency}
                      {(finalPrice * Number(item.quantity || 0)).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <CartTotal items={cartData} />
            </div>
          </div>

          <div className="rounded-[24px] border border-black/10 bg-white/45 backdrop-blur-md p-6 md:p-7">
            <div className="mb-5">
              <h3 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#0A0D17]">
                Payment Method
              </h3>
              <p className="mt-2 text-[11px] font-semibold text-gray-500">
                Choose how you want to pay
              </p>
            </div>

            <div className="grid gap-4">
              {PAYMENT_OPTIONS.map((option) => {
                const isActive = method === option.key;
                const isDisabled = hasPreorderItems && option.key === "COD";

                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) {
                        toast.error("COD is not available for pre-order items.");
                        return;
                      }

                      setMethod(option.key);
                    }}
                    className={`group relative overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-300 ${
                      option.cardClass
                    } ${isActive ? option.activeClass : "shadow-sm"} ${
                      isDisabled ? "opacity-45 cursor-not-allowed grayscale" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-black/5">
                        <img
                          src={option.logo}
                          alt={option.title}
                          className="h-9 w-9 object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-base font-black ${option.titleClass}`}>
                            {option.title}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${option.badgeClass}`}
                          >
                            {isDisabled ? "Disabled" : option.badge}
                          </span>
                        </div>

                        <p
                          className={`mt-2 text-xs font-semibold ${
                            isDisabled ? "text-red-500" : option.subtitleClass
                          }`}
                        >
                          {isDisabled
                            ? option.preorderSubtitle
                            : option.subtitle}
                        </p>
                      </div>

                      <div className="pt-1">
                        <div
                          className={`h-5 w-5 rounded-full border-2 transition ${
                            isActive
                              ? "border-black bg-black"
                              : "border-black/20 bg-white"
                          }`}
                        >
                          <div
                            className={`m-auto mt-[3px] h-2 w-2 rounded-full bg-white transition ${
                              isActive ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/80" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                Selected Method
              </p>
              <p className="mt-1 text-sm font-black text-[#0A0D17]">{method}</p>
            </div>

            <button
              type="submit"
              disabled={loading || (hasPreorderItems && method === "COD")}
              className="mt-6 h-12 w-full rounded-2xl bg-black text-white text-[11px] font-black uppercase tracking-[0.22em] transition hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : method === "COD"
                ? "Confirm Order"
                : "Proceed to QR Payment"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="mt-3 h-11 w-full rounded-2xl border border-black/10 bg-white text-[11px] font-black uppercase tracking-[0.18em] text-[#0A0D17] transition hover:border-black"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlaceOrder;