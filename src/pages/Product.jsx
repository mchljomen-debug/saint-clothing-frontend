import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import RelatedProducts from "../components/RelatedProducts";
import ReviewSection from "../components/ReviewSection";
import ProductItem from "../components/ProductItem";
import useRecommendations from "../hooks/useRecommendations";
import { toast } from "react-toastify";
import axios from "axios";

const SIZE_ORDER = ["S", "M", "L", "XL", "2XL", "3XL"];

const getStockValue = (stock, size) => {
  if (!stock) return 0;

  const target = String(size).toUpperCase();

  if (typeof stock.get === "function") {
    const exact = stock.get(target);
    if (exact !== undefined && exact !== null) return Number(exact) || 0;

    const lower = stock.get(target.toLowerCase());
    if (lower !== undefined && lower !== null) return Number(lower) || 0;
  }

  if (typeof stock === "object" && stock !== null) {
    const entries = Object.entries(stock);
    const found = entries.find(([key]) => String(key).toUpperCase() === target);
    if (found) return Number(found[1]) || 0;
  }

  return 0;
};

const getTotalStockFromObject = (stock) => {
  if (!stock) return 0;

  if (typeof stock.get === "function") {
    let total = 0;
    for (const [, value] of stock.entries()) {
      total += Number(value) || 0;
    }
    return total;
  }

  if (typeof stock === "object" && stock !== null) {
    return Object.values(stock).reduce(
      (sum, qty) => sum + (Number(qty) || 0),
      0
    );
  }

  return 0;
};

const normalizeBranch = (value) => String(value || "").trim().toLowerCase();

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

  return `${backendUrl}/uploads/${stringValue.replace(/^\/+/, "")}`;
};

