import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

const PREVIEW_BACKGROUNDS = [
  { name: "Black", color: "#050505" },
  { name: "Charcoal", color: "#181818" },
  { name: "Cream", color: "#f2eee7" },
  { name: "White", color: "#ffffff" }
];

const SKIN_TONES = [
  { type: "I", label: "Very Fair", color: "#F6D8C8", hue: 0, brightness: 1.12 },
  { type: "II", label: "Fair", color: "#EFC0A4", hue: -4, brightness: 1.04 },
  { type: "III", label: "Medium", color: "#C6865A", hue: -8, brightness: .98 },
  { type: "IV", label: "Olive", color: "#A86F45", hue: -10, brightness: .92 },
  { type: "V", label: "Brown", color: "#7A4A2E", hue: -15, brightness: .76 },
  { type: "VI", label: "Deep", color: "#4A2A1A", hue: -18, brightness: .62 }
];

const PRODUCTS_PER_PAGE = 1;

const MANNEQUIN = {
  width: 400,
  height: 530,
  frameWidth: 430,
  frameHeight: 690,
  topAnchor: 105,
  bottomAnchor: 310
};

const FIT_PRESETS = {
  default: {
    top: { x: 0, y: 0, scale: 1, width: 270, height: 235 },
    bottom: { x: 0, y: 0, scale: 1, width: 245, height: 205 }
  },
  tshirt: { top: { x: 0, y: -40, scale: 1.1, width: 270, height: 300 } },
  "t-shirt": { top: { x: 0, y: 0, scale: 1, width: 270, height: 235 } },
  tee: { top: { x: 0, y: 0, scale: 1.1, width: 270, height: 295 } },
  "long sleeve": { top: { x: 0, y: -40, scale: 1.3, width: 340, height: 255 } },
  "crop jersey": { top: { x: 0, y: 10, scale: 1, width: 265, height: 210 } },
  jersey: { top: { x: 0, y: 5, scale: 1, width: 275, height: 225 } },
  jorts: { bottom: { x: 0, y: 0, scale: 1, width: 245, height: 205 } },
  "mesh short": { bottom: { x: 0, y: 0, scale: 1, width: 245, height: 205 } },
  "mesh shorts": { bottom: { x: 0, y: -100, scale: 1.1, width: 245, height: 290 } },
  shorts: { bottom: { x: 0, y: 0, scale: 1, width: 245, height: 205 } },
  pants: { bottom: { x: 0, y: 0, scale: 1, width: 260, height: 335 } },
  jeans: { bottom: { x: 0, y: 0, scale: 1, width: 260, height: 335 } }
};

const normalize = value => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim().toLowerCase();
  if (typeof value === "object") {
    const candidate = value.name || value.category || value.title || value.label || value.slug || value._id || "";
    return String(candidate).trim().toLowerCase();
  }
  return "";
};

const getCategoryName = item => {
  if (!item) return "";
  if (typeof item.category === "object" && item.category) {
    return item.category.name || item.category.title || item.category.label || item.category.slug || item.categoryName || "";
  }
  return item.category || item.categoryName || "";
};

const normalizeSection = value => {
  const section = normalize(value);
  if (!section) return "";
  if (section === "top" || section === "tops") return "top";
  if (section === "bottom" || section === "bottoms") return "bottom";
  if (section.includes("upper")) return "top";
  if (section.includes("lower")) return "bottom";
  if (section.includes("shirt") || section.includes("tshirt") || section.includes("t-shirt") || section.includes("tee") || section.includes("jersey") || section.includes("sleeve")) return "top";
  if (section.includes("short") || section.includes("jort") || section.includes("pant") || section.includes("jean")) return "bottom";
  return "";
};

const extractImage = value => {
  if (!value) return "";
  if (Array.isArray(value)) {
    for (const image of value) {
      const result = extractImage(image);
      if (result) return result;
    }
    return "";
  }
  if (typeof value === "object") return extractImage(value.secure_url || value.secureUrl || value.url || value.image || value.src || value.path || value.location || "");
  if (typeof value === "string") return value.trim();
  return "";
};

const getProductImage = item => {
  if (!item) return "/placeholder.png";
  const outfitImage = extractImage(item.outfitImage);
  if (outfitImage) return outfitImage;
  const outfitImages = extractImage(item.outfitImages);
  if (outfitImages) return outfitImages;
  const images = extractImage(item.images);
  if (images) return images;
  const image = extractImage(item.image);
  if (image) return image;
  const thumbnail = extractImage(item.thumbnail);
  if (thumbnail) return thumbnail;
  return "/placeholder.png";
};

const getFinalPrice = item => {
  const price = Number(item?.price || 0);
  const salePercent = Number(item?.salePercent || 0);
  if (item?.onSale && salePercent > 0) return Math.max(price - (price * salePercent) / 100, 0);
  return price;
};

const getCategoryPreset = (category, section) => {
  const normalized = normalize(category);
  if (FIT_PRESETS[normalized]?.[section]) return FIT_PRESETS[normalized][section];
  if ((normalized.includes("tshirt") || normalized.includes("t-shirt") || normalized.includes("tee")) && section === "top") return FIT_PRESETS.tshirt.top;
  if (normalized.includes("long sleeve") && section === "top") return FIT_PRESETS["long sleeve"].top;
  if (normalized.includes("crop") && section === "top") return FIT_PRESETS["crop jersey"].top;
  if (normalized.includes("jersey") && section === "top") return FIT_PRESETS.jersey.top;
  if (normalized.includes("jort") && section === "bottom") return FIT_PRESETS.jorts.bottom;
  if (normalized.includes("mesh") && section === "bottom") return FIT_PRESETS["mesh shorts"].bottom;
  if (normalized.includes("short") && section === "bottom") return FIT_PRESETS.shorts.bottom;
  if (normalized.includes("pant") && section === "bottom") return FIT_PRESETS.pants.bottom;
  if (normalized.includes("jean") && section === "bottom") return FIT_PRESETS.jeans.bottom;
  return FIT_PRESETS.default[section];
};

const getFitConfig = (item, section) => {
  const categoryPreset = getCategoryPreset(getCategoryName(item), section);
  return { x: categoryPreset.x, y: categoryPreset.y, scale: categoryPreset.scale, width: categoryPreset.width, height: categoryPreset.height };
};

const getProductSizes = product => {
  if (!product) return [];

  if (Array.isArray(product.sizes)) {
    const sizes = product.sizes.map(size => {
      if (typeof size === "string") return size.toUpperCase();
      if (typeof size === "object") return String(size.size || size.name || size.label || "").toUpperCase();
      return "";
    }).filter(Boolean);
    if (sizes.length) return sizes;
  }

  if (product.stock && typeof product.stock === "object") {
    const sizes = Object.keys(product.stock).map(size => String(size).toUpperCase());
    if (sizes.length) return sizes;
  }

  return ["S", "M", "L", "XL", "2XL", "3XL"];
};

