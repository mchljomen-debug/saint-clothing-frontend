import React, { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";
import ProductItem from "../components/ProductItem";
import useRecommendations from "../hooks/useRecommendations";

const getMediaUrl = (value, backendUrl) => {
  if (!value) return "";
  const stringValue = String(value).trim();

  if (
    stringValue.startsWith("http://") ||
    stringValue.startsWith("https://") ||
    stringValue.startsWith("data:")
  ) {
    return stringValue;
  }

  if (stringValue.startsWith("/uploads/")) {
    return `${backendUrl}${stringValue}`;
  }

  return `${backendUrl}/uploads/${stringValue.replace(/^\/+/, "")}`;
};

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    updateQuantity,
    navigate,
    backendUrl,
    token,
    authReady,
    user,
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    if (authReady && !token) {
      toast.error("Please login to view your cart");
      navigate("/login");
    }
  }, [token, navigate, authReady]);

  useEffect(() => {
    if (!authReady || products.length === 0) return;

    const tempData = [];

    for (const productId in cartItems) {
      const product = products.find((p) => p._id === productId);
      if (!product) continue;

      for (const size in cartItems[productId]) {
        const quantity = Number(cartItems[productId][size] || 0);

        if (quantity > 0) {
          tempData.push({
            ...product,
            size,
            quantity,
            images: Array.isArray(product.images) ? product.images : [],
          });
        }
      }
    }

    setCartData(tempData);
  }, [cartItems, products, authReady]);

  useEffect(() => {
    setSelectedItems((prev) => {
      const next = {};
      cartData.forEach((item) => {
        const key = `${item._id}_${item.size}`;
        next[key] = prev[key] !== undefined ? prev[key] : true;
      });
      return next;
    });
  }, [cartData]);

  const getItemKey = (item) => `${item._id}_${item.size}`;

  const getFinalPrice = (item) => {
    const basePrice = Number(item.price || 0);
    const salePercent = Number(item.salePercent || 0);

    if (item.onSale && salePercent > 0) {
      return Math.max(basePrice - (basePrice * salePercent) / 100, 0);
    }

    return basePrice;
  };

  const selectedCartData = useMemo(() => {
    return cartData.filter((item) => selectedItems[getItemKey(item)]);
  }, [cartData, selectedItems]);

  const allSelected =
    cartData.length > 0 &&
    cartData.every((item) => selectedItems[getItemKey(item)]);

  const selectedItemsCount = selectedCartData.length;

  const selectedSubtotal = useMemo(() => {
    return selectedCartData.reduce(
      (sum, item) => sum + getFinalPrice(item) * Number(item.quantity || 0),
      0
    );
  }, [selectedCartData]);

  const selectedTotalQuantity = useMemo(() => {
    return selectedCartData.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [selectedCartData]);

  const selectedProductIds = useMemo(() => {
    return selectedCartData.map((item) => item._id);
  }, [selectedCartData]);

  const selectedCategories = useMemo(() => {
    return [
      ...new Set(selectedCartData.map((item) => item.category).filter(Boolean)),
    ];
  }, [selectedCartData]);

  const selectedColors = useMemo(() => {
    return [
      ...new Set(selectedCartData.map((item) => item.color).filter(Boolean)),
    ];
  }, [selectedCartData]);

  const { recommendations: recommendedProducts } = useRecommendations({
    backendUrl,
    products,
    productIds: selectedProductIds,
    category: selectedCategories[0] || "Tshirt",
    color: selectedColors[0] || "",
    userId: user?._id || null,
    limit: 4,
    enabled: selectedCartData.length > 0,
  });

  const handleToggleItem = (item) => {
    const key = getItemKey(item);
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = () => {
    const next = {};
    cartData.forEach((item) => {
      next[getItemKey(item)] = !allSelected;
    });
    setSelectedItems(next);
  };

  const handleCheckout = () => {
    if (selectedCartData.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    localStorage.setItem("checkout_cart", JSON.stringify(selectedCartData));
    toast.success("Selected items are ready for checkout");
    navigate("/place-order");
  };

  const handleQtyChange = (item, nextQty) => {
    const qty = Number(nextQty);

    if (!Number.isFinite(qty) || qty < 1) {
      updateQuantity(item._id, item.size, 1);
      return;
    }

    updateQuantity(item._id, item.size, qty);
  };

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F7F4]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-[5px] border-2 border-gray-200 border-t-black" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
            Loading Cart
          </p>
        </div>
      </div>
    );
  }

  if (!cartData.length) {
    return (
      <div className="min-h-screen bg-[#F7F7F4] px-4 pt-28">
        <div className="mx-auto max-w-3xl rounded-[5px] border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
            Saint Clothing
          </p>

          <Title text1={"YOUR"} text2={"CART"} />

          <p className="mt-5 text-sm font-semibold text-gray-500">
            Your cart is empty.
          </p>

          <button
            onClick={() => navigate("/collection")}
            className="mt-8 rounded-[5px] border border-black bg-black px-8 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-white transition hover:bg-white hover:text-black"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F4] px-3 pb-12 pt-4 font-['Outfit'] sm:px-5 md:px-8 lg:px-10 xl:px-12">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-5 rounded-[5px] border border-black/10 bg-white px-4 py-5 shadow-sm sm:px-5 md:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
                Saint Clothing Checkout
              </p>

              <Title text1={"SHOPPING"} text2={"BAG"} />

              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">
                Review and choose what to checkout
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-[5px] border border-black/10 bg-[#F7F7F4] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-gray-600">
                {cartData.length} item{cartData.length > 1 ? "s" : ""}
              </div>

              <button
                type="button"
                onClick={handleSelectAll}
                className="w-[150px] text-center rounded-[5px] border border-black bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white"
              >
                {allSelected ? "Unselect All" : "Select All"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_0.7fr] lg:gap-6">
          {/* CART ITEMS */}
          <div className="overflow-hidden rounded-[5px] border border-black/10 bg-white shadow-sm">
            <div className="hidden grid-cols-[0.45fr_3fr_1fr_1fr_0.65fr] gap-4 border-b border-black/10 bg-[#FCFCFA] px-5 py-4 md:grid">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                Pick
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                Product
              </p>
              <p className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                Quantity
              </p>
              <p className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                Price
              </p>
              <p className="text-right text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                Remove
              </p>
            </div>

            <div>
              {cartData.map((item) => {
                const key = getItemKey(item);
                const isSelected = !!selectedItems[key];
                const imageSrc = item.images?.length
                  ? getMediaUrl(item.images[0], backendUrl)
                  : item.image
                    ? getMediaUrl(item.image, backendUrl)
                    : "";
                const finalPrice = getFinalPrice(item);

                return (
                  <div
                    key={key}
                    className={`border-b border-black/10 last:border-b-0 transition ${isSelected ? "bg-[#FCFCFA]" : "bg-white opacity-80"
                      }`}
                  >
                    <div className="grid gap-4 px-4 py-4 md:grid-cols-[0.45fr_3fr_1fr_1fr_0.65fr] md:items-center md:px-5">
                      <div className="flex md:justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(item)}
                          className="h-4 w-4 cursor-pointer accent-black"
                        />
                      </div>

                      <div className="flex min-w-0 items-start gap-4">
                        <div className="h-32 w-24 shrink-0 overflow-hidden rounded-[5px] border border-black/10 bg-[radial-gradient(circle_at_center,#ffffff_0%,#f6f6f3_48%,#ededeb_100%)]">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.name}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 pt-1">
                          <p className="truncate text-base font-black uppercase text-black">
                            {item.name}
                          </p>

                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Saint Clothing
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-[5px] bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                              Size {item.size}
                            </span>

                            <span className="rounded-[5px] border border-black/10 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                              Ref {item._id.slice(-6)}
                            </span>

                            {item.onSale && Number(item.salePercent) > 0 && (
                              <span className="rounded-[5px] bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                                {item.salePercent}% Off
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex md:justify-center">
                        <div className="inline-flex overflow-hidden rounded-[5px] border border-black/10 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(item, item.quantity - 1)
                            }
                            className="h-10 w-10 text-lg font-black transition hover:bg-black hover:text-white"
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleQtyChange(item, e.target.value)
                            }
                            className="h-10 w-12 border-x border-black/10 text-center text-sm font-black outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(item, item.quantity + 1)
                            }
                            className="h-10 w-10 text-lg font-black transition hover:bg-black hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-left md:text-center">
                        {item.onSale && Number(item.salePercent) > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 line-through">
                              {currency}
                              {Number(item.price || 0).toFixed(2)}
                            </span>
                            <span className="text-base font-black text-red-600">
                              {currency}
                              {finalPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-base font-black text-black">
                            {currency}
                            {Number(item.price || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex md:justify-end">
                        <button
                          onClick={() => updateQuantity(item._id, item.size, 0)}
                          className="group flex h-10 w-10 items-center justify-center rounded-[5px] border border-black/10 bg-white transition hover:border-black hover:bg-black"
                        >
                          <img
                            src={assets.bin_icon}
                            alt="Remove"
                            className="w-4 opacity-50 transition group-hover:opacity-100"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUMMARY */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-[5px] border border-black/10 bg-white p-5 shadow-sm md:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Checkout Summary
              </p>

              <h3 className="mt-2 text-lg font-black uppercase tracking-[0.12em] text-black">
                Order Summary
              </h3>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Selected items</span>
                  <span className="font-black text-black">
                    {selectedItemsCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total quantity</span>
                  <span className="font-black text-black">
                    {selectedTotalQuantity}
                  </span>
                </div>

                <div className="border-t border-black/10 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                        Subtotal
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-400">
                        Only selected items will be checked out
                      </p>
                    </div>

                    <p className="text-2xl font-black text-black">
                      {currency}
                      {selectedSubtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="mt-7 h-12 w-full rounded-[5px] border border-black bg-black text-[10px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black"
              >
                Checkout Selected
              </button>

              <button
                onClick={() => navigate("/collection")}
                className="mt-3 h-11 w-full rounded-[5px] border border-black/10 bg-white text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

        {/* RECOMMENDATIONS */}
        {recommendedProducts.length > 0 && (
          <div className="mt-10 rounded-[5px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5 border-b border-black/10 pb-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-gray-400">
                Complete the Look
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase text-[#0A0D17]">
                Style Recommendations
              </h2>
              <p className="mt-2 text-sm font-semibold text-gray-500">
                Based on the items you selected in your bag
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

export default Cart;