import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const SIZE_ORDER = ["S", "M", "L", "XL", "2XL", "3XL"];

const DEFAULT_CATEGORIES = [
  "Tshirt",
  "Long Sleeve",
  "Jorts",
  "Mesh Shorts",
  "Crop Jersey",
];

const ShopContextProvider = ({ children }) => {
  const currency = "₱";
  const delivery_fee = 10;
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL?.trim() || "http://localhost:4000";

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORIES);
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const navigate = useNavigate();
  const pollingRef = useRef(null);

  const getAuthHeaders = useCallback((userToken) => {
    if (!userToken) return {};
    return {
      token: userToken,
      Authorization: `Bearer ${userToken}`,
    };
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setCartItems({});
    setCartCount(0);
  }, []);

  const getCategoriesData = useCallback(
    async (currentProducts = products) => {
      try {
        const response = await axios.get(`${backendUrl}/api/category/list`);

        if (response.data.success) {
          const backendCategories = (response.data.categories || [])
            .map((item) => item.name)
            .filter(Boolean);

          const productCategories = (currentProducts || [])
            .map((item) => item.category)
            .filter(Boolean);

          setCategoryOptions(
            Array.from(
              new Set([
                ...DEFAULT_CATEGORIES,
                ...backendCategories,
                ...productCategories,
              ])
            )
          );
        }
      } catch (error) {
        console.log(
          "Category fetch error:",
          error.response?.data || error.message
        );

        const productCategories = (currentProducts || [])
          .map((item) => item.category)
          .filter(Boolean);

        setCategoryOptions(
          Array.from(new Set([...DEFAULT_CATEGORIES, ...productCategories]))
        );
      }
    },
    [backendUrl, products]
  );

  const fetchCurrentUser = useCallback(
    async (userToken = token) => {
      if (!userToken) return null;

      try {
        const response = await axios.post(
          `${backendUrl}/api/user/me`,
          {},
          {
            headers: getAuthHeaders(userToken),
          }
        );

        if (response.data.success && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          return response.data.user;
        }

        return null;
      } catch (error) {
        console.log(
          "Fetch current user error:",
          error.response?.data || error.message
        );

        if (error.response?.status === 401) {
          clearAuthData();
        }

        return null;
      }
    },
    [backendUrl, token, getAuthHeaders, clearAuthData]
  );

  const getProductsData = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);

      if (response.data.success) {
        const productsData = (response.data.products || []).map((p) => {
          const stockObj =
            typeof p.stock === "string" ? JSON.parse(p.stock) : p.stock || {};

          const normalizedStock = {};
          SIZE_ORDER.forEach((size) => {
            const matchingKey = Object.keys(stockObj).find(
              (key) => String(key).toUpperCase() === size
            );

            normalizedStock[size] = Number(
              matchingKey ? stockObj[matchingKey] : 0
            );
          });

          return { ...p, stock: normalizedStock };
        });

        const reversedProducts = productsData.reverse();

        setProducts(reversedProducts);
        await getCategoriesData(reversedProducts);
      } else {
        setProducts([]);
        await getCategoriesData([]);
      }
    } catch (error) {
      toast.error("Failed to fetch products: " + error.message);
      setProducts([]);
      await getCategoriesData([]);
    }
  }, [backendUrl, getCategoriesData]);

  const calculateCartCount = useCallback((cart) => {
    return Object.values(cart || {}).reduce((acc, sizes) => {
      const sizeTotal = Object.values(sizes || {}).reduce(
        (sum, qty) => sum + (Number(qty) || 0),
        0
      );
      return acc + sizeTotal;
    }, 0);
  }, []);

  const fetchCart = useCallback(
    async (userToken, userId, silent = true) => {
      if (!userToken || !userId) return;

      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/get`,
          {},
          { headers: getAuthHeaders(userToken) }
        );

        if (response.data.success) {
          const backendCart = response.data.cartData || {};

          setCartItems((prev) => {
            const prevString = JSON.stringify(prev);
            const nextString = JSON.stringify(backendCart);

            if (prevString !== nextString) {
              localStorage.setItem(
                `cart_${userId}`,
                JSON.stringify(backendCart)
              );
              setCartCount(calculateCartCount(backendCart));
              return backendCart;
            }

            setCartCount(calculateCartCount(prev));
            return prev;
          });
        }
      } catch (err) {
        console.log("Failed to fetch cart:", err);

        if (err.response?.status === 401) {
          clearAuthData();
        } else if (!silent) {
          toast.error("Failed to refresh cart");
        }
      }
    },
    [backendUrl, getAuthHeaders, calculateCartCount, clearAuthData]
  );

  const startCartPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!token || !user?._id) return;

    pollingRef.current = setInterval(() => {
      fetchCart(token, user._id, true);
    }, 4000);
  }, [token, user, fetchCart]);

  const stopCartPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const addToCart = useCallback(
    async (itemId, size, quantity = 1) => {
      if (!token || !user?._id) {
        toast.error("Please login to add items to cart");
        navigate("/login");
        return;
      }

      if (!size) {
        toast.error("Please select a size");
        return;
      }

      const normalizedSize = String(size).toUpperCase();
      const product = products.find((p) => p._id === itemId);

      if (!product) {
        toast.error("Product not found");
        return;
      }

      const availableStock = Number(product.stock?.[normalizedSize] || 0);
      const currentQty = Number(cartItems[itemId]?.[normalizedSize] || 0);

      if (currentQty + quantity > availableStock) {
        toast.error("Cannot exceed available stock");
        return;
      }

      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/add`,
          { itemId, size: normalizedSize, quantity },
          { headers: getAuthHeaders(token) }
        );

        if (response.data.success) {
          const updatedCart = response.data.cartData || {};
          setCartItems(updatedCart);
          setCartCount(calculateCartCount(updatedCart));
          localStorage.setItem(`cart_${user._id}`, JSON.stringify(updatedCart));
          toast.success("Added to cart");
        } else {
          toast.error(response.data.message || "Failed to add to cart");
        }
      } catch (error) {
        if (error.response?.status === 401) {
          clearAuthData();
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return;
        }

        toast.error(error.response?.data?.message || "Failed to add to cart");
      }
    },
    [
      token,
      user,
      products,
      cartItems,
      backendUrl,
      navigate,
      getAuthHeaders,
      calculateCartCount,
      clearAuthData,
    ]
  );

  const updateQuantity = useCallback(
    async (itemId, size, quantity) => {
      if (!token || !user?._id) return;

      const normalizedSize = String(size).toUpperCase();
      const product = products.find((p) => p._id === itemId);
      if (!product) return;

      const availableStock = Number(product.stock?.[normalizedSize] || 0);

      if (quantity > availableStock) {
        toast.error("Cannot exceed available stock");
        return;
      }

      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/update`,
          { itemId, size: normalizedSize, quantity },
          { headers: getAuthHeaders(token) }
        );

        if (response.data.success) {
          const updatedCart = response.data.cartData || {};
          setCartItems(updatedCart);
          setCartCount(calculateCartCount(updatedCart));
          localStorage.setItem(`cart_${user._id}`, JSON.stringify(updatedCart));
        } else {
          toast.error(response.data.message || "Failed to update cart");
        }
      } catch (error) {
        if (error.response?.status === 401) {
          clearAuthData();
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return;
        }

        toast.error(error.response?.data?.message || "Failed to update cart");
      }
    },
    [
      token,
      user,
      products,
      backendUrl,
      getAuthHeaders,
      calculateCartCount,
      clearAuthData,
      navigate,
    ]
  );

  const clearCart = useCallback(async () => {
    if (!token || !user?._id) return;

    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/clear`,
        {},
        { headers: getAuthHeaders(token) }
      );

      if (response.data.success) {
        setCartItems({});
        setCartCount(0);
        localStorage.removeItem(`cart_${user._id}`);
      } else {
        toast.error(response.data.message || "Failed to clear cart");
      }
    } catch (error) {
      console.log("Clear cart error:", error);

      if (error.response?.status === 401) {
        clearAuthData();
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      toast.error(error.response?.data?.message || "Failed to clear cart");
    }
  }, [token, user, backendUrl, getAuthHeaders, clearAuthData, navigate]);

  useEffect(() => {
    const loadAppData = async () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      let activeUser = null;

      if (savedToken) {
        setToken(savedToken);

        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            activeUser = parsedUser;
          } catch {
            clearAuthData();
          }
        }

        const freshUser = await fetchCurrentUser(savedToken);
        if (freshUser) {
          activeUser = freshUser;
        }
      }

      await getProductsData();

      if (savedToken && activeUser?._id) {
        await fetchCart(savedToken, activeUser._id, true);
      }

      setAuthReady(true);
    };

    loadAppData();
  }, [getProductsData, fetchCart, fetchCurrentUser, clearAuthData]);

  useEffect(() => {
    if (token && user?._id) {
      fetchCurrentUser(token);
      fetchCart(token, user._id, true);
      startCartPolling();
    } else {
      stopCartPolling();
    }

    return () => stopCartPolling();
  }, [
    token,
    user?._id,
    fetchCurrentUser,
    fetchCart,
    startCartPolling,
    stopCartPolling,
  ]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (token && user?._id) {
          fetchCurrentUser(token);
          fetchCart(token, user._id, true);
        }

        getProductsData();
      }
    };

    const handleStorage = () => {
      if (token && user?._id) {
        fetchCurrentUser(token);
        fetchCart(token, user._id, true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [token, user?._id, fetchCurrentUser, fetchCart, getProductsData]);

  const getCartAmount = useCallback(() => {
    return Object.entries(cartItems).reduce((acc, [itemId, sizes]) => {
      const product = products.find((p) => p._id === itemId);
      if (!product) return acc;

      const basePrice = Number(product.price || 0);
      const salePercent = Number(product.salePercent || 0);

      const finalPrice =
        product.onSale && salePercent > 0
          ? basePrice - (basePrice * salePercent) / 100
          : basePrice;

      const totalForProduct = Object.values(sizes || {}).reduce(
        (sum, qty) => sum + (Number(qty) || 0) * finalPrice,
        0
      );

      return acc + totalForProduct;
    }, 0);
  }, [cartItems, products]);

  const value = {
    products,
    categoryOptions,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    cartCount,
    setCartItems,
    addToCart,
    updateQuantity,
    clearCart,
    getCartCount: () => cartCount,
    getCartAmount,
    navigate,
    backendUrl,
    token,
    setToken,
    user,
    setUser,
    authReady,
    fetchCart,
    fetchCurrentUser,
    getProductsData,
    getCategoriesData,
    clearAuthData,
    getAuthHeaders,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider; 