const imageUrlToBase64 = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load image: ${response.status}`);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (!result) {
        reject(new Error("Unable to convert image."));
        return;
      }

      const [meta, data] = result.split(",");
      const mimeType = meta?.match(/data:(.*);base64/)?.[1] || blob.type || "image/jpeg";
      resolve({ mimeType, data });
    };

    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(blob);
  });
};

const scorePair = (top, bottom) => {
  let score = 0;
  if (!top || !bottom) return score;

  const topCategory = normalize(getCategoryName(top));
  const bottomCategory = normalize(getCategoryName(bottom));

  if (Array.isArray(bottom.matchWith) && bottom.matchWith.some(value => normalize(value) === topCategory)) score += 10;
  if (Array.isArray(top.matchWith) && top.matchWith.some(value => normalize(value) === bottomCategory)) score += 10;
  if (top.styleVibe && bottom.styleVibe && normalize(top.styleVibe) === normalize(bottom.styleVibe)) score += 6;
  if (top.bestseller) score += 3;
  if (bottom.bestseller) score += 3;
  if (top.newArrival) score += 4;
  if (bottom.newArrival) score += 4;
  if (top.onSale) score += 1;
  if (bottom.onSale) score += 1;

  return score;
};

const StyleBuilder = () => {
  const {
    products,
    currency,
    categoryOptions = [],
    backendUrl,
    token,
    productsLoading = false,
    productsError = "",
    addToCart
  } = useContext(ShopContext);

  const [mode, setMode] = useState("manual");
  const [category, setCategory] = useState("All");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [topPage, setTopPage] = useState(1);
  const [bottomPage, setBottomPage] = useState(1);
  const [positions, setPositions] = useState({
    top: { x: 0, y: 0, scale: 1 },
    bottom: { x: 0, y: 0, scale: 1 }
  });
  const [selectedSizes, setSelectedSizes] = useState({ top: "", bottom: "" });
  const [skinTone, setSkinTone] = useState(SKIN_TONES[3]);
  const [previewBg, setPreviewBg] = useState(PREVIEW_BACKGROUNDS[0].color);
  const [zoom, setZoom] = useState(1);
  const [activeAdjustment, setActiveAdjustment] = useState("top");
  const [categoryMeta, setCategoryMeta] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const autoGenerateTimerRef = useRef(null);
  const generationRequestIdRef = useRef(0);
  const analysisTimerRef = useRef(null);
  const analysisRequestIdRef = useRef(0);
  const lastAnalysisSignatureRef = useRef("");
  const cartLockRef = useRef(false);

  const getAuthConfig = () => {
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
  };

  useEffect(() => {
    const loadCategories = async () => {
      if (!backendUrl) return;

      try {
        const response = await axios.get(`${backendUrl}/api/category/list`, { timeout: 20000 });

        if (response.data?.success) {
          const categories = Array.isArray(response.data.categories) ? response.data.categories : [];
          setCategoryMeta(categories);
          console.log("[STYLE BUILDER] Categories loaded:", categories.length);
        }
      } catch (error) {
        console.error("[STYLE BUILDER] Category load error:", error.response?.data || error.message);
      }
    };

    loadCategories();
  }, [backendUrl]);

  const getProductSection = product => {
    if (!product) return "other";

    const directSection = normalizeSection(product.section || product.productSection || product.outfitSection);
    if (directSection) return directSection;

    if (typeof product.category === "object" && product.category) {
      const objectSection = normalizeSection(product.category.section);
      if (objectSection) return objectSection;
    }

    const productCategory = normalize(getCategoryName(product));
    const productCategoryId = typeof product.category === "object" && product.category ? normalize(product.category._id) : normalize(product.category);

    const match = categoryMeta.find(cat => {
      const catName = normalize(cat?.name);
      const catId = normalize(cat?._id);
      return (catName && catName === productCategory) || (catId && catId === productCategoryId) || (catId && catId === productCategory);
    });

    const metadataSection = normalizeSection(match?.section);
    if (metadataSection) return metadataSection;

    const searchable = [
      productCategory,
      normalize(product.categoryName),
      normalize(product.type),
      normalize(product.productType),
      normalize(product.name)
    ].filter(Boolean).join(" ");

    if (searchable.includes("tshirt") || searchable.includes("t-shirt") || searchable.includes("tee") || searchable.includes("shirt") || searchable.includes("jersey") || searchable.includes("long sleeve") || searchable.includes("longsleeve") || searchable.includes("crop")) return "top";
    if (searchable.includes("mesh short") || searchable.includes("mesh shorts") || searchable.includes("short") || searchable.includes("jort") || searchable.includes("pants") || searchable.includes("pant") || searchable.includes("jeans") || searchable.includes("jean")) return "bottom";

    return "other";
  };

  const cleanProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(item => item && !item.isDeleted);
  }, [products]);

  const CATEGORIES = useMemo(() => {
    const backendCategoryNames = categoryMeta.map(item => item?.name).filter(Boolean);
    const productCategoryNames = cleanProducts.map(item => getCategoryName(item)).filter(Boolean);

    return ["All", ...Array.from(new Set([
      ...categoryOptions.filter(Boolean),
      ...backendCategoryNames,
      ...productCategoryNames
    ]))];
  }, [categoryOptions, categoryMeta, cleanProducts]);

  const filteredProducts = useMemo(() => {
    if (category === "All") return cleanProducts;

    const selectedCategory = normalize(category);

    return cleanProducts.filter(item => {
      const itemCategory = normalize(getCategoryName(item));
      const itemCategoryId = typeof item.category === "object" && item.category ? normalize(item.category._id) : "";
      return itemCategory === selectedCategory || itemCategoryId === selectedCategory;
    });
  }, [cleanProducts, category]);

  const topOptions = useMemo(() => filteredProducts.filter(item => getProductSection(item) === "top"), [filteredProducts, categoryMeta]);
  const bottomOptions = useMemo(() => filteredProducts.filter(item => getProductSection(item) === "bottom"), [filteredProducts, categoryMeta]);

  useEffect(() => {
    if (productsLoading) return;

    const otherProducts = cleanProducts.filter(item => getProductSection(item) === "other");

    console.log("[STYLE BUILDER] Total products:", cleanProducts.length);
    console.log("[STYLE BUILDER] Top products:", topOptions.length);
    console.log("[STYLE BUILDER] Bottom products:", bottomOptions.length);

    if (otherProducts.length) {
      console.log("[STYLE BUILDER] Unclassified products:", otherProducts.map(item => ({
        name: item.name,
        category: item.category,
        categoryName: item.categoryName,
        section: item.section
      })));
    }
  }, [cleanProducts, topOptions, bottomOptions, categoryMeta, productsLoading]);

  const topTotalPages = Math.max(1, Math.ceil(topOptions.length / PRODUCTS_PER_PAGE));
  const bottomTotalPages = Math.max(1, Math.ceil(bottomOptions.length / PRODUCTS_PER_PAGE));

  const paginatedTopOptions = useMemo(() => {
    const start = (topPage - 1) * PRODUCTS_PER_PAGE;
    return topOptions.slice(start, start + PRODUCTS_PER_PAGE);
  }, [topOptions, topPage]);

  const paginatedBottomOptions = useMemo(() => {
    const start = (bottomPage - 1) * PRODUCTS_PER_PAGE;
    return bottomOptions.slice(start, start + PRODUCTS_PER_PAGE);
  }, [bottomOptions, bottomPage]);

  useEffect(() => {
    setTopPage(1);
    setBottomPage(1);
  }, [category]);

  useEffect(() => {
    setTopPage(page => Math.min(page, topTotalPages));
  }, [topTotalPages]);

  useEffect(() => {
    setBottomPage(page => Math.min(page, bottomTotalPages));
  }, [bottomTotalPages]);

  const selectedTop = selectedProducts.find(item => getProductSection(item) === "top");
  const selectedBottom = selectedProducts.find(item => getProductSection(item) === "bottom");
  const totalPrice = selectedProducts.reduce((sum, item) => sum + getFinalPrice(item), 0);

  const topSizes = useMemo(() => getProductSizes(selectedTop), [selectedTop]);
  const bottomSizes = useMemo(() => getProductSizes(selectedBottom), [selectedBottom]);

  useEffect(() => {
    setSelectedSizes(prev => ({ ...prev, top: selectedTop && topSizes.includes(prev.top) ? prev.top : "" }));
  }, [selectedTop?._id]);

  useEffect(() => {
    setSelectedSizes(prev => ({ ...prev, bottom: selectedBottom && bottomSizes.includes(prev.bottom) ? prev.bottom : "" }));
  }, [selectedBottom?._id]);

  const resetPositions = () => {
    setPositions({
      top: { x: 0, y: 0, scale: 1 },
      bottom: { x: 0, y: 0, scale: 1 }
    });
    setZoom(1);
  };

  const getPositionFor = (item, section) => {
    const preset = getFitConfig(item, section);
    const manual = positions[section] || { x: 0, y: 0, scale: 1 };

    return {
      x: preset.x + manual.x,
      y: preset.y + manual.y,
      scale: preset.scale * manual.scale,
      width: preset.width,
      height: preset.height
    };
  };

  const startDrag = (event, slot) => {
    if (mode !== "manual" || generatedImage) return;

    event.preventDefault();
    event.stopPropagation();
    setActiveAdjustment(slot);

    const pointer = event.touches?.[0] || event;
    const startX = pointer.clientX;
    const startY = pointer.clientY;
    const startPosition = { x: positions[slot]?.x || 0, y: positions[slot]?.y || 0 };

    const move = moveEvent => {
      moveEvent.preventDefault();

      const movePointer = moveEvent.touches?.[0] || moveEvent;
      const deltaX = movePointer.clientX - startX;
      const deltaY = movePointer.clientY - startY;

      setPositions(prev => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          x: startPosition.x + deltaX,
          y: startPosition.y + deltaY
        }
      }));
    };

    const stop = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", stop);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", stop);
  };

  const updateScale = (slot, value) => {
    setPositions(prev => ({
      ...prev,
      [slot]: { ...prev[slot], scale: Number(value) }
    }));
  };

  const addToFit = product => {
    if (!product?._id || mode !== "manual") return;

    setGeneratedImage("");
    setImageError("");
    setCartMessage("");

    const section = getProductSection(product);

    if (section !== "top" && section !== "bottom") {
      setImageError(`${product.name || "Product"} could not be classified as a top or bottom.`);
      return;
    }

    setActiveAdjustment(section);

    setSelectedProducts(prev => {
      const exists = prev.some(item => String(item._id) === String(product._id));

      if (exists) return prev.filter(item => String(item._id) !== String(product._id));

      return [
        ...prev.filter(item => getProductSection(item) !== section),
        product
      ];
    });

    setPositions(prev => ({ ...prev, [section]: { x: 0, y: 0, scale: 1 } }));
    setSelectedSizes(prev => ({ ...prev, [section]: "" }));
  };

  const clearFit = () => {
    if (selectedProducts.length === 0) return;

    analysisRequestIdRef.current += 1;
    lastAnalysisSignatureRef.current = "";

    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }

    setSelectedProducts([]);
    setSelectedSizes({ top: "", bottom: "" });
    resetPositions();
    setAiSuggestion("");
    setAiError("");
    setAiLoading(false);
    setGeneratedImage("");
    setImageError("");
    setCartMessage("");
  };

  const generateAutomaticFit = () => {
    setGeneratedImage("");
    setImageError("");
    setCartMessage("");

    if (topOptions.length === 0 && bottomOptions.length === 0) {
      setImageError("No compatible products are available for Style Builder.");
      return;
    }

    if (topOptions.length > 0 && bottomOptions.length > 0) {
      const rankedPairs = [];

      topOptions.forEach(top => {
        bottomOptions.forEach(bottom => {
          rankedPairs.push({ top, bottom, score: scorePair(top, bottom) });
        });
      });

      rankedPairs.sort((a, b) => b.score - a.score);
      const selectedPair = rankedPairs[0];

      setSelectedProducts([selectedPair.top, selectedPair.bottom].filter(Boolean));
      setSelectedSizes({ top: "", bottom: "" });
      resetPositions();
      return;
    }

    if (topOptions.length > 0) {
      setSelectedProducts([topOptions[0]]);
      setSelectedSizes({ top: "", bottom: "" });
      resetPositions();
      return;
    }

    setSelectedProducts([bottomOptions[0]]);
    setSelectedSizes({ top: "", bottom: "" });
    resetPositions();
  };

  const handleModeChange = nextMode => {
    setMode(nextMode);
    setGeneratedImage("");
    setImageError("");
    setCartMessage("");

    if (nextMode === "automatic") generateAutomaticFit();
  };

  const generateAISuggestion = async (top, bottom, signature) => {
    if (!top && !bottom) return;
    if (!token || !backendUrl) return;

    const requestId = Date.now();
    analysisRequestIdRef.current = requestId;

    try {
      setAiLoading(true);
      setAiError("");

      const response = await axios.post(
        `${backendUrl}/api/ai/suggest-fit`,
        {
          top: top ? {
            name: top.name,
            category: getCategoryName(top),
            color: top.color,
            styleVibe: top.styleVibe,
            styleTags: top.styleTags,
            price: top.price
          } : null,
          bottom: bottom ? {
            name: bottom.name,
            category: getCategoryName(bottom),
            color: bottom.color,
            styleVibe: bottom.styleVibe,
            styleTags: bottom.styleTags,
            price: bottom.price
          } : null,
          style: "modern streetwear"
        },
        getAuthConfig()
      );

      if (analysisRequestIdRef.current !== requestId) return;

      if (response.data?.success) {
        setAiSuggestion(response.data.suggestion || "");
        if (signature) lastAnalysisSignatureRef.current = signature;
      } else {
        setAiError(response.data?.message || "AI style analysis failed.");
      }
    } catch (error) {
      if (analysisRequestIdRef.current !== requestId) return;

      console.error("AI Style Analysis Error:", error.response?.data || error);

      if (error.response?.status === 401) {
        setAiError("Your login session is invalid or expired. Please log in again.");
        return;
      }

      if (error.response?.status === 429) {
        setAiError("AI is temporarily rate-limited. Please wait and try again.");
        return;
      }

      setAiError(error.response?.data?.message || "AI style analysis failed. Please try again.");
    } finally {
      if (analysisRequestIdRef.current === requestId) setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedTop && !selectedBottom) {
      analysisRequestIdRef.current += 1;
      lastAnalysisSignatureRef.current = "";
      setAiSuggestion("");
      setAiError("");
      setAiLoading(false);
      return;
    }

    if (!token || !backendUrl) return;

    const signature = [selectedTop?._id || "", selectedBottom?._id || ""].join("|");
    if (lastAnalysisSignatureRef.current === signature) return;

    if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);

    analysisTimerRef.current = setTimeout(() => {
      generateAISuggestion(selectedTop, selectedBottom, signature);
    }, 450);

    return () => {
      if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);
    };
  }, [selectedTop?._id, selectedBottom?._id, token, backendUrl]);

  const generateAIOutfitImage = async () => {
    if (!selectedTop && !selectedBottom) {
      setImageError("Pick at least one item before generating an outfit.");
      return;
    }

    if (!backendUrl) {
      setImageError("Backend URL is not configured.");
      return;
    }

    if (!token) {
      setImageError("You are not logged in. Please log in before generating an AI outfit.");
      return;
    }

    const requestId = Date.now();
    generationRequestIdRef.current = requestId;

    try {
      setImageLoading(true);
      setImageError("");
      setGeneratedImage("");

      const mannequinBase64 = await imageUrlToBase64(assets.mannequin);
      const topImageUrl = selectedTop ? getProductImage(selectedTop) : "";
      const bottomImageUrl = selectedBottom ? getProductImage(selectedBottom) : "";

      const topImage = selectedTop && topImageUrl !== "/placeholder.png" ? await imageUrlToBase64(topImageUrl) : null;
      const bottomImage = selectedBottom && bottomImageUrl !== "/placeholder.png" ? await imageUrlToBase64(bottomImageUrl) : null;

      const response = await axios.post(
        `${backendUrl}/api/ai/generate-fit-image`,
        {
          mannequin: mannequinBase64,
          skinTone: {
            type: skinTone.type,
            label: skinTone.label,
            color: skinTone.color
          },
          top: selectedTop ? {
            name: selectedTop.name,
            category: getCategoryName(selectedTop),
            color: selectedTop.color,
            styleVibe: selectedTop.styleVibe,
            styleTags: selectedTop.styleTags,
            image: topImage
          } : null,
          bottom: selectedBottom ? {
            name: selectedBottom.name,
            category: getCategoryName(selectedBottom),
            color: selectedBottom.color,
            styleVibe: selectedBottom.styleVibe,
            styleTags: selectedBottom.styleTags,
            image: bottomImage
          } : null,
          style: `Create a realistic full-body Saint Clothing mannequin wearing the selected clothing.

