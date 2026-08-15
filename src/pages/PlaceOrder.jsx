import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import ShippingAddressFields from "../components/ShippingAddressFields";

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

  const start = addDays(today, minDays).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
    }
  );

  const end = addDays(today, maxDays).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }
  );

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
  const region = String(
    address?.region || ""
  ).toLowerCase();

  const province = String(
    address?.province || ""
  ).toLowerCase();

  if (
    region.includes("national capital") ||
    region.includes("ncr")
  ) {
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

  if (user?.name?.trim()) {
    return user.name.trim().split(" ")[0] || "";
  }

  return "";
};

const getLastName = (user) => {
  if (user?.lastName?.trim()) return user.lastName;

  if (user?.name?.trim()) {
    return user.name
      .trim()
      .split(" ")
      .slice(1)
      .join(" ");
  }

  return "";
};

/*
 * IMPORTANT:
 * Internally, "PayMongo" is still used as the payment method
 * value so your existing backend/payment integration continues
 * to work.
 *
 * The customer-facing text is now "Online Payment".
 */
const normalizePaymentMethod = (value = "") => {
  const method = String(value)
    .trim()
    .toLowerCase();

  if (
    method === "cod" ||
    method === "cash on delivery"
  ) {
    return "COD";
  }

  if (
    method === "paymongo" ||
    method === "online payment"
  ) {
    return "PayMongo";
  }

  return "COD";
};

