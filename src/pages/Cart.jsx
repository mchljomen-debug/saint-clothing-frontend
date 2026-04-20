import React, { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";
import ProductItem from "../components/ProductItem";
import useRecommendations from "../hooks/useRecommendations";

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
    cartData.length > 0 && cartData.every((item) => selectedItems[getItemKey(item)]);

  const selectedItemsCount = selectedCartData.length;

  const selectedSubtotal = useMemo(() => {
    return selectedCartData.reduce(
      (sum, item) => sum + getFinalPrice(item) * Number(item.quantity || 0),
      0
    );
  }, [selectedCartData]);

  const selectedTotalQuantity = useMemo(() => {
    return selectedCartData.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [selectedCartData]);

  const selectedProductIds = useMemo(() => {
    return selectedCartData.map((item) => item._id);
  }, [selectedCartData]);

  const selectedCategories = useMemo(() => {
    return [...new Set(selectedCartData.map((item) => item.category).filter(Boolean))];
  }, [selectedCartData]);

  const selectedColors = useMemo(() => {
    return [...new Set(selectedCartData.map((item) => item.color).filter(Boolean))];
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
      <div className="h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-black border-gray-200 rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold tracking-[0.4em] text-gray-400 uppercase">
            Loading Cart
          </p>
        </div>
      </div>
    );
  }

  if (!cartData.length) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] px-6 pt-32">
        <div className="max-w-3xl mx-auto bg-white border border-black/5 rounded-3xl shadow-sm p-10 text-center">
          <Title text1={"YOUR"} text2={"CART"} />
          <p className="mt-6 text-sm text-gray-500">Your cart is empty.</p>
          <button
            onClick={() => navigate("/collection")}
            className="mt-10 bg-black text-white px-10 py-4 rounded-xl text-[11px] font-bold tracking-[0.25em] uppercase hover:bg-[#ED3500] transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-8 pb-20 px-4 md:px-8 lg:px-12 font-['Outfit']">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <Title text1={"SHOPPING"} text2={"BAG"} />
            <p className="mt-3 text-[11px] font-semibold text-gray-500 uppercase tracking-[0.25em]">
              Review and choose what to checkout
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-white border border-black/5 text-sm font-semibold text-gray-600">
              {cartData.length} item{cartData.length > 1 ? "s" : ""}
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-5 py-3 rounded-xl border border-black text-black bg-white hover:bg-black hover:text-white transition text-[11px] font-bold uppercase tracking-[0.18em]"
            >
              {allSelected ? "Unselect All" : "Select All"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_0.72fr] gap-8 items-start">
          <div className="bg-white border border-black/5 rounded-3xl shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-[0.5fr_3fr_1fr_1fr_0.6fr] gap-4 px-6 py-5 border-b border-black/5 bg-[#FCFCFA]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Pick</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Product</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 text-center">Quantity</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 text-center">Price</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 text-right">Remove</p>
            </div>

            <div>
              {cartData.map((item) => {
                const key = getItemKey(item);
                const isSelected = !!selectedItems[key];
                const imageSrc =
                  item.images?.length > 0 ? `${backendUrl}/uploads/${item.images[0]}` : "";
                const finalPrice = getFinalPrice(item);

                return (
                  <div
                    key={key}
                    className={`border-b border-black/5 last:border-b-0 transition ${
                      isSelected ? "bg-[#FCFCFA]" : "bg-white"
                    }`}
                  >
                    <div className="grid md:grid-cols-[0.5fr_3fr_1fr_1fr_0.6fr] gap-4 px-5 md:px-6 py-5 items-center">
                      <div className="flex md:justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(item)}
                          className="w-4 h-4 accent-black cursor-pointer"
                        />
                      </div>

                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-24 h-28 rounded-2xl overflow-hidden bg-[#F4F4F1] border border-black/5 shrink-0">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 pt-1">
                          <p className="text-base font-bold text-black uppercase truncate">
                            {item.name}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-black text-white text-[10px] font-bold uppercase tracking-[0.12em]">
                              Size {item.size}
                            </span>

                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-[0.12em]">
                              Ref {item._id.slice(-6)}
                            </span>

                            {item.onSale && Number(item.salePercent) > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-[#ED3500] text-white text-[10px] font-bold uppercase tracking-[0.12em]">
                                {item.salePercent}% Off
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex md:justify-center">
                        <div className="inline-flex items-center border border-black/10 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item, item.quantity - 1)}
                            className="w-10 h-10 text-lg font-bold hover:bg-black hover:text-white transition"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleQtyChange(item, e.target.value)}
                            className="w-12 h-10 text-center text-sm font-bold outline-none border-x border-black/10"
                          />
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item, item.quantity + 1)}
                            className="w-10 h-10 text-lg font-bold hover:bg-black hover:text-white transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-left md:text-center">
                        {item.onSale && Number(item.salePercent) > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 line-through font-semibold">
                              {currency}{Number(item.price || 0).toFixed(2)}
                            </span>
                            <span className="text-base font-bold text-[#ED3500]">
                              {currency}{finalPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-base font-bold text-black">
                            {currency}{Number(item.price || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex md:justify-end">
                        <button
                          onClick={() => updateQuantity(item._id, item.size, 0)}
                          className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:border-black transition group"
                        >
                          <img
                            src={assets.bin_icon}
                            alt="Remove"
                            className="w-4 opacity-50 group-hover:opacity-100"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sticky top-28">
            <div className="bg-white border border-black/5 rounded-3xl shadow-sm p-6">
              <h3 className="text-lg font-bold uppercase tracking-[0.15em] text-black">
                Order Summary
              </h3>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Selected items</span>
                  <span className="font-bold text-black">{selectedItemsCount}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Total quantity</span>
                  <span className="font-bold text-black">{selectedTotalQuantity}</span>
                </div>

                <div className="border-t border-black/5 pt-4 flex justify-between items-end">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      Subtotal
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Only selected items will be checked out
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-[#ED3500]">
                    {currency}
                    {selectedSubtotal.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full mt-8 h-14 rounded-2xl bg-black text-white font-bold uppercase tracking-[0.22em] hover:bg-[#ED3500] transition"
              >
                Checkout Selected
              </button>

              <button
                onClick={() => navigate("/collection")}
                className="w-full mt-3 h-12 rounded-2xl border border-black/10 text-black font-bold uppercase tracking-[0.18em] hover:bg-gray-50 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

        {recommendedProducts.length > 0 && (
          <div className="mt-14">
            <div className="text-center mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-gray-400">
                Complete the Look
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase text-[#0A0D17]">
                Style Recommendations
              </h2>
              <p className="mt-3 text-sm text-gray-500">
                Based on the items you selected in your bag
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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