Use the supplied mannequin image as the body, pose, orientation and proportion reference.

FULL BODY REQUIREMENTS:
Show the complete mannequin from the top of the head to the bottom of both feet.
Keep the head, shoulders, arms, hands, torso, legs and feet visible.
Do not crop any part of the mannequin.
Keep the mannequin centered vertically and horizontally.
Preserve the mannequin's straight standing pose.
Preserve the mannequin's original body proportions.
Leave comfortable space around the mannequin.
The complete mannequin should occupy approximately 85 to 90 percent of the image height.

CLOTHING REQUIREMENTS:
${selectedTop && selectedBottom
              ? "Dress the mannequin in both supplied garments: the selected top and selected bottom."
              : selectedTop
                ? "Dress the mannequin only in the supplied selected top."
                : "Dress the mannequin only in the supplied selected bottom."}

Make the clothing look naturally worn by the mannequin.
Preserve the supplied product design as closely as possible.
Preserve the product colors.
Preserve logos and graphics.
Preserve patterns and artwork.
Preserve garment proportions.
Preserve sleeve length.
Preserve garment length.
Preserve the silhouette and visible product details.
Do not substitute the supplied products with similar clothing.
Do not add extra clothing.
Do not create floating garments.

MANNEQUIN REQUIREMENTS:
The mannequin skin tone should match ${skinTone.label} / ${skinTone.color}.
Keep the mannequin appearance consistent with the supplied mannequin reference.