const PAYMENT_OPTIONS = [
  {
    key: "COD",
    title: "Cash on Delivery",
    subtitle: "Pay when your order arrives",
    preorderSubtitle:
      "Not available for pre-order items",
    badge: "Pay on Arrival",
    logo: codIcon,
    cardClass:
      "border-black/10 bg-white hover:border-black",
    activeClass:
      "border-black bg-[#F6F6F3]",
    titleClass: "text-black",
    subtitleClass: "text-gray-500",
    badgeClass:
      "bg-black text-white",
  },

  {
    /*
     * Keep the internal key as PayMongo.
     * Only the displayed text has been changed.
     */
    key: "PayMongo",
    title: "Online Payment",
    subtitle:
      "Pay securely with GCash, Maya, or card",
    preorderSubtitle:
      "Required for pre-order items",
    badge: "Online Payment",
    logo: null,
    cardClass:
      "border-black/10 bg-[#0A0D17] hover:border-black",
    activeClass:
      "border-black ring-2 ring-black/10",
    titleClass: "text-white",
    subtitleClass: "text-white/65",
    badgeClass:
      "bg-white text-black",
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
  const [addressMode, setAddressMode] =
    useState("saved");

  const [formData, setFormData] =
    useState(emptyAddress);

  const [savedAddress, setSavedAddress] =
    useState(emptyAddress);

  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(
      localStorage.getItem("checkout_cart") || "[]"
    );

    if (!savedCart.length) {
      toast.error("No items to checkout!");
      navigate("/cart");
      return;
    }

    setCartData(savedCart);

    const containsPreorder = savedCart.some(
      (item) => item.isPreorder
    );

    if (containsPreorder) {
      setMethod("PayMongo");
    }

    if (user) {
      const mainAddress = {
        firstName: getFirstName(user),
        lastName: getLastName(user),
        email: user.email || "",
        phone: String(user.phone || "").replace(
          /\D/g,
          ""
        ),
        houseUnit:
          user.address?.houseUnit || "",
        street:
          user.address?.street || "",
        barangay:
          user.address?.barangay || "",
        city:
          user.address?.city || "",
        province:
          user.address?.province || "",
        region:
          user.address?.region || "",
        zipcode:
          user.address?.zipcode || "",
        country:
          user.address?.country ||
          "Philippines",
        latitude:
          user.address?.latitude || "",
        longitude:
          user.address?.longitude || "",
        psgcRegionCode:
          user.address?.psgcRegionCode || "",
        psgcProvinceCode:
          user.address?.psgcProvinceCode || "",
        psgcMunicipalityCode:
          user.address?.psgcMunicipalityCode || "",
        psgcBarangayCode:
          user.address?.psgcBarangayCode || "",
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

        return alreadyEditing
          ? prev
          : mainAddress;
      });

      const hasAddress =
        mainAddress.street ||
        mainAddress.barangay ||
        mainAddress.city ||
        mainAddress.province ||
        mainAddress.region;

      setAddressMode((prev) => {
        if (prev === "other") return "other";

        return hasAddress
          ? "saved"
          : "other";
      });
    }
  }, [navigate, user?._id]);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numbersOnly = value.replace(
        /\D/g,
        ""
      );

      setFormData((prev) => ({
        ...prev,
        [name]: numbersOnly,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const hasPreorderItems = useMemo(() => {
    return cartData.some(
      (item) => item.isPreorder
    );
  }, [cartData]);

  const latestPreorderRestockDate = useMemo(() => {
    const dates = cartData
      .filter((item) => item.isPreorder)
      .map(
        (item) =>
          item.expectedRestockDate ||
          item.preorderRestockDate
      )
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter(
        (date) =>
          !Number.isNaN(date.getTime())
      )
      .sort((a, b) => b - a);

    return dates[0] || null;
  }, [cartData]);

  const preorderShipsOn = useMemo(() => {
    return latestPreorderRestockDate
      ? formatShipDate(
          latestPreorderRestockDate
        )
      : "After restock confirmation";
  }, [latestPreorderRestockDate]);

  const hasSavedMainAddress = Boolean(
    savedAddress.street ||
      savedAddress.barangay ||
      savedAddress.city ||
      savedAddress.province ||
      savedAddress.region
  );

  const displayedAddress =
    addressMode === "saved"
      ? savedAddress
      : formData;

  const deliveryEstimate = useMemo(() => {
    return getEstimatedDelivery(
      displayedAddress
    );
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

    return parts.length
      ? parts.join(", ")
      : "No main address saved in profile";
  };

  const subtotal = cartData.reduce(
    (acc, item) => {
      const basePrice = Number(
        item.price || 0
      );

      const salePercent = Number(
        item.salePercent || 0
      );

      const finalPrice =
        item.onSale && salePercent > 0
          ? Math.max(
              basePrice -
                (basePrice *
                  salePercent) /
                  100,
              0
            )
          : basePrice;

      return (
        acc +
        finalPrice *
          Number(item.quantity || 0)
      );
    },
    0
  );

  const totalQuantity = cartData.reduce(
    (acc, item) =>
      acc + Number(item.quantity || 0),
    0
  );

  const validateAddress = (address) => {
    if (!address.firstName?.trim())
      return "First name is required";

    if (!address.lastName?.trim())
      return "Last name is required";

    if (!address.email?.trim())
      return "Email is required";

    if (!address.phone?.trim())
      return "Phone is required";

    if (!/^\d+$/.test(address.phone))
      return "Phone must contain numbers only";

    if (!address.street?.trim())
      return "Street is required";

    if (!address.barangay?.trim())
      return "Barangay is required";

    if (!address.city?.trim())
      return "City is required";

    if (
      !address.province?.trim() &&
      address.region !==
        "National Capital Region (NCR)"
    ) {
      return "Province is required";
    }

    if (!address.region?.trim())
      return "Region is required";

    if (!address.zipcode?.trim())
      return "ZIP code is required";

    return "";
  };

  const buildOrderPayload = (
    finalAddress,
    selectedMethod
  ) => ({
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
      country:
        finalAddress.country ||
        "Philippines",
      latitude: finalAddress.latitude
        ? Number(finalAddress.latitude)
        : null,
      longitude: finalAddress.longitude
        ? Number(finalAddress.longitude)
        : null,
      psgcRegionCode:
        finalAddress.psgcRegionCode || "",
      psgcProvinceCode:
        finalAddress.psgcProvinceCode || "",
      psgcMunicipalityCode:
        finalAddress.psgcMunicipalityCode ||
        "",
      psgcBarangayCode:
        finalAddress.psgcBarangayCode || "",
    },

    items: cartData.map((item) => ({
      productId:
        item._id || item.productId,
      name: item.name,
      image:
        item.images?.[0] ||
        item.image ||
        null,
      price: Number(item.price),
      quantity: Number(item.quantity),
      size: (
        item.size || "S"
      ).toUpperCase(),
      onSale:
        item.onSale || false,
      salePercent: Number(
        item.salePercent || 0
      ),
      category:
        item.category || "",
      sku: item.sku || "",
      groupCode:
        item.groupCode || "",
      isPreorder:
        !!item.isPreorder,
      expectedRestockDate:
        item.expectedRestockDate ||
        item.preorderRestockDate ||
        null,
      preorderNote:
        item.preorderNote || "",
    })),

    amount:
      subtotal + delivery_fee,

    paymentMethod:
      normalizePaymentMethod(
        selectedMethod
      ),

    deliveryEstimate: {
      minDays:
        deliveryEstimate.minDays,
      maxDays:
        deliveryEstimate.maxDays,
      label: hasPreorderItems
        ? "Pre-order delivery"
        : deliveryEstimate.label,
      range:
        deliveryEstimate.range,
      shipsOn:
        latestPreorderRestockDate
          ? addDays(
              latestPreorderRestockDate,
              2
            )
          : null,
    },
  });

  const clearCartEverywhere = async () => {
    setCartItems({});

    localStorage.removeItem(
      `cart_${userId}`
    );

    localStorage.removeItem(
      "checkout_cart"
    );

    await axios.post(
      `${backendUrl}/api/cart/clear`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (fetchProducts) {
      fetchProducts();
    }
  };

  /*
   * INTERNAL PAYMENT PROCESSING
   *
   * This function still uses your PayMongo
   * backend endpoint because PayMongo is the
   * actual payment processor.
   *
   * Customers never see the PayMongo name.
   */
  const createPaymongoCheckout = async (
    orderId
  ) => {
    try {
      const paymongoResponse =
        await axios.post(
          `${backendUrl}/api/order/create-paymongo-checkout`,
          { orderId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      console.log(
        "ONLINE PAYMENT RESPONSE:",
        paymongoResponse?.data
      );

      if (
        !paymongoResponse?.data
          ?.success
      ) {
        throw new Error(
          paymongoResponse?.data
            ?.message ||
            "Failed to create online payment checkout"
        );
      }

      if (
        !paymongoResponse?.data
          ?.checkoutUrl
      ) {
        throw new Error(
          "Online payment checkout URL is missing"
        );
      }

      localStorage.setItem(
        "pending_paymongo_order",
        orderId
      );

      toast.success(
        "Redirecting to online payment checkout..."
      );

      window.location.href =
        paymongoResponse.data.checkoutUrl;
    } catch (error) {
      console.log(
        "ONLINE PAYMENT FRONTEND ERROR:",
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Online payment checkout failed"
      );
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!cartData.length) {
      return toast.error(
        "Cart is empty"
      );
    }

    const selectedMethod =
      normalizePaymentMethod(method);

    if (
      hasPreorderItems &&
      selectedMethod === "COD"
    ) {
      toast.error(
        "Cash on Delivery is not available for pre-order items. Please choose Online Payment."
      );

      return;
    }

    const activeAddress =
      addressMode === "saved"
        ? savedAddress
        : formData;

    const finalAddress = {
      ...activeAddress,

      firstName:
        activeAddress.firstName?.trim() ||
        getFirstName(user),

      lastName:
        activeAddress.lastName?.trim() ||
        getLastName(user),

      email:
        activeAddress.email?.trim() ||
        user?.email ||
        "",

      phone: String(
        activeAddress.phone?.trim() ||
          user?.phone ||
          ""
      ).replace(/\D/g, ""),
    };

    const validationError =
      validateAddress(finalAddress);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);

      const orderData =
        buildOrderPayload(
          finalAddress,
          selectedMethod
        );

      const response =
        await axios.post(
          `${backendUrl}/api/order/place`,
          orderData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to place order"
        );
      }

      if (
        selectedMethod === "COD"
      ) {
        toast.success(
          "Order placed successfully!"
        );

        await clearCartEverywhere();

        navigate(
          "/payment-submitted"
        );

        return;
      }

      /*
       * Internally still PayMongo.
       * Customer-facing text says Online Payment.
       */
      if (
        selectedMethod ===
        "PayMongo"
      ) {
        toast.info(
          "Redirecting to online payment checkout..."
        );

        await createPaymongoCheckout(
          response.data.orderId
        );

        return;
      }
    } catch (error) {
      console.log(
        "PLACE ORDER ERROR:",
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.message ||
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#0A0D17] outline-none transition placeholder:text-gray-300 focus:border-black";

  if (!cartData.length) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] px-3 pb-16 pt-5 font-['Outfit'] sm:px-5 md:px-8 lg:px-10 xl:px-12">
      <form
        onSubmit={onSubmitHandler}
        className="mx-auto max-w-7xl"
      >
        {/* CHECKOUT HEADER */}
        <div className="mb-5 border-b border-black/10 bg-white px-5 py-6 sm:px-6 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.38em] text-gray-400">
                Saint Clothing
              </p>

              <Title
                text1="PLACE"
                text2="ORDER"
              />

              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Secure checkout
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="border border-black/10 bg-[#F6F6F3] px-5 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Items
                </p>

                <p className="mt-1 text-sm font-black text-black">
                  {cartData.length}
                </p>
              </div>

              <div className="border border-black/10 bg-[#F6F6F3] px-5 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Quantity
                </p>

                <p className="mt-1 text-sm font-black text-black">
                  {totalQuantity}
                </p>
              </div>

              {hasPreorderItems && (
                <div className="border border-amber-200 bg-amber-50 px-5 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-600">
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

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT SIDE */}
          <div className="space-y-5">
            {/* DELIVERY */}
            <section className="border border-black/10 bg-white">
              <div className="border-b border-black/10 px-5 py-5 sm:px-6">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                  01
                </p>

                <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-black">
                  Delivery Address
                </h2>

                <p className="mt-2 text-xs font-semibold text-gray-500">
                  Choose where you want your order
                  delivered.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                {/* ADDRESS OPTIONS */}
                <div className="grid gap-2 md:grid-cols-2">
                  <label
                    className={`cursor-pointer border p-4 transition ${
                      addressMode === "saved"
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white hover:border-black"
                    } ${
                      !hasSavedMainAddress
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="addressMode"
                        checked={
                          addressMode ===
                          "saved"
                        }
                        onChange={() =>
                          setAddressMode(
                            "saved"
                          )
                        }
                        disabled={
                          !hasSavedMainAddress
                        }
                        className="mt-1 accent-white"
                      />

                      <div className="min-w-0">
                        <p
                          className={`text-[11px] font-black uppercase tracking-[0.12em] ${
                            addressMode ===
                            "saved"
                              ? "text-white"
                              : "text-black"
                          }`}
                        >
                          Main Address
                        </p>

                        <p
                          className={`mt-2 text-xs leading-5 ${
                            addressMode ===
                            "saved"
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}
                        >
                          {formatSavedAddress()}
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`cursor-pointer border p-4 transition ${
                      addressMode === "other"
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white hover:border-black"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="addressMode"
                        checked={
                          addressMode ===
                          "other"
                        }
                        onChange={() =>
                          setAddressMode(
                            "other"
                          )
                        }
                        className="mt-1 accent-white"
                      />

                      <div>
                        <p
                          className={`text-[11px] font-black uppercase tracking-[0.12em] ${
                            addressMode ===
                            "other"
                              ? "text-white"
                              : "text-black"
                          }`}
                        >
                          Another Address
                        </p>

                        <p
                          className={`mt-2 text-xs leading-5 ${
                            addressMode ===
                            "other"
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}
                        >
                          Enter a different
                          delivery location.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {!hasSavedMainAddress && (
                  <div className="mt-3 border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-600">
                    No main address found in
                    your profile. Please use
                    another address or save one
                    in My Account.
                  </div>
                )}

                {/* CONTACT DETAILS */}
                <div className="mt-6">
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                    Contact Information
                  </p>

                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      required
                      name="firstName"
                      value={
                        displayedAddress.firstName
                      }
                      onChange={
                        addressMode ===
                        "other"
                          ? onChangeHandler
                          : undefined
                      }
                      readOnly={
                        addressMode ===
                        "saved"
                      }
                      className={`${inputStyle} ${
                        addressMode ===
                        "saved"
                          ? "cursor-not-allowed bg-gray-50"
                          : ""
                      }`}
                      placeholder="First name"
                    />

                    <input
                      required
                      name="lastName"
                      value={
                        displayedAddress.lastName
                      }
                      onChange={
                        addressMode ===
                        "other"
                          ? onChangeHandler
                          : undefined
                      }
                      readOnly={
                        addressMode ===
                        "saved"
                      }
                      className={`${inputStyle} ${
                        addressMode ===
                        "saved"
                          ? "cursor-not-allowed bg-gray-50"
                          : ""
                      }`}
                      placeholder="Last name"
                    />

                    <input
                      required
                      name="email"
                      type="email"
                      value={
                        displayedAddress.email
                      }
                      onChange={
                        addressMode ===
                        "other"
                          ? onChangeHandler
                          : undefined
                      }
                      readOnly={
                        addressMode ===
                        "saved"
                      }
                      className={`${inputStyle} ${
                        addressMode ===
                        "saved"
                          ? "cursor-not-allowed bg-gray-50"
                          : ""
                      }`}
                      placeholder="Email address"
                    />

                    <input
                      required
                      name="phone"
                      value={
                        displayedAddress.phone
                      }
                      onChange={
                        addressMode ===
                        "other"
                          ? onChangeHandler
                          : undefined
                      }
                      readOnly={
                        addressMode ===
                        "saved"
                      }
                      inputMode="numeric"
                      maxLength={11}
                      className={`${inputStyle} ${
                        addressMode ===
                        "saved"
                          ? "cursor-not-allowed bg-gray-50"
                          : ""
                      }`}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                {/* ADDRESS FIELDS */}
                <div className="mt-6 border-t border-black/10 pt-6">
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                    Shipping Details
                  </p>

                  <ShippingAddressFields
                    formData={
                      addressMode === "saved"
                        ? savedAddress
                        : formData
                    }
                    setFormData={
                      addressMode === "saved"
                        ? setSavedAddress
                        : setFormData
                    }
                    backendUrl={backendUrl}
                    readOnly={
                      addressMode ===
                      "saved"
                    }
                  />
                </div>
              </div>
            </section>

            {/* DELIVERY ESTIMATE */}
            <section
              className={`border ${
                hasPreorderItems
                  ? "border-amber-200 bg-amber-50"
                  : "border-black/10 bg-white"
              }`}
            >
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p
                    className={`text-[9px] font-black uppercase tracking-[0.28em] ${
                      hasPreorderItems
                        ? "text-amber-600"
                        : "text-gray-400"
                    }`}
                  >
                    {hasPreorderItems
                      ? "Pre-order Shipping"
                      : "Estimated Delivery"}
                  </p>

                  <p
                    className={`mt-2 text-lg font-black ${
                      hasPreorderItems
                        ? "text-amber-700"
                        : "text-black"
                    }`}
                  >
                    {hasPreorderItems
                      ? `Ships on ${preorderShipsOn}`
                      : deliveryEstimate.label}
                  </p>
                </div>

                <div
                  className={`text-left sm:text-right ${
                    hasPreorderItems
                      ? "text-amber-700"
                      : "text-gray-500"
                  }`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.18em]">
                    Expected Arrival
                  </p>

                  <p className="mt-1 text-xs font-bold">
                    {hasPreorderItems
                      ? "After restock and dispatch"
                      : deliveryEstimate.range}
                  </p>
                </div>
              </div>
            </section>

            {/* ITEMS */}
            <section className="border border-black/10 bg-white">
              <div className="border-b border-black/10 px-5 py-5 sm:px-6">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                  02
                </p>

                <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-black">
                  Your Items
                </h2>
              </div>

              <div>
                {cartData.map((item, index) => {
                  const basePrice = Number(
                    item.price || 0
                  );

                  const salePercent = Number(
                    item.salePercent || 0
                  );

                  const finalPrice =
                    item.onSale &&
                    salePercent > 0
                      ? Math.max(
                          basePrice -
                            (basePrice *
                              salePercent) /
                              100,
                          0
                        )
                      : basePrice;

                  return (
                    <div
                      key={`${item._id}_${item.size}_${index}`}
                      className="flex gap-4 border-b border-black/10 px-5 py-5 last:border-b-0 sm:px-6"
                    >
                      <div className="h-20 w-16 shrink-0 bg-[radial-gradient(circle_at_center,#ffffff_0%,#f5f5f2_55%,#ededeb_100%)] sm:h-24 sm:w-20">
                        {item.images?.[0] ||
                        item.image ? (
                          <img
                            src={
                              item.images?.[0] ||
                              item.image
                            }
                            alt={item.name}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[8px] font-black uppercase text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black uppercase text-black">
                              {item.name}
                            </p>

                            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
                              Size {item.size}{" "}
                              · Qty{" "}
                              {item.quantity}
                            </p>

                            {item.color && (
                              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                {item.color}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-black text-black">
                              {currency}
                              {(
                                finalPrice *
                                Number(
                                  item.quantity ||
                                    0
                                )
                              ).toFixed(2)}
                            </p>

                            {item.onSale &&
                              salePercent >
                                0 && (
                                <p className="mt-0.5 text-[9px] font-bold text-gray-400 line-through">
                                  {currency}
                                  {(
                                    basePrice *
                                    Number(
                                      item.quantity ||
                                        0
                                    )
                                  ).toFixed(2)}
                                </p>
                              )}
                          </div>
                        </div>

                        {item.isPreorder && (
                          <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-700">
                              Pre-order
                            </p>

                            <p className="mt-1 text-[10px] font-semibold text-amber-700">
                              Ships on{" "}
                              {formatShipDate(
                                item.expectedRestockDate ||
                                  item.preorderRestockDate
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT SIDE */}
          <aside className="space-y-5 xl:sticky xl:top-24">
            {/* SUMMARY */}
            <section className="border border-black/10 bg-white">
              <div className="border-b border-black/10 px-5 py-5">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                  Order Summary
                </p>

                <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-black">
                  Total
                </h2>
              </div>

              <div className="p-5">
                <div className="border border-black/10 bg-white p-4">
                  <CartTotal items={cartData} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                    Total Items
                  </span>

                  <span className="text-sm font-black text-black">
                    {totalQuantity}
                  </span>
                </div>
              </div>
            </section>

            {/* PAYMENT */}
            <section className="border border-black/10 bg-white">
              <div className="border-b border-black/10 px-5 py-5">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                  03
                </p>

                <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-black">
                  Payment
                </h2>

                <p className="mt-2 text-xs font-semibold text-gray-500">
                  Select your preferred payment method.
                </p>
              </div>

              <div className="p-5">
                <div className="grid gap-2">
                  {PAYMENT_OPTIONS.map(
                    (option) => {
                      const isActive =
                        method ===
                        option.key;

                      const isDisabled =
                        hasPreorderItems &&
                        option.key ===
                          "COD";

                      return (
                        <button
                          key={option.key}
                          type="button"
                          disabled={
                            isDisabled
                          }
                          onClick={() => {
                            if (
                              isDisabled
                            ) {
                              toast.error(
                                "COD is not available for pre-order items."
                              );

                              return;
                            }

                            setMethod(
                              option.key
                            );
                          }}
                          className={`relative w-full border p-4 text-left transition ${
                            option.cardClass
                          } ${
                            isActive
                              ? option.activeClass
                              : ""
                          } ${
                            isDisabled
                              ? "cursor-not-allowed opacity-45 grayscale"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-black/10 bg-white">
                              {option.logo ? (
                                <img
                                  src={
                                    option.logo
                                  }
                                  alt={
                                    option.title
                                  }
                                  className="h-7 w-7 object-contain"
                                />
                              ) : (
                                <span className="text-[9px] font-black tracking-[0.16em] text-black">
                                  PAY
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className={`text-sm font-black ${option.titleClass}`}
                                >
                                  {
                                    option.title
                                  }
                                </p>

                                <span
                                  className={`px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${option.badgeClass}`}
                                >
                                  {isDisabled
                                    ? "Disabled"
                                    : option.badge}
                                </span>
                              </div>

                              <p
                                className={`mt-1 text-[10px] font-semibold leading-4 ${
                                  isDisabled
                                    ? "text-red-500"
                                    : option.subtitleClass
                                }`}
                              >
                                {isDisabled
                                  ? option.preorderSubtitle
                                  : option.subtitle}
                              </p>
                            </div>

                            <div
                              className={`h-4 w-4 shrink-0 rounded-full border ${
                                isActive
                                  ? "border-black bg-black"
                                  : "border-black/20 bg-white"
                              }`}
                            >
                              {isActive && (
                                <div className="m-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="mt-3 border border-black/10 bg-[#F6F6F3] px-4 py-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                    Selected Method
                  </p>

                  <p className="mt-1 text-xs font-black text-black">
                    {method ===
                    "PayMongo"
                      ? "Online Payment"
                      : "Cash on Delivery"}
                  </p>
                </div>

                {method ===
                  "PayMongo" && (
                  <div className="mt-3 border border-black/10 bg-white px-4 py-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
                      Online Payment
                    </p>

                    <p className="mt-1 text-[10px] font-semibold leading-5 text-gray-500">
                      You will be redirected
                      to the online payment
                      checkout to complete
                      your payment securely.
                    </p>
                  </div>
                )}

                {hasPreorderItems && (
                  <div className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-700">
                      Pre-order Payment
                    </p>

                    <p className="mt-1 text-[10px] font-semibold leading-5 text-amber-700/80">
                      Pre-order items
                      require online
                      payment.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    (hasPreorderItems &&
                      method ===
                        "COD")
                  }
                  className="mt-5 h-12 w-full border border-black bg-black text-[10px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading
                    ? "Processing..."
                    : method ===
                      "COD"
                    ? "Confirm Order"
                    : "Proceed to Online Payment"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/cart")
                  }
                  className="mt-2 h-11 w-full border border-black/10 bg-white text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black"
                >
                  Back to Cart
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
      </form>
    </div>
  );
};

export default PlaceOrder;