const Product = () => {
  const { products, currency, addToCart, backendUrl, user, token } =
    useContext(ShopContext);

  const params = useParams();
  const pid = params.productId || params.id || "";

  const navigate = useNavigate();
  const location = useLocation();

  const [productData, setProductData] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [canReview, setCanReview] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const [tryOnModalOpen, setTryOnModalOpen] = useState(false);
  const [show3DModalOpen, setShow3DModalOpen] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const [branches, setBranches] = useState([]);

  const addToCartBtnRef = useRef(null);
  const modelViewerRef = useRef(null);

  const isLoggedIn = !!user;

  const loadProduct = useCallback(async () => {
    if (!pid || pid === "undefined" || pid === "null") {
      console.log("Invalid product ID:", pid);
      setProductData(false);
      return;
    }

    try {
      console.log("Loading product ID:", pid);
      console.log("Request URL:", `${backendUrl}/api/product/single/${pid}`);

      const res = await axios.get(`${backendUrl}/api/product/single/${pid}`, {
        timeout: 10000,
      });

      console.log("Single product response:", res.data);

      if (res?.data?.success && res?.data?.product) {
        const product = res.data.product;

        setProductData(product);
        setSelectedImage(
          product.images?.[0] ? getMediaUrl(product.images[0], backendUrl) : ""
        );
        setSize("");
        setQuantity(1);
        setShowSizeChart(false);
      } else {
        console.log("Backend said no product:", res?.data);
        toast.error(res?.data?.message || "Product not found");
        setProductData(false);
      }
    } catch (error) {
      console.error("LOAD PRODUCT ERROR:", error);
      console.log("Error response:", error?.response?.data);
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load product"
      );
      setProductData(false);
    }
  }, [backendUrl, pid]);

  const loadBranches = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/branch/list`, {
        timeout: 8000,
      });

      if (res.data?.success) {
        setBranches(Array.isArray(res.data.branches) ? res.data.branches : []);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.log("BRANCH LOAD ERROR:", error?.message);
      setBranches([]);
    }
  }, [backendUrl]);

  const loadCanReview = useCallback(async () => {
    if (!token || !pid || pid === "undefined") {
      setCanReview(false);
      return;
    }

    try {
      const res = await axios.get(`${backendUrl}/api/product/can-review/${pid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          token,
        },
        timeout: 8000,
      });

      if (res.data.success) {
        setCanReview(!!res.data.canReview);
      } else {
        setCanReview(false);
      }
    } catch {
      setCanReview(false);
    }
  }, [backendUrl, pid, token]);

  useEffect(() => {
    if (!pid || pid === "undefined" || pid === "null") {
      setProductData(false);
      return;
    }

    loadProduct();
    loadBranches();
  }, [pid, loadProduct, loadBranches]);

  useEffect(() => {
    if (!pid || pid === "undefined" || pid === "null") {
      setCanReview(false);
      return;
    }

    loadCanReview();
  }, [loadCanReview, pid]);

  useEffect(() => {
    if (!pid || pid === "undefined" || pid === "null") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (location.hash === "#reviews") {
      setActiveTab("reviews");
      setTimeout(() => {
        const section = document.getElementById("reviews-section");
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location, pid]);

  useEffect(() => {
    const trackView = async () => {
      if (!token || !user?._id || !productData?._id) return;

      try {
        await axios.post(
          `${backendUrl}/api/recommendation/track`,
          {
            userId: user._id,
            productId: productData._id,
            signalType: "view",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("TRACK VIEW ERROR:", error);
        }
      }
    };

    trackView();
  }, [backendUrl, token, user, productData]);

  useEffect(() => {
    if (!show3DModalOpen && !showSizeChart) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setShow3DModalOpen(false);
        setShowSizeChart(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [show3DModalOpen, showSizeChart]);

  const colorVariants = useMemo(() => {
    if (!productData?.groupCode || !Array.isArray(products)) return [];

    return products.filter(
      (item) => item && item.groupCode === productData.groupCode && !item.isDeleted
    );
  }, [products, productData]);

  const normalizedStock = useMemo(() => {
    if (!productData || productData === false) return {};

    const result = {};
    SIZE_ORDER.forEach((s) => {
      result[s] = getStockValue(productData.stock, s);
    });

    return result;
  }, [productData]);

  const availableSizes = useMemo(() => {
    if (!productData || productData === false) return [];

    const backendSizes = Array.isArray(productData.sizes)
      ? productData.sizes.map((s) => String(s).toUpperCase())
      : [];

    const stockSizes =
      productData.stock && typeof productData.stock === "object"
        ? Object.keys(productData.stock).map((s) => String(s).toUpperCase())
        : [];

    const merged = [...new Set([...backendSizes, ...stockSizes])];

    return merged
      .filter((s) => SIZE_ORDER.includes(s))
      .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
  }, [productData]);

  useEffect(() => {
    if (!availableSizes.length) {
      setSize("");
      return;
    }

    const preferredSize = String(
      user?.preferences?.preferredSize || ""
    ).toUpperCase();

    const preferredAvailable =
      preferredSize &&
      availableSizes.includes(preferredSize) &&
      Number(normalizedStock[preferredSize] || 0) > 0;

    if (preferredAvailable) {
      setSize((prev) => (prev === preferredSize ? prev : preferredSize));
      return;
    }

    const firstAvailableInStock = availableSizes.find(
      (item) => Number(normalizedStock[item] || 0) > 0
    );

    if (firstAvailableInStock) {
      setSize((prev) =>
        prev === firstAvailableInStock ? prev : firstAvailableInStock
      );
      return;
    }

    setSize("");
  }, [availableSizes, normalizedStock, user?.preferences?.preferredSize, pid]);

  const reviews = Array.isArray(productData?.reviews) ? productData.reviews : [];

  const averageRating = reviews.length
    ? (
      reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
      reviews.length
    ).toFixed(1)
    : "0.0";

  const finalPrice = useMemo(() => {
    if (!productData || productData === false) return "0.00";

    const originalPrice = Number(productData.price || 0);
    const discount = Number(productData.salePercent || 0);

    if (productData.onSale && discount > 0) {
      return Math.max(originalPrice - (originalPrice * discount) / 100, 0).toFixed(
        2
      );
    }

    return originalPrice.toFixed(2);
  }, [productData]);

  const displayColor = useMemo(() => {
    if (!productData || productData === false) return "Default";
    return productData.color || "Default";
  }, [productData]);

  const selectedStock = size ? Number(normalizedStock[size] || 0) : 0;
  const totalProductStock = getTotalStockFromObject(productData?.stock);
  const isProductOutOfStock = totalProductStock <= 0;
  const has3DModel = !!productData?.model3d;

  const previewVideoUrl = productData?.previewVideo
    ? getMediaUrl(productData.previewVideo, backendUrl)
    : "";

  const modelFileName = String(productData?.model3d || "").toLowerCase();
  const isVideoFile =
    modelFileName.endsWith(".mp4") ||
    modelFileName.endsWith(".webm") ||
    modelFileName.endsWith(".ogg");

  const isModelViewerFile =
    modelFileName.endsWith(".glb") || modelFileName.endsWith(".gltf");

  const previewFileUrl = has3DModel
    ? getMediaUrl(productData.model3d, backendUrl)
    : "";

  const availableBranches = useMemo(() => {
    if (!productData || productData === false || !Array.isArray(products))
      return [];

    const activeBranchList = branches.filter((b) => b.isActive);

    const matchingProducts = products.filter((item) => {
      if (!item || item.isDeleted) return false;

      if (productData.sku && item.sku) {
        return (
          String(item.sku).trim().toLowerCase() ===
          String(productData.sku).trim().toLowerCase()
        );
      }

      if (productData.groupCode && item.groupCode) {
        return (
          String(item.groupCode).trim().toLowerCase() ===
          String(productData.groupCode).trim().toLowerCase() &&
          String(item.color || "").trim().toLowerCase() ===
          String(productData.color || "").trim().toLowerCase()
        );
      }

      return (
        String(item.name || "").trim().toLowerCase() ===
        String(productData.name || "").trim().toLowerCase() &&
        String(item.category || "").trim().toLowerCase() ===
        String(productData.category || "").trim().toLowerCase() &&
        String(item.color || "").trim().toLowerCase() ===
        String(productData.color || "").trim().toLowerCase()
      );
    });

    const fallbackBranchMap = new Map();
    matchingProducts.forEach((item) => {
      const code = normalizeBranch(item.branch);
      if (!code) return;

      if (!fallbackBranchMap.has(code)) {
        fallbackBranchMap.set(code, {
          _id: code,
          code,
          name: item.branch,
          isActive: true,
        });
      }
    });

    const branchSource =
      activeBranchList.length > 0
        ? activeBranchList
        : Array.from(fallbackBranchMap.values());

    return branchSource.map((branchItem) => {
      const branchCode = normalizeBranch(branchItem.code || branchItem.name);
      const itemsInBranch = matchingProducts.filter(
        (item) => normalizeBranch(item.branch) === branchCode
      );

      const totalStock = itemsInBranch.reduce(
        (sum, item) => sum + getTotalStockFromObject(item.stock),
        0
      );

      return {
        branch: branchCode,
        branchName: branchItem.name || branchItem.code || branchCode,
        available: totalStock > 0,
        totalStock,
      };
    });
  }, [productData, products, branches]);

  const { recommendations: styleRecommendations } = useRecommendations({
    backendUrl,
    products,
    productId: productData?._id || null,
    category: productData?.category || "",
    color: productData?.color || "",
    userId: user?._id || null,
    limit: 4,
    enabled: !!productData?._id,
  });

  useEffect(() => {
    if (!size) return;
    if (selectedStock <= 0) {
      setQuantity(1);
      return;
    }
    if (quantity > selectedStock) {
      setQuantity(selectedStock);
    }
  }, [size, selectedStock, quantity]);

  const animateToCart = () => {
    const cartEl = document.getElementById("cart-icon-target");
    const buttonEl = addToCartBtnRef.current;

    if (!cartEl || !buttonEl || !selectedImage) return;

    const buttonRect = buttonEl.getBoundingClientRect();
    const cartRect = cartEl.getBoundingClientRect();

    const startX = buttonRect.left + buttonRect.width / 2;
    const startY = buttonRect.top + buttonRect.height / 2;

    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    const flyer = document.createElement("div");
    flyer.style.position = "fixed";
    flyer.style.left = `${startX - 26}px`;
    flyer.style.top = `${startY - 26}px`;
    flyer.style.width = "52px";
    flyer.style.height = "52px";
    flyer.style.borderRadius = "9999px";
    flyer.style.overflow = "hidden";
    flyer.style.zIndex = "9999";
    flyer.style.pointerEvents = "none";
    flyer.style.boxShadow = "0 12px 30px rgba(0,0,0,0.22)";
    flyer.style.border = "2px solid white";
    flyer.style.background = "#fff";
    flyer.style.willChange = "left, top, transform, opacity";

    const img = document.createElement("img");
    img.src = selectedImage;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    flyer.appendChild(img);
    document.body.appendChild(flyer);

    const duration = 1700;
    const arcHeight = 160;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - t, 3);

      const currentX = startX + (endX - startX) * easeOutCubic;
      const baseY = startY + (endY - startY) * easeOutCubic;
      const curveOffset = Math.sin(Math.PI * easeOutCubic) * arcHeight;
      const currentY = baseY - curveOffset;

      const scale = 1 - easeOutCubic * 0.82;
      const opacity = 1 - easeOutCubic * 0.85;
      const rotate = easeOutCubic * 18;

      flyer.style.left = `${currentX - 26}px`;
      flyer.style.top = `${currentY - 26}px`;
      flyer.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
      flyer.style.opacity = `${opacity}`;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        flyer.remove();

        cartEl.classList.add("cart-bump");
        setTimeout(() => {
          cartEl.classList.remove("cart-bump");
        }, 350);
      }
    };

    requestAnimationFrame(animate);
  };

  const zoomInModel = () => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    try {
      const orbit = viewer.getCameraOrbit();
      viewer.cameraOrbit = `${orbit.theta} ${orbit.phi} ${Math.max(
        orbit.radius - 0.3,
        0.8
      )}m`;
    } catch { }
  };

  const zoomOutModel = () => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    try {
      const orbit = viewer.getCameraOrbit();
      viewer.cameraOrbit = `${orbit.theta} ${orbit.phi} ${orbit.radius + 0.3}m`;
    } catch { }
  };

  const resetModelView = () => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    try {
      viewer.cameraOrbit = "0deg 75deg 2.2m";
      viewer.fieldOfView = "30deg";
    } catch { }
  };

  const toggleAutoRotate = () => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    if (isAutoRotating) {
      viewer.removeAttribute("auto-rotate");
    } else {
      viewer.setAttribute("auto-rotate", "");
    }

    setIsAutoRotating((prev) => !prev);
  };

  const handleBuyNow = () => {
    if (!token || !user?._id) {
      toast.error("Please login to buy this product");
      navigate("/login");
      return;
    }

    if (isProductOutOfStock) {
      toast.error("This product is currently out of stock");
      return;
    }

    if (!size) {
      toast.error("Please select a size first");
      return;
    }

    if (selectedStock <= 0) {
      toast.error(`Size ${size} is out of stock`);
      return;
    }

    if (quantity > selectedStock) {
      toast.error(`Only ${selectedStock} stock left for size ${size}`);
      return;
    }

    const checkoutItem = [
      {
        ...productData,
        quantity,
        size,
      },
    ];

    localStorage.setItem("checkout_cart", JSON.stringify(checkoutItem));
    navigate("/place-order");
  };

  const handleTryItOn = () => {
    setTryOnModalOpen(true);
  };

  const handleShow3D = () => {
    if (!isLoggedIn) {
      toast.error("Please login first to use 3D view");
      return;
    }

    if (!has3DModel) {
      toast.error("No 3D model or video attached for this product");
      return;
    }

    setShow3DModalOpen(true);
  };

  const handleAddToCart = async () => {
    if (isProductOutOfStock) {
      toast.error("This product is currently out of stock");
      return;
    }

    if (!size) {
      toast.error("Please select a size first");
      return;
    }

    if (selectedStock <= 0) {
      toast.error(`Size ${size} is out of stock`);
      return;
    }

    if (selectedStock < quantity) {
      toast.error(`Only ${selectedStock} stock left for size ${size}`);
      return;
    }

    animateToCart();
    addToCart(productData._id, size, quantity);



    if (token && user?._id) {
      try {
        await axios.post(
          `${backendUrl}/api/recommendation/track`,
          {
            userId: user._id,
            productId: productData._id,
            signalType: "cart",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("TRACK CART ERROR:", error);
        }
      }
    }
  };

  if (productData === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.25em] text-gray-400">
            Loading Product
          </p>
        </div>
      </div>
    );
  }

  if (productData === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] px-4">
        <div className="text-center">
          <p className="text-lg font-black uppercase text-black">Product not found</p>
          <button
            type="button"
            onClick={() => navigate("/collection")}
            className="mt-4 px-5 py-3 bg-black text-white text-sm font-black uppercase rounded-xl"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .cart-bump {
          animation: cartBump 0.35s ease;
        }
        @keyframes cartBump {
          0% { transform: scale(1); }
          40% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }

        @keyframes slidePanelIn {
          0% {
            opacity: 0;
            transform: translateX(36px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .scrollbar-thin-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-thin-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="min-h-screen bg-transparent pt-[8px] sm:pt-[16px] pb-6 sm:pb-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.92fr] gap-3 sm:gap-4 lg:gap-5 xl:gap-6 items-start">
            <div className="bg-white border border-black/10 rounded-[18px] sm:rounded-[20px] shadow-[0_10px_28px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-[76px_1fr] md:grid-cols-[82px_1fr] gap-0">
                <div className="order-2 sm:order-1 border-t sm:border-t-0 sm:border-r border-black/5 p-2">
                  <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[470px] scrollbar-thin-hide pb-1 sm:pb-0">
                    {Array.isArray(productData.images) &&
                      productData.images.length > 0 ? (
                      productData.images.map((img, idx) => {
                        const imageUrl = getMediaUrl(img, backendUrl);
                        const isActive = selectedImage === imageUrl;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImage(imageUrl)}
                            className={`group relative shrink-0 w-14 h-14 sm:w-full sm:h-[68px] md:h-[74px] rounded-[12px] sm:rounded-[14px] overflow-hidden transition-all duration-300 ${isActive
                              ? "ring-2 ring-black scale-[1.02]"
                              : "ring-1 ring-black/10 hover:ring-black/30"
                              }`}
                          >
                            <img
                              src={imageUrl}
                              alt={`preview-${idx}`}
                              className="absolute inset-0 w-full h-full object-cover bg-white transition-transform duration-300 group-hover:scale-105"
                            />
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-gray-400 font-bold uppercase px-2 py-4">
                        No images
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-1 sm:order-2 p-0">
                  <div className="group relative w-full aspect-square overflow-hidden bg-white">
                    {productData.onSale && Number(productData.salePercent) > 0 && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 bg-red-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2.5 sm:px-3 py-1.5 rounded-full shadow-lg">
                        {productData.salePercent}% Off
                      </div>
                    )}

                    {previewVideoUrl ? (
                      <video
                        src={previewVideoUrl}
                        muted
                        loop
                        autoPlay
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover bg-white"
                      />
                    ) : selectedImage ? (
                      <img
                        src={selectedImage}
                        alt={productData.name}
                        className="absolute inset-0 w-full h-full object-cover bg-white transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">
                          No Image
                        </p>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-[18px] sm:rounded-[22px] shadow-[0_10px_28px_rgba(0,0,0,0.05)] p-3.5 sm:p-5 xl:p-6">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] sm:tracking-[0.28em] text-gray-500">
                  Streetwear Archive
                </p>
                <h1 className="mt-2 text-[22px] leading-[1.05] sm:text-2xl md:text-3xl xl:text-4xl font-black italic uppercase tracking-tight text-[#0A0D17]">
                  {productData.name}
                </h1>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-[0.16em]">
                  {productData.category || "Product"}
                </span>

                <span className="px-3 py-1.5 rounded-full border border-black/10 bg-[#F5F5F2] text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
                  Color: {displayColor}
                </span>

                {productData.fitType && (
                  <span className="px-3 py-1.5 rounded-full border border-black/10 bg-[#F5F5F2] text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
                    Fit: {productData.fitType}
                  </span>
                )}

                {productData.onSale && Number(productData.salePercent) > 0 && (
                  <span className="px-3 py-1.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.16em]">
                    {productData.salePercent}% Off
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-[15px] sm:text-base ${star <= Math.round(Number(averageRating))
                        ? "text-yellow-400"
                        : "text-gray-300"
                        }`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <span className="text-sm font-black text-[#0A0D17]">
                  {averageRating}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("reviews");
                    setTimeout(() => {
                      const section = document.getElementById("reviews-section");
                      if (section) {
                        section.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 100);
                  }}
                  className="text-[13px] sm:text-sm font-semibold text-gray-500 underline underline-offset-4 hover:text-black"
                >
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </button>
              </div>

              {isLoggedIn ? (
                <div className="mt-4 rounded-[18px] border border-black/8 bg-[#FAFAF8] p-3.5 sm:p-4">
                  {productData.onSale && Number(productData.salePercent) > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs sm:text-sm md:text-base font-black text-gray-400 line-through italic leading-none">
                        {currency}
                        {Number(productData.price || 0).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[28px] sm:text-3xl md:text-4xl font-black italic text-red-600 leading-none break-words">
                          {currency}
                          {finalPrice}
                        </p>
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase rounded">
                          {Number(productData.salePercent)}% OFF
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[28px] sm:text-3xl md:text-4xl font-black italic text-[#0A0D17] leading-none break-words">
                      {currency}
                      {Number(productData.price || 0).toFixed(2)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-[18px] border border-black/8 bg-[#FAFAF8] p-3.5 sm:p-4">
                  <p className="text-sm font-black uppercase tracking-[0.14em] italic text-gray-400">
                    Login to see price
                  </p>
                </div>
              )}

              {colorVariants.length > 1 && (
                <div className="mt-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500 mb-2.5">
                    Available Colors
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    {colorVariants.map((variant) => (
                      <button
                        key={variant._id}
                        type="button"
                        onClick={() => navigate(`/product/${variant._id}`)}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${String(variant._id) === String(productData._id)
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white hover:border-black"
                          }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: variant.colorHex || "#d1d5db" }}
                        ></span>
                        <span className="text-[11px] font-black uppercase tracking-[0.08em]">
                          {variant.color || "Default"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="mb-2.5 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
                    Select Size
                  </p>

                  {user?.preferences?.preferredSize && (
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                      Preferred: {String(user.preferences.preferredSize).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto scrollbar-thin-hide pb-1">
                  {availableSizes.map((s) => {
                    const isOut = normalizedStock[s] <= 0;
                    const isPreferred =
                      String(user?.preferences?.preferredSize || "").toUpperCase() === s;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => !isOut && setSize(s)}
                        disabled={isOut}
                        className={`relative shrink-0 min-w-[50px] sm:min-w-[54px] px-3 py-2.5 rounded-xl border text-[13px] sm:text-sm font-black uppercase tracking-[0.08em] transition-all ${size === s
                          ? "bg-black text-white border-black"
                          : "bg-white border-black/10 text-[#0A0D17]"
                          } ${isOut ? "opacity-30 cursor-not-allowed" : "hover:border-black"}`}
                      >
                        {s}
                        {isPreferred && !isOut && (
                          <span
                            className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.08em] ${size === s
                              ? "bg-white text-black"
                              : "bg-black text-white"
                              }`}
                          >
                            Pref
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {productData?.sizeChartImage && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-[16px] border border-black/10 bg-[#FAFAF8] px-3.5 sm:px-4 py-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                      Size Chart
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Open guide for exact measurements
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSizeChart(true)}
                    className="shrink-0 rounded-full bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:opacity-90 transition"
                  >
                    View
                  </button>
                </div>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
                    Quantity
                  </p>

                  {size && (
                    <p className="text-[11px] sm:text-xs font-semibold text-gray-500 text-right">
                      Stock for {size}: {selectedStock}
                    </p>
                  )}
                </div>

                <div className="inline-flex items-center rounded-xl overflow-hidden border border-black/10 bg-[#F6F6F3]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                    className="w-10 h-10 sm:w-11 sm:h-11 text-lg font-black text-[#0A0D17] hover:bg-black hover:text-white transition"
                  >
                    −
                  </button>

                  <span className="min-w-[42px] sm:min-w-[44px] h-10 sm:h-11 px-2 flex items-center justify-center text-sm font-black text-[#0A0D17] bg-white border-x border-black/10">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (!size) {
                        toast.error("Please select a size first");
                        return;
                      }
                      if (selectedStock <= 0) {
                        toast.error(`Size ${size} is out of stock`);
                        return;
                      }
                      setQuantity((q) => (q < selectedStock ? q + 1 : q));
                    }}
                    className="w-10 h-10 sm:w-11 sm:h-11 text-lg font-black text-[#0A0D17] hover:bg-black hover:text-white transition"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="mt-5 rounded-[20px] border border-black/10 bg-gradient-to-b from-[#FAFAF8] to-[#F3F3F0] p-4 sm:p-5 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    ref={addToCartBtnRef}
                    onClick={handleAddToCart}
                    disabled={isProductOutOfStock}
                    className={`h-11 rounded-xl font-black uppercase tracking-[0.14em] transition text-sm ${isProductOutOfStock
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:translate-y-[-1px] shadow-lg"
                      }`}
                  >
                    {isProductOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isProductOutOfStock}
                    className={`h-11 rounded-xl border-2 font-black uppercase tracking-[0.14em] transition text-sm ${isProductOutOfStock
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-black bg-white text-black hover:bg-black hover:text-white"
                      }`}
                  >
                    {isProductOutOfStock ? "Unavailable" : "Buy Now"}
                  </button>
                </div>

                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleTryItOn}
                    className="h-11 rounded-xl bg-black text-white font-black uppercase tracking-[0.14em] hover:opacity-95 transition text-sm"
                  >
                    Try It On
                  </button>

                  <button
                    type="button"
                    onClick={handleShow3D}
                    className={`h-11 rounded-xl border-2 font-black uppercase tracking-[0.14em] transition text-sm ${has3DModel
                      ? "border-black bg-white text-black hover:bg-black hover:text-white"
                      : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    Show 3D
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            id="reviews-section"
            className="mt-6 sm:mt-8 bg-white border border-black/10 rounded-[18px] sm:rounded-[22px] shadow-[0_10px_28px_rgba(0,0,0,0.05)] p-3.5 sm:p-5"
          >
            <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-3 mb-4 sm:mb-5 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("description")}
                  className={`px-3 py-2 rounded-full text-[11px] sm:text-sm font-black uppercase tracking-[0.08em] transition ${activeTab === "description"
                    ? "bg-black text-white"
                    : "bg-[#F5F5F2] text-gray-500 hover:text-black"
                    }`}
                >
                  Description
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("branches")}
                  className={`px-3 py-2 rounded-full text-[11px] sm:text-sm font-black uppercase tracking-[0.08em] transition ${activeTab === "branches"
                    ? "bg-black text-white"
                    : "bg-[#F5F5F2] text-gray-500 hover:text-black"
                    }`}
                >
                  Branches
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`px-3 py-2 rounded-full text-[11px] sm:text-sm font-black uppercase tracking-[0.08em] transition ${activeTab === "reviews"
                    ? "bg-black text-white"
                    : "bg-[#F5F5F2] text-gray-500 hover:text-black"
                    }`}
                >
                  Reviews ({reviews.length})
                </button>
              </div>
            </div>

            {activeTab === "description" && (
              <div className="text-gray-600 leading-7 text-sm sm:text-base">
                <p>{productData.description || "No description available."}</p>
              </div>
            )}

            {activeTab === "branches" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-semibold">
                  Check which Saint Clothing branch currently has this exact
                  product available.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {availableBranches.length > 0 ? (
                    availableBranches.map((item) => (
                      <div
                        key={item.branch}
                        className="border border-black/10 rounded-2xl p-4 bg-[#FAFAF8]"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <h3 className="text-base font-black uppercase text-[#0A0D17]">
                            {item.branchName}
                          </h3>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] ${item.available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            {item.available ? "Available" : "Not Available"}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600">
                          Branch Code:{" "}
                          <span className="font-bold uppercase">{item.branch}</span>
                        </p>

                        <p className="text-sm text-gray-600 mt-1">
                          Stock for this product:{" "}
                          <span className="font-bold">{item.totalStock}</span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 font-semibold">
                      No branch data available.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <ReviewSection
                productId={productData._id}
                reviews={reviews}
                backendUrl={backendUrl}
                token={token}
                user={user}
                canReview={canReview}
                onReviewAdded={loadProduct}
              />
            )}
          </div>
          <div className="mt-6 sm:mt-8">
            <RelatedProducts
              category={productData.category}
              currentProductId={productData._id}
            />
          </div>
          {styleRecommendations.length > 0 && (
            <div className="mt-6 sm:mt-8 bg-white border border-black/10 rounded-[18px] sm:rounded-[22px] shadow-[0_10px_28px_rgba(0,0,0,0.05)] p-3.5 sm:p-5 md:p-6">
              <div className="text-center mb-5 sm:mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                  Saint Styling
                </p>
                <h2 className="mt-2 text-lg sm:text-xl md:text-2xl font-black uppercase text-[#0A0D17]">
                  Complete the Look
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Pieces that match this product best
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
                {styleRecommendations.map((item) => (
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
                    previewVideo={item.previewVideo}
                    autoPlayPreview={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSizeChart && productData?.sizeChartImage && (
        <div className="fixed inset-0 z-[85]">
          <button
            type="button"
            aria-label="Close size chart panel"
            onClick={() => setShowSizeChart(false)}
            className="absolute inset-0 w-full h-full bg-black/35 backdrop-blur-[2px]"
          />

          <div className="absolute top-0 right-0 h-full w-full sm:max-w-[430px] bg-white border-l border-black/10 shadow-[-18px_0_60px_rgba(0,0,0,0.16)] [animation:slidePanelIn_.22s_ease] flex flex-col">
            <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-4 border-b border-black/10 bg-[#F8F8F5]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                  Size Chart
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Check measurements before ordering
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="w-10 h-10 rounded-full border border-black/10 bg-white text-sm font-black text-black hover:bg-black hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-[18px] border border-black/10 bg-[#FAFAF8]">
                <img
                  src={getMediaUrl(productData.sizeChartImage, backendUrl)}
                  alt="Size chart"
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="mt-4 rounded-[18px] border border-black/10 bg-[#FCFCFA] p-4">
                <span className="inline-flex items-center rounded-full bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                  Fit Guide
                </span>
                <p className="mt-3 text-sm text-gray-600 leading-6">
                  Compare your body measurements with the chart for a better fit.
                  If you want a looser streetwear look, choose one size up from
                  your regular fit.
                </p>
              </div>
            </div>

            <div className="border-t border-black/10 p-4 bg-white">
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="w-full h-11 rounded-xl bg-black text-white font-black uppercase tracking-[0.14em] hover:opacity-90 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {tryOnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-3xl bg-[#0D0D0D] text-white rounded-[20px] shadow-[0_35px_120px_rgba(0,0,0,0.55)] overflow-hidden border border-white/10">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#111111] to-[#1A1A1A]">
              <div>
                <p className="text-base font-black uppercase tracking-[0.12em]">
                  Try It On
                </p>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.26em] mt-1">
                  Mobile app required
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTryOnModalOpen(false)}
                className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-4 items-stretch">
                <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-base font-black uppercase tracking-[0.08em] text-white">
                      Download the app first
                    </p>
                    <p className="text-sm text-white/60 leading-6 mt-2">
                      Scan the QR code or open the link on your phone to continue
                      using Try It On.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <a
                      href="https://your-app-download-link.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white text-black text-sm font-black uppercase tracking-[0.1em]"
                    >
                      Download App
                    </a>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm font-black uppercase tracking-[0.1em]"
                    >
                      App Link
                    </button>
                  </div>
                </div>

                <div className="rounded-[16px] border border-white/10 bg-[#111111] p-3">
                  <div className="w-full h-[180px] rounded-[12px] bg-[#181818] border border-white/10 overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">
                          QR Placeholder
                        </p>
                        <p className="text-xs text-white/35 mt-2">
                          Put your QR here
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {show3DModalOpen && (
        <div className="fixed inset-0 z-[80] bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[#090909] to-[#111111]" />

          <div className="relative z-10 h-full w-full flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-md">
              <div>
                <p className="text-white text-lg md:text-xl font-black uppercase tracking-[0.14em]">
                  3D Product View
                </p>
                <p className="text-white/45 text-[10px] md:text-xs font-bold uppercase tracking-[0.28em] mt-1">
                  Drag to rotate • Scroll to zoom
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShow3DModalOpen(false)}
                className="w-10 h-10 rounded-full border border-white/15 bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] overflow-hidden">
              <div className="relative flex items-center justify-center p-3 sm:p-4 md:p-8">
                <div className="absolute top-3 left-3 md:top-6 md:left-6 flex flex-wrap gap-2 z-20 max-w-[calc(100%-24px)] md:max-w-none">
                  <button
                    type="button"
                    onClick={zoomInModel}
                    className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-white text-[11px] sm:text-xs font-black uppercase tracking-[0.12em] hover:bg-white/15 transition"
                  >
                    Zoom In
                  </button>

                  <button
                    type="button"
                    onClick={zoomOutModel}
                    className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-white text-[11px] sm:text-xs font-black uppercase tracking-[0.12em] hover:bg-white/15 transition"
                  >
                    Zoom Out
                  </button>

                  <button
                    type="button"
                    onClick={resetModelView}
                    className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-white text-[11px] sm:text-xs font-black uppercase tracking-[0.12em] hover:bg-white/15 transition"
                  >
                    Reset
                  </button>

                  {isModelViewerFile && (
                    <button
                      type="button"
                      onClick={toggleAutoRotate}
                      className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-white text-[11px] sm:text-xs font-black uppercase tracking-[0.12em] hover:bg-white/15 transition"
                    >
                      {isAutoRotating ? "Stop Rotate" : "Auto Rotate"}
                    </button>
                  )}
                </div>

                <div className="w-full h-[48vh] sm:h-[58vh] lg:h-[70vh] max-h-[680px] rounded-[22px] sm:rounded-[28px] border border-white/10 bg-[#111111] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                  {has3DModel ? (
                    isVideoFile ? (
                      <video
                        src={previewFileUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : isModelViewerFile ? (
                      <model-viewer
                        ref={modelViewerRef}
                        src={previewFileUrl}
                        alt={productData.name}
                        camera-controls
                        auto-rotate
                        shadow-intensity="1"
                        exposure="1"
                        interaction-prompt="auto"
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#0b0b0b",
                        }}
                      />
                    ) : productData.images?.[0] ? (
                      <img
                        src={getMediaUrl(productData.images[0], backendUrl)}
                        alt={productData.name}
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-center p-6">
                        <div>
                          <p className="text-white text-lg font-black uppercase tracking-[0.12em]">
                            Preview Not Supported
                          </p>
                          <p className="text-white/45 text-sm mt-2">
                            This file type cannot be previewed in the 3D viewer yet.
                          </p>
                        </div>
                      </div>
                    )
                  ) : productData.images?.[0] ? (
                    <img
                      src={getMediaUrl(productData.images[0], backendUrl)}
                      alt={productData.name}
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-center p-6">
                      <div>
                        <p className="text-white text-lg font-black uppercase tracking-[0.12em]">
                          3D Preview Area
                        </p>
                        <p className="text-white/45 text-sm mt-2">
                          Put your GLB, GLTF, video, or other supported preview file here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t lg:border-t-0 lg:border-l border-white/10 bg-white/[0.03] backdrop-blur-md p-4 md:p-6 overflow-y-auto">
                <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.28em]">
                  Saint Clothing
                </p>

                <h3 className="mt-2 text-white text-2xl font-black uppercase leading-tight">
                  {productData.name}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-[0.16em]">
                    {productData.category || "Product"}
                  </span>

                  <span className="px-3 py-1.5 rounded-full border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-[0.16em]">
                    Color: {displayColor}
                  </span>

                  {has3DModel && (
                    <span className="px-3 py-1.5 rounded-full border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-[0.16em]">
                      3D Ready
                    </span>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-white text-sm font-black uppercase tracking-[0.12em]">
                      Controls
                    </p>
                    <p className="text-white/60 text-sm mt-2 leading-6">
                      Drag to rotate the model. Use your mouse wheel or touchpad
                      to zoom in and out. Use the buttons on the left for faster control.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-white text-sm font-black uppercase tracking-[0.12em]">
                      File Type
                    </p>
                    <p className="text-white/60 text-sm mt-2 leading-6">
                      {isModelViewerFile
                        ? "Interactive 3D model"
                        : isVideoFile
                          ? "Video preview"
                          : "Image fallback preview"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-white text-sm font-black uppercase tracking-[0.12em]">
                      Quick Actions
                    </p>

                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="h-11 rounded-xl bg-white text-black font-black uppercase tracking-[0.12em] hover:opacity-90 transition"
                      >
                        Add to Cart
                      </button>

                      <button
                        type="button"
                        onClick={() => setShow3DModalOpen(false)}
                        className="h-11 rounded-xl border border-white/15 text-white font-black uppercase tracking-[0.12em] hover:bg-white/5 transition"
                      >
                        Back to Product
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Product;