BACKGROUND REQUIREMENTS:
Use a clean professional fashion e-commerce studio background.
Keep the background simple, neutral and uncluttered.
The mannequin and outfit must remain the main focus.
Use soft professional studio lighting.
Keep the entire mannequin clearly separated from the background.
Do not add scenery or distracting environmental objects.

No text.
No watermark.
No extra people.
No additional mannequins.
No extra accessories.
No cropped body parts.`
        },
        {
          ...getAuthConfig(),
          timeout: 120000
        }
      );

      if (generationRequestIdRef.current !== requestId) return;

      if (response.data?.success && response.data?.image) {
        setGeneratedImage(response.data.image);
      } else {
        setImageError(response.data?.message || response.data?.details?.message || "AI outfit image generation failed.");
      }
    } catch (error) {
      if (generationRequestIdRef.current !== requestId) return;

      console.error("AI Outfit Image Error:", error.response?.data || error);

      const backendMessage = String(error.response?.data?.message || "");
      const backendDetails = String(error.response?.data?.details?.message || "");
      const fullMessage = `${backendMessage} ${backendDetails}`.toLowerCase();

      if (error.response?.status === 401) {
        setImageError("Your login session is invalid or expired. Please log in again.");
        return;
      }

      if (error.response?.status === 429 || fullMessage.includes("429") || fullMessage.includes("quota") || fullMessage.includes("resource_exhausted") || fullMessage.includes("retrydelay")) {
        setImageError("Gemini image generation is temporarily rate-limited. Please wait and try again.");
        return;
      }

      if (fullMessage.includes("not found") || fullMessage.includes("not supported")) {
        setImageError("Gemini image model is not available for this API key.");
        return;
      }

      if (error.code === "ECONNABORTED") {
        setImageError("AI image generation timed out. Please try again.");
        return;
      }

      setImageError(backendMessage || backendDetails || "AI outfit image generation failed. Please check Render logs.");
    } finally {
      if (generationRequestIdRef.current === requestId) setImageLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "automatic") return;
    if (!selectedTop && !selectedBottom) return;
    if (!token) return;

    if (autoGenerateTimerRef.current) clearTimeout(autoGenerateTimerRef.current);

    autoGenerateTimerRef.current = setTimeout(() => {
      generateAIOutfitImage();
    }, 900);

    return () => {
      if (autoGenerateTimerRef.current) clearTimeout(autoGenerateTimerRef.current);
    };
  }, [mode, selectedTop?._id, selectedBottom?._id, skinTone.type, token, backendUrl]);

  const downloadOutfit = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = "saint-generated-outfit.jpg";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleAddToCart = async () => {
    if (cartLockRef.current || cartLoading) return;

    if (!selectedTop && !selectedBottom) {
      setCartMessage("Select at least one product first.");
      return;
    }

    if (selectedTop && !selectedSizes.top) {
      setCartMessage("Select a size for your top.");
      return;
    }

    if (selectedBottom && !selectedSizes.bottom) {
      setCartMessage("Select a size for your bottom.");
      return;
    }

    if (typeof addToCart !== "function") {
      setCartMessage("Cart is currently unavailable.");
      return;
    }

    const items = [];

    if (selectedTop) {
      items.push({
        section: "top",
        product: selectedTop,
        size: String(selectedSizes.top || "").trim().toUpperCase(),
        quantity: 1
      });
    }

    if (selectedBottom) {
      items.push({
        section: "bottom",
        product: selectedBottom,
        size: String(selectedSizes.bottom || "").trim().toUpperCase(),
        quantity: 1
      });
    }

    cartLockRef.current = true;
    setCartLoading(true);
    setCartMessage("");

    try {
      let added = 0;

      for (const item of items) {
        if (!item.product?._id) {
          setCartMessage(`${item.section === "top" ? "Top" : "Bottom"} product information is unavailable.`);
          return;
        }

        const result = await addToCart(item.product._id, item.size, item.quantity);

        if (result === false) {
          if (added > 0) {
            setCartMessage(`${added} item${added === 1 ? "" : "s"} added, but ${item.product.name || item.section} could not be added.`);
          } else {
            setCartMessage(`${item.product.name || "Product"} could not be added to your cart.`);
          }
          return;
        }

        added += 1;
      }

      if (added === 2) setCartMessage("Complete fit added to your cart.");
      else if (added === 1) setCartMessage("Selected item added to your cart.");
    } catch (error) {
      console.error("[STYLE BUILDER] Add to cart error:", error?.response?.data || error);
      setCartMessage(error?.response?.data?.message || error?.message || "Unable to add this fit to your cart.");
    } finally {
      cartLockRef.current = false;
      setCartLoading(false);
    }
  };

  const renderProductCard = (item, active) => {
    const section = getProductSection(item);
    const image = getProductImage(item);

    return (
      <button
        key={item._id}
        type="button"
        onClick={() => addToFit(item)}
        disabled={mode === "automatic"}
        className={`group relative w-full overflow-hidden rounded-[5px] border text-left transition-all duration-300 ${active ? "border-white/30 bg-white text-black" : "border-white/10 bg-[#101010] text-white hover:border-white/30 hover:bg-[#151515]"} ${mode === "automatic" ? "cursor-default opacity-70" : ""}`}
      >
        <div className={`relative h-[230px] overflow-hidden ${active ? "bg-[#f4f1eb]" : "bg-[#181818]"}`}>
          <img
            src={image}
            alt={item.name}
            draggable={false}
            className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-[1.04]"
            onError={event => {
              if (!event.currentTarget.dataset.fallback) {
                event.currentTarget.dataset.fallback = "true";
                event.currentTarget.src = "/placeholder.png";
              }
            }}
          />

          <div className={`absolute left-2.5 top-2.5 rounded-[4px] px-2.5 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] backdrop-blur-md ${active ? "bg-black text-white" : "bg-black/65 text-white/75"}`}>
            {section}
          </div>

          {active && (
            <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-[4px] bg-black text-[10px] text-white shadow-lg">
              ✓
            </div>
          )}
        </div>

        <div className="p-3">
          <p className={`line-clamp-1 text-[10px] font-black uppercase tracking-[0.03em] ${active ? "text-black" : "text-white"}`}>
            {item.name}
          </p>

          <p className={`mt-1 line-clamp-1 text-[7px] font-bold uppercase tracking-[0.14em] ${active ? "text-black/35" : "text-white/35"}`}>
            {getCategoryName(item)}
          </p>

          <div className={`mt-3 flex items-center justify-between border-t pt-2.5 ${active ? "border-black/10" : "border-white/10"}`}>
            <p className={`text-[11px] font-black ${active ? "text-black" : "text-white"}`}>
              {currency}{getFinalPrice(item).toLocaleString()}
            </p>

            <div className={`flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[0.16em] ${active ? "text-black/50" : "text-white/45"}`}>
              <span>{active ? "Selected" : "Select"}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-[4px] ${active ? "bg-black text-white" : "border border-white/15 text-white"}`}>
                {active ? "✓" : "+"}
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const renderSizeSelector = (section, product, sizes) => {
    if (!product) return null;

    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="max-w-[150px] truncate text-[8px] font-black uppercase tracking-[0.12em] text-white/70">
            {section === "top" ? "Top" : "Bottom"} Size
          </p>

          <span className="text-[8px] font-black text-white">
            {selectedSizes[section] || "—"}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {sizes.map(size => (
            <button
              key={`${section}-${size}`}
              type="button"
              onClick={() => setSelectedSizes(prev => ({ ...prev, [section]: String(size).toUpperCase() }))}
              className={`min-w-[31px] rounded-[4px] border px-1.5 py-1.5 text-[7px] font-black transition ${selectedSizes[section] === size ? "border-white bg-white text-black" : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/50 hover:text-white"}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const topFit = selectedTop ? getPositionFor(selectedTop, "top") : null;
  const bottomFit = selectedBottom ? getPositionFor(selectedBottom, "bottom") : null;
  const selectedTopImage = selectedTop ? getProductImage(selectedTop) : "";
  const selectedBottomImage = selectedBottom ? getProductImage(selectedBottom) : "";
  const hasSelectedProducts = selectedProducts.length > 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black p-3 text-white md:p-4">
      <style>{`
@keyframes saintFade{from{opacity:0}to{opacity:1}}
@keyframes saintPulse{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes saintSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.saint-fade{animation:saintFade .28s ease both}
.saint-pulse{animation:saintPulse 1.4s ease-in-out infinite}
.saint-spin{animation:saintSpin .9s linear infinite}
.saint-scroll::-webkit-scrollbar{width:4px}
.saint-scroll::-webkit-scrollbar-track{background:transparent}
.saint-scroll::-webkit-scrollbar-thumb{background:#555;border-radius:5px}
.saint-no-scrollbar::-webkit-scrollbar{display:none}
.saint-no-scrollbar{scrollbar-width:none}
input[type="range"]{accent-color:#fff}
`}</style>

      <div className="mx-auto max-w-[1750px]">
        <header className="mb-3 flex h-[52px] items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-white/15 bg-white text-black">
              ✦
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase leading-none tracking-[-0.05em] text-white md:text-2xl">
                  Style Builder
                </h1>

                <span className="rounded-[4px] border border-white/15 px-2 py-1 text-[6px] font-black uppercase tracking-[0.2em] text-white/50">
                  Studio
                </span>
              </div>

              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">
                Saint Clothing / Build Your Fit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">Current Fit</p>
              <p className="mt-0.5 text-[11px] font-black text-white">{selectedProducts.length}/2 Pieces</p>
            </div>

            <div className="flex w-[235px] rounded-[5px] border border-white/10 bg-[#0d0d0d] p-1">
              <button
                type="button"
                onClick={() => handleModeChange("manual")}
                className={`flex-1 rounded-[4px] py-2 text-[8px] font-black uppercase tracking-[0.15em] transition ${mode === "manual" ? "bg-white text-black" : "text-white/45 hover:text-white"}`}
              >
                Manual
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("automatic")}
                className={`flex-1 rounded-[4px] py-2 text-[8px] font-black uppercase tracking-[0.15em] transition ${mode === "automatic" ? "bg-white text-black" : "text-white/45 hover:text-white"}`}
              >
                AI Assist
              </button>
            </div>
          </div>
        </header>

        <div className="grid h-[640px] grid-cols-1 gap-3 xl:grid-cols-[245px_minmax(440px,1fr)_350px]">
          <aside className="saint-no-scrollbar h-full overflow-y-auto rounded-[5px] border border-white/10 bg-[#0c0c0c] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.25em] text-white/40">01 / Customize</p>
                <h2 className="mt-1 text-[14px] font-black uppercase tracking-[-0.02em]">Fit Controls</h2>
              </div>
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">Collection</p>

              <div className="relative">
                <select
                  value={category}
                  onChange={event => setCategory(event.target.value)}
                  className="w-full appearance-none rounded-[5px] border border-white/10 bg-[#151515] px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.08em] text-white outline-none transition focus:border-white/40"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-white/40">
                  ⌄
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/45">Skin Tone</p>
                <span className="text-[7px] font-black uppercase tracking-widest text-white/35">Type {skinTone.type}</span>
              </div>

              <div className="mt-3 grid grid-cols-6 gap-1.5">
                {SKIN_TONES.map(tone => (
                  <button
                    key={tone.type}
                    type="button"
                    title={tone.label}
                    onClick={() => {
                      setSkinTone(tone);
                      setGeneratedImage("");
                      setImageError("");
                    }}
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`h-6 w-6 rounded-full border transition ${skinTone.type === tone.type ? "border-white ring-1 ring-white ring-offset-2 ring-offset-[#0c0c0c]" : "border-white/10 group-hover:border-white/50"}`}
                      style={{ backgroundColor: tone.color }}
                    />
                    <span className={`text-[6px] font-black ${skinTone.type === tone.type ? "text-white" : "text-white/35"}`}>
                      {tone.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
                Studio Background
              </p>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {PREVIEW_BACKGROUNDS.map(bg => (
                  <button
                    key={bg.name}
                    type="button"
                    onClick={() => setPreviewBg(bg.color)}
                    className={`relative h-9 rounded-[5px] border transition ${previewBg === bg.color ? "border-white" : "border-white/10 hover:border-white/40"}`}
                    style={{ backgroundColor: bg.color }}
                  >
                    {previewBg === bg.color && (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black mix-blend-difference">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
                  Garment Fit
                </p>

                <button
                  type="button"
                  onClick={resetPositions}
                  className="text-[7px] font-black uppercase tracking-[0.15em] text-white/40 transition hover:text-white"
                >
                  Reset
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1 rounded-[5px] bg-white/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => setActiveAdjustment("top")}
                  disabled={!selectedTop}
                  className={`rounded-[4px] py-2 text-[7px] font-black uppercase tracking-[0.14em] transition ${activeAdjustment === "top" ? "bg-white text-black" : "text-white/40"} disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  Top
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAdjustment("bottom")}
                  disabled={!selectedBottom}
                  className={`rounded-[4px] py-2 text-[7px] font-black uppercase tracking-[0.14em] transition ${activeAdjustment === "bottom" ? "bg-white text-black" : "text-white/40"} disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  Bottom
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-widest text-white/40">
                    Scale
                  </span>

                  <span className="text-[8px] font-black text-white">
                    {Number(positions[activeAdjustment]?.scale || 1).toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.01"
                  value={positions[activeAdjustment]?.scale || 1}
                  onChange={event => updateScale(activeAdjustment, event.target.value)}
                  disabled={mode !== "manual"}
                  className="mt-2 w-full"
                />

                <p className="mt-2 text-[7px] leading-[1.5] text-white/40">
                  Drag the garment directly on the model to fine-tune its placement.
                </p>
              </div>
            </div>
          </aside>

          <main className="relative h-full min-w-0">
            <section
              className="relative h-full overflow-hidden rounded-[5px] border border-white/10"
              style={{ background: previewBg }}
            >
              <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{ background: "radial-gradient(circle at center,transparent 0%,rgba(0,0,0,.06) 55%,rgba(0,0,0,.35) 100%)" }}
              />

              <div className="absolute left-4 top-4 z-[100]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white mix-blend-difference" />
                  <p className="text-[7px] font-black uppercase tracking-[0.25em] text-white mix-blend-difference">
                    Live Studio
                  </p>
                </div>

                <p className="mt-1 text-[7px] font-bold uppercase tracking-[0.15em] text-white/50 mix-blend-difference">
                  {generatedImage ? "AI Render" : "Interactive Fit"}
                </p>
              </div>

              <div className="absolute right-4 top-4 z-[100] rounded-[5px] border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                <p className="text-[7px] font-black uppercase tracking-[0.16em] text-white/80">
                  {selectedProducts.length === 0 ? "No Look Selected" : `${selectedProducts.length} Piece Look`}
                </p>
              </div>

              {imageLoading && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
                  <div className="flex min-w-[220px] flex-col items-center rounded-[5px] border border-white/15 bg-black/90 px-7 py-5 text-center text-white shadow-2xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-white/20">
                      <span className="saint-spin text-lg">✦</span>
                    </div>

                    <p className="mt-3 text-[9px] font-black uppercase tracking-[0.2em]">
                      Rendering Look
                    </p>

                    <p className="saint-pulse mt-1.5 text-[7px] font-bold uppercase tracking-[0.12em] text-white/50">
                      Saint AI Studio
                    </p>
                  </div>
                </div>
              )}

              {imageError && (
                <div className="absolute bottom-[68px] left-4 right-4 z-[150] rounded-[5px] border border-red-500/30 bg-black/95 px-3 py-2 text-[9px] font-bold text-[#ff9b9b] backdrop-blur">
                  {imageError}
                </div>
              )}

              {generatedImage ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                  <div
                    className="relative shrink-0"
                    style={{
                      width: `${MANNEQUIN.frameWidth}px`,
                      height: `${MANNEQUIN.frameHeight}px`,
                      transform: `scale(${zoom * .78})`,
                      transformOrigin: "center center"
                    }}
                  >
                    <img
                      src={generatedImage}
                      alt="AI Generated Outfit"
                      draggable={false}
                      className="saint-fade pointer-events-none absolute left-1/2 top-1/2 select-none object-contain"
                      style={{
                        width: `${MANNEQUIN.width}px`,
                        height: `${MANNEQUIN.height}px`,
                        transform: "translate(-50%,-50%)"
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                  <div
                    className="relative shrink-0"
                    style={{
                      width: `${MANNEQUIN.frameWidth}px`,
                      height: `${MANNEQUIN.frameHeight}px`,
                      transform: `scale(${zoom * .78})`,
                      transformOrigin: "center center"
                    }}
                  >
                    <img
                      src={assets.mannequin}
                      alt="Mannequin"
                      draggable={false}
                      className="pointer-events-none absolute left-1/2 top-1/2 z-10 select-none object-contain"
                      style={{
                        width: `${MANNEQUIN.width}px`,
                        height: `${MANNEQUIN.height}px`,
                        transform: "translate(-50%,-50%)",
                        filter: `sepia(.28) saturate(1.08) hue-rotate(${skinTone.hue}deg) brightness(${skinTone.brightness})`
                      }}
                    />

                    {selectedBottom && bottomFit && (
                      <div
                        onMouseDown={event => startDrag(event, "bottom")}
                        onTouchStart={event => startDrag(event, "bottom")}
                        className="absolute left-1/2 z-20 flex cursor-grab touch-none select-none items-center justify-center active:cursor-grabbing"
                        style={{
                          top: `${MANNEQUIN.bottomAnchor}px`,
                          width: `${bottomFit.width}px`,
                          height: `${bottomFit.height}px`,
                          transform: `translateX(-50%) translate(${bottomFit.x}px,${bottomFit.y}px) scale(${bottomFit.scale})`,
                          transformOrigin: "center top"
                        }}
                      >
                        <img
                          key={`${selectedBottom._id}-${selectedBottomImage}`}
                          src={selectedBottomImage}
                          alt={selectedBottom.name}
                          draggable={false}
                          className="saint-fade pointer-events-none h-full w-full select-none object-contain"
                          onError={event => {
                            if (!event.currentTarget.dataset.fallback) {
                              event.currentTarget.dataset.fallback = "true";
                              event.currentTarget.src = "/placeholder.png";
                            }
                          }}
                        />
                      </div>
                    )}

                    {selectedTop && topFit && (
                      <div
                        onMouseDown={event => startDrag(event, "top")}
                        onTouchStart={event => startDrag(event, "top")}
                        className="absolute left-1/2 z-30 flex cursor-grab touch-none select-none items-center justify-center active:cursor-grabbing"
                        style={{
                          top: `${MANNEQUIN.topAnchor}px`,
                          width: `${topFit.width}px`,
                          height: `${topFit.height}px`,
                          transform: `translateX(-50%) translate(${topFit.x}px,${topFit.y}px) scale(${topFit.scale})`,
                          transformOrigin: "center top"
                        }}
                      >
                        <img
                          key={`${selectedTop._id}-${selectedTopImage}`}
                          src={selectedTopImage}
                          alt={selectedTop.name}
                          draggable={false}
                          className="saint-fade pointer-events-none h-full w-full select-none object-contain"
                          onError={event => {
                            if (!event.currentTarget.dataset.fallback) {
                              event.currentTarget.dataset.fallback = "true";
                              event.currentTarget.src = "/placeholder.png";
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 z-[120] flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateAIOutfitImage}
                  disabled={imageLoading || !hasSelectedProducts}
                  className="flex h-10 min-w-[155px] items-center justify-center gap-2 rounded-[5px] bg-white px-4 text-[8px] font-black uppercase tracking-[0.13em] text-black shadow-[0_8px_24px_rgba(0,0,0,.4)] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span>{imageLoading ? "◌" : "✦"}</span>
                  <span>{imageLoading ? "Rendering..." : "Generate Look"}</span>
                </button>

                <button
                  type="button"
                  onClick={clearFit}
                  disabled={!hasSelectedProducts || imageLoading}
                  className="flex h-10 min-w-[105px] items-center justify-center rounded-[5px] border border-white/20 bg-black/80 px-4 text-[8px] font-black uppercase tracking-[0.13em] text-white shadow-[0_8px_24px_rgba(0,0,0,.4)] backdrop-blur-xl transition hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-black/55 disabled:text-white/25"
                >
                  Clear Fit
                </button>
              </div>

              <div className="absolute bottom-4 right-4 z-[120] flex items-center rounded-[5px] border border-white/15 bg-black/75 p-1 text-white shadow-xl backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setZoom(value => Math.max(.8, value - .05))}
                  className="flex h-7 w-7 items-center justify-center rounded-[4px] text-sm font-black transition hover:bg-white hover:text-black"
                >
                  −
                </button>

                <span className="min-w-[48px] text-center text-[7px] font-black uppercase tracking-widest">
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoom(value => Math.min(1.2, value + .05))}
                  className="flex h-7 w-7 items-center justify-center rounded-[4px] text-sm font-black transition hover:bg-white hover:text-black"
                >
                  +
                </button>

                <div className="mx-1 h-4 w-px bg-white/15" />

                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded-[4px] px-2.5 py-2 text-[7px] font-black uppercase tracking-widest text-white/60 transition hover:text-white"
                >
                  Reset
                </button>
              </div>
            </section>
          </main>

          <aside className="saint-no-scrollbar h-full overflow-y-auto rounded-[5px] border border-white/10 bg-[#0c0c0c] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.25em] text-white/40">
                  02 / Wardrobe
                </p>

                <h2 className="mt-1 text-[14px] font-black uppercase tracking-[-0.02em]">
                  Build The Look
                </h2>
              </div>

              <span className="rounded-[4px] border border-white/10 px-2 py-1 text-[6px] font-black uppercase tracking-widest text-white/40">
                {cleanProducts.length} Items
              </span>
            </div>

            {productsLoading && (
              <div className="mt-3 rounded-[5px] border border-white/10 bg-white/[0.03] p-3 text-center text-[7px] font-black uppercase tracking-widest text-white/40">
                Loading Collection...
              </div>
            )}

            {!productsLoading && productsError && (
              <div className="mt-3 rounded-[5px] border border-red-500/20 bg-red-500/5 p-3 text-[8px] font-bold text-red-300">
                {productsError}
              </div>
            )}

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">
                    Upper
                  </p>

                  <p className="mt-0.5 text-[10px] font-black uppercase text-white">
                    Select Top
                  </p>
                </div>

                {selectedTop && (
                  <button
                    type="button"
                    onClick={() => addToFit(selectedTop)}
                    className="text-[6px] font-black uppercase tracking-[0.15em] text-white/40 hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </div>

              {!productsLoading && topOptions.length === 0 ? (
                <div className="rounded-[5px] border border-dashed border-white/10 p-5 text-center text-[7px] font-bold uppercase tracking-widest text-white/30">
                  No Tops Found
                </div>
              ) : paginatedTopOptions.map(item => renderProductCard(item, selectedTop?._id === item._id))}

              {topOptions.length > 1 && (
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTopPage(page => Math.max(1, page - 1))}
                    disabled={topPage === 1}
                    className="rounded-[4px] border border-white/10 py-1.5 text-[6px] font-black uppercase tracking-widest text-white/50 transition hover:border-white/40 hover:text-white disabled:opacity-20"
                  >
                    ← Prev
                  </button>

                  <span className="text-[6px] font-black text-white/40">
                    {topPage}/{topTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setTopPage(page => Math.min(topTotalPages, page + 1))}
                    disabled={topPage === topTotalPages}
                    className="rounded-[4px] border border-white/10 py-1.5 text-[6px] font-black uppercase tracking-widest text-white/50 transition hover:border-white/40 hover:text-white disabled:opacity-20"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">
                    Lower
                  </p>

                  <p className="mt-0.5 text-[10px] font-black uppercase text-white">
                    Select Bottom
                  </p>
                </div>

                {selectedBottom && (
                  <button
                    type="button"
                    onClick={() => addToFit(selectedBottom)}
                    className="text-[6px] font-black uppercase tracking-[0.15em] text-white/40 hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </div>

              {!productsLoading && bottomOptions.length === 0 ? (
                <div className="rounded-[5px] border border-dashed border-white/10 p-5 text-center text-[7px] font-bold uppercase tracking-widest text-white/30">
                  No Bottoms Found
                </div>
              ) : paginatedBottomOptions.map(item => renderProductCard(item, selectedBottom?._id === item._id))}

              {bottomOptions.length > 1 && (
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBottomPage(page => Math.max(1, page - 1))}
                    disabled={bottomPage === 1}
                    className="rounded-[4px] border border-white/10 py-1.5 text-[6px] font-black uppercase tracking-widest text-white/50 transition hover:border-white/40 hover:text-white disabled:opacity-20"
                  >
                    ← Prev
                  </button>

                  <span className="text-[6px] font-black text-white/40">
                    {bottomPage}/{bottomTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setBottomPage(page => Math.min(bottomTotalPages, page + 1))}
                    disabled={bottomPage === bottomTotalPages}
                    className="rounded-[4px] border border-white/10 py-1.5 text-[6px] font-black uppercase tracking-widest text-white/50 transition hover:border-white/40 hover:text-white disabled:opacity-20"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">
                    03 / Cart
                  </p>

                  <p className="mt-0.5 text-[10px] font-black uppercase">
                    Complete The Fit
                  </p>
                </div>

                <p className="text-[13px] font-black">
                  {currency}{totalPrice.toLocaleString()}
                </p>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="mt-3 rounded-[5px] border border-dashed border-white/10 px-3 py-4 text-center">
                  <p className="text-[7px] font-black uppercase tracking-[0.15em] text-white/30">
                    Select clothing to build your cart
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {renderSizeSelector("top", selectedTop, topSizes)}
                  {renderSizeSelector("bottom", selectedBottom, bottomSizes)}
                </div>
              )}

              {cartMessage && (
                <div className={`mt-3 rounded-[5px] border px-3 py-2 text-[8px] font-bold leading-relaxed ${cartMessage.toLowerCase().includes("added") ? "border-green-400/20 bg-green-400/[0.06] text-green-200" : "border-white/10 bg-white/[0.04] text-white/70"}`}>
                  {cartMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={cartLoading || selectedProducts.length === 0}
                className="group mt-3 flex w-full items-center justify-between rounded-[5px] bg-white px-4 py-3 text-black transition hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-25"
              >
                <div className="text-left">
                  <p className="text-[6px] font-black uppercase tracking-[0.2em] text-black/50">
                    {selectedProducts.length === 2 ? "Complete Look" : "Selected Piece"}
                  </p>

                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.08em]">
                    {cartLoading ? "Adding..." : "Add To Cart"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black">
                    {currency}{totalPrice.toLocaleString()}
                  </span>

                  <span className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-black text-[11px] text-white">
                    →
                  </span>
                </div>
              </button>

              <p className="mt-2 text-center text-[6px] font-bold uppercase tracking-[0.12em] text-white/30">
                Size and stock are verified before adding to cart
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-3 rounded-[5px] border border-white/10 bg-[#0c0c0c] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.08em] text-white">
                Saint AI Insight
              </h3>

              <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white/35">
                Outfit Analysis
              </p>
            </div>

            {aiLoading && (
              <p className="saint-pulse text-[8px] font-bold uppercase tracking-[0.12em] text-white/45">
                Analyzing...
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            {aiError ? (
              <p className="text-[13px] font-medium leading-[22px] text-[#ff9696]">
                {aiError}
              </p>
            ) : aiSuggestion ? (
              <p className="whitespace-pre-line text-[13px] font-normal leading-[22px] text-white/85">
                {aiSuggestion}
              </p>
            ) : selectedTop || selectedBottom ? (
              <p className="text-[13px] font-normal leading-[22px] text-white/45">
                Analyzing your selected outfit...
              </p>
            ) : (
              <p className="text-[13px] font-normal leading-[22px] text-white/45">
                Select a top, bottom, or complete outfit to see the AI styling insight.
              </p>
            )}
          </div>

          {generatedImage && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={downloadOutfit}
                className="text-[8px] font-black uppercase tracking-[0.12em] text-white/50 transition hover:text-white"
              >
                Save AI Render ↓
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StyleBuilder;