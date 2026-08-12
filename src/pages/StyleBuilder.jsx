import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

/* =========================================================
   STYLE BUILDER CONFIG
========================================================= */

const PREVIEW_BACKGROUNDS = [
  { name: "Black", color: "#050505" },
  { name: "Charcoal", color: "#1b1b1b" },
  { name: "Cream", color: "#f6efe6" },
  { name: "White", color: "#ffffff" },
];

const SKIN_TONES = [
  {
    type: "I",
    label: "Very Fair",
    color: "#F6D8C8",
    hue: 0,
    brightness: 1.12,
  },
  {
    type: "II",
    label: "Fair",
    color: "#EFC0A4",
    hue: -4,
    brightness: 1.04,
  },
  {
    type: "III",
    label: "Medium",
    color: "#C6865A",
    hue: -8,
    brightness: 0.98,
  },
  {
    type: "IV",
    label: "Olive",
    color: "#A86F45",
    hue: -10,
    brightness: 0.92,
  },
  {
    type: "V",
    label: "Brown",
    color: "#7A4A2E",
    hue: -15,
    brightness: 0.76,
  },
  {
    type: "VI",
    label: "Deep",
    color: "#4A2A1A",
    hue: -18,
    brightness: 0.62,
  },
];

const MANNEQUIN_CANVAS = {
  width: 430,
  height: 690,
};

/*
  IMPORTANT:
  Only ONE product is displayed per Top/Bottom section.
*/
const PRODUCTS_PER_PAGE = 1;

const FIT_PRESETS = {
  default: {
    top: {
      x: 0,
      y: 4,
      scale: 0.92,
      width: 315,
      height: 250,
    },
    bottom: {
      x: 0,
      y: 0,
      scale: 0.88,
      width: 300,
      height: 260,
    },
  },

  tshirt: {
    top: {
      x: 0,
      y: 0,
      scale: 0.88,
      width: 320,
      height: 250,
    },
  },

  "long sleeve": {
    top: {
      x: 0,
      y: 2,
      scale: 0.9,
      width: 325,
      height: 255,
    },
  },

  "crop jersey": {
    top: {
      x: 0,
      y: 12,
      scale: 0.86,
      width: 315,
      height: 220,
    },
  },

  jorts: {
    bottom: {
      x: 0,
      y: -2,
      scale: 0.86,
      width: 300,
      height: 245,
    },
  },

  "mesh short": {
    bottom: {
      x: 0,
      y: -4,
      scale: 0.84,
      width: 300,
      height: 245,
    },
  },

  pants: {
    bottom: {
      x: 0,
      y: 4,
      scale: 0.82,
      width: 300,
      height: 355,
    },
  },

  jeans: {
    bottom: {
      x: 0,
      y: 4,
      scale: 0.82,
      width: 300,
      height: 355,
    },
  },
};

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getProductImage = (item) => {
  if (item?.outfitImage) {
    return item.outfitImage;
  }

  if (
    Array.isArray(item?.images) &&
    item.images.length > 0
  ) {
    return item.images[0];
  }

  if (
    Array.isArray(item?.image) &&
    item.image.length > 0
  ) {
    return item.image[0];
  }

  if (typeof item?.images === "string") {
    return item.images;
  }

  if (typeof item?.image === "string") {
    return item.image;
  }

  return "/placeholder.png";
};

const getFinalPrice = (item) => {
  const price = Number(item?.price || 0);
  const salePercent = Number(
    item?.salePercent || 0
  );

  if (
    item?.onSale &&
    salePercent > 0
  ) {
    return Math.max(
      price -
        (price * salePercent) / 100,
      0
    );
  }

  return price;
};

/* =========================================================
   CATEGORY FIT
========================================================= */

const getCategoryPreset = (
  category,
  section
) => {
  const normalized =
    normalize(category);

  if (
    FIT_PRESETS[normalized]?.[section]
  ) {
    return FIT_PRESETS[normalized][
      section
    ];
  }

  if (
    normalized.includes(
      "long sleeve"
    ) &&
    section === "top"
  ) {
    return FIT_PRESETS[
      "long sleeve"
    ].top;
  }

  if (
    normalized.includes("crop") &&
    section === "top"
  ) {
    return FIT_PRESETS[
      "crop jersey"
    ].top;
  }

  if (
    normalized.includes("jorts") &&
    section === "bottom"
  ) {
    return FIT_PRESETS.jorts.bottom;
  }

  if (
    normalized.includes("mesh") &&
    section === "bottom"
  ) {
    return FIT_PRESETS[
      "mesh short"
    ].bottom;
  }

  if (
    normalized.includes("short") &&
    section === "bottom"
  ) {
    return FIT_PRESETS[
      "mesh short"
    ].bottom;
  }

  if (
    normalized.includes("pants") &&
    section === "bottom"
  ) {
    return FIT_PRESETS.pants.bottom;
  }

  if (
    normalized.includes("jean") &&
    section === "bottom"
  ) {
    return FIT_PRESETS.jeans.bottom;
  }

  if (section === "top") {
    return FIT_PRESETS.default.top;
  }

  return FIT_PRESETS.default.bottom;
};

const getFitConfig = (
  item,
  section
) => {
  const categoryPreset =
    getCategoryPreset(
      item?.category,
      section
    );

  const productPosition =
    item?.outfitPosition || {};

  return {
    ...categoryPreset,

    x:
      productPosition.x !==
      undefined
        ? Number(
            productPosition.x
          )
        : categoryPreset.x,

    y:
      productPosition.y !==
      undefined
        ? Number(
            productPosition.y
          )
        : categoryPreset.y,

    scale:
      productPosition.scale !==
      undefined
        ? Number(
            productPosition.scale
          )
        : categoryPreset.scale,
  };
};

/* =========================================================
   AI HELPERS
========================================================= */

const imageUrlToBase64 =
  async (url) => {
    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Failed to load image."
      );
    }

    const blob =
      await response.blob();

    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onloadend = () => {
          const result =
            reader.result;

          if (!result) {
            reject(
              new Error(
                "Unable to convert image."
              )
            );

            return;
          }

          const [
            meta,
            data,
          ] =
            result.split(",");

          const mimeType =
            meta?.match(
              /data:(.*);base64/
            )?.[1] ||
            "image/png";

          resolve({
            mimeType,
            data,
          });
        };

        reader.onerror =
          reject;

        reader.readAsDataURL(
          blob
        );
      }
    );
  };

const scorePair = (
  top,
  bottom
) => {
  let score = 0;

  if (!top || !bottom) {
    return score;
  }

  if (
    top.category &&
    Array.isArray(
      bottom.matchWith
    ) &&
    bottom.matchWith.includes(
      top.category
    )
  ) {
    score += 10;
  }

  if (
    bottom.category &&
    Array.isArray(
      top.matchWith
    ) &&
    top.matchWith.includes(
      bottom.category
    )
  ) {
    score += 10;
  }

  if (
    top.styleVibe &&
    bottom.styleVibe &&
    top.styleVibe ===
      bottom.styleVibe
  ) {
    score += 6;
  }

  if (top.bestseller) {
    score += 3;
  }

  if (bottom.bestseller) {
    score += 3;
  }

  if (top.newArrival) {
    score += 4;
  }

  if (bottom.newArrival) {
    score += 4;
  }

  if (top.onSale) {
    score += 1;
  }

  if (bottom.onSale) {
    score += 1;
  }

  return score;
};

/* =========================================================
   COMPONENT
========================================================= */

const StyleBuilder = () => {
  const {
    products,
    currency,
    categoryOptions = [],
    backendUrl,
    token,
  } = useContext(ShopContext);

  /* =======================================================
     AUTH
  ======================================================= */

  const getAuthConfig = () => {
    if (!token) {
      return {};
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
    };
  };

  /* =======================================================
     MAIN STATE
  ======================================================= */

  const [mode, setMode] =
    useState("manual");

  const [category, setCategory] =
    useState("All");

  const [
    selectedProducts,
    setSelectedProducts,
  ] = useState([]);

  /*
    Only one product is visible
    per section at a time.
  */
  const [topPage, setTopPage] =
    useState(1);

  const [
    bottomPage,
    setBottomPage,
  ] = useState(1);

  const [positions, setPositions] =
    useState({
      top: {
        x: 0,
        y: 0,
        scale: 1,
      },

      bottom: {
        x: 0,
        y: 0,
        scale: 1,
      },
    });

  const [skinTone, setSkinTone] =
    useState(
      SKIN_TONES[3]
    );

  const [
    previewBg,
    setPreviewBg,
  ] = useState(
    PREVIEW_BACKGROUNDS[0]
      .color
  );

  const [zoom, setZoom] =
    useState(1);

  const [
    activeAdjustment,
    setActiveAdjustment,
  ] = useState("top");

  /* =======================================================
     CATEGORY DATA
  ======================================================= */

  const [
    categoryMeta,
    setCategoryMeta,
  ] = useState([]);

  /* =======================================================
     AI STATE
  ======================================================= */

  const [
    aiSuggestion,
    setAiSuggestion,
  ] = useState("");

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiError, setAiError] =
    useState("");

  /* =======================================================
     GENERATED IMAGE
  ======================================================= */

  const [
    generatedImage,
    setGeneratedImage,
  ] = useState("");

  const [
    imageLoading,
    setImageLoading,
  ] = useState(false);

  const [
    imageError,
    setImageError,
  ] = useState("");

  const autoGenerateTimerRef =
    useRef(null);

  const generationRequestIdRef =
    useRef(0);

  /* =======================================================
     LOAD CATEGORY META
  ======================================================= */

  useEffect(() => {
    const loadCategories =
      async () => {
        if (!backendUrl) {
          return;
        }

        try {
          const response =
            await axios.get(
              `${backendUrl}/api/category/list`
            );

          if (
            response.data?.success
          ) {
            setCategoryMeta(
              response.data
                .categories || []
            );
          }
        } catch (error) {
          console.error(
            "Build Fit Category Load Error:",
            error
          );
        }
      };

    loadCategories();
  }, [backendUrl]);

  /* =======================================================
     CATEGORY HELPERS
  ======================================================= */

  const getProductSection = (
    product
  ) => {
    const productCategory =
      normalize(
        product?.category
      );

    const match =
      categoryMeta.find(
        (cat) =>
          normalize(cat.name) ===
          productCategory
      );

    if (match?.section) {
      return normalize(
        match.section
      );
    }

    const categoryName =
      productCategory;

    if (
      categoryName.includes(
        "tshirt"
      ) ||
      categoryName.includes(
        "t-shirt"
      ) ||
      categoryName.includes(
        "shirt"
      ) ||
      categoryName.includes(
        "jersey"
      ) ||
      categoryName.includes(
        "long sleeve"
      )
    ) {
      return "top";
    }

    if (
      categoryName.includes(
        "short"
      ) ||
      categoryName.includes(
        "jort"
      ) ||
      categoryName.includes(
        "pant"
      ) ||
      categoryName.includes(
        "jean"
      )
    ) {
      return "bottom";
    }

    return "other";
  };

  const CATEGORIES = useMemo(
    () => {
      const backendCategoryNames =
        categoryMeta
          .map(
            (item) =>
              item.name
          )
          .filter(Boolean);

      return [
        "All",
        ...Array.from(
          new Set([
            ...categoryOptions.filter(
              Boolean
            ),
            ...backendCategoryNames,
          ])
        ),
      ];
    },
    [
      categoryOptions,
      categoryMeta,
    ]
  );

  const cleanProducts =
    useMemo(() => {
      if (
        !Array.isArray(
          products
        )
      ) {
        return [];
      }

      return products.filter(
        (item) =>
          item &&
          !item.isDeleted
      );
    }, [products]);

  const filteredProducts =
    useMemo(() => {
      if (
        category === "All"
      ) {
        return cleanProducts;
      }

      return cleanProducts.filter(
        (item) =>
          normalize(
            item.category
          ) ===
          normalize(category)
      );
    }, [
      cleanProducts,
      category,
    ]);

  const topOptions =
    useMemo(
      () =>
        filteredProducts.filter(
          (item) =>
            getProductSection(
              item
            ) === "top"
        ),
      [
        filteredProducts,
        categoryMeta,
      ]
    );

  const bottomOptions =
    useMemo(
      () =>
        filteredProducts.filter(
          (item) =>
            getProductSection(
              item
            ) === "bottom"
        ),
      [
        filteredProducts,
        categoryMeta,
      ]
    );

  const topTotalPages =
    Math.max(
      1,
      Math.ceil(
        topOptions.length /
          PRODUCTS_PER_PAGE
      )
    );

  const bottomTotalPages =
    Math.max(
      1,
      Math.ceil(
        bottomOptions.length /
          PRODUCTS_PER_PAGE
      )
    );

  /*
    ONE product only.
  */

  const paginatedTopOptions =
    useMemo(() => {
      const start =
        (topPage - 1) *
        PRODUCTS_PER_PAGE;

      return topOptions.slice(
        start,
        start +
          PRODUCTS_PER_PAGE
      );
    }, [
      topOptions,
      topPage,
    ]);

  const paginatedBottomOptions =
    useMemo(() => {
      const start =
        (bottomPage - 1) *
        PRODUCTS_PER_PAGE;

      return bottomOptions.slice(
        start,
        start +
          PRODUCTS_PER_PAGE
      );
    }, [
      bottomOptions,
      bottomPage,
    ]);

  useEffect(() => {
    setTopPage(1);
    setBottomPage(1);
  }, [category]);

  useEffect(() => {
    setTopPage((page) =>
      Math.min(
        page,
        topTotalPages
      )
    );
  }, [topTotalPages]);

  useEffect(() => {
    setBottomPage((page) =>
      Math.min(
        page,
        bottomTotalPages
      )
    );
  }, [bottomTotalPages]);

  const selectedTop =
    selectedProducts.find(
      (item) =>
        getProductSection(
          item
        ) === "top"
    );

  const selectedBottom =
    selectedProducts.find(
      (item) =>
        getProductSection(
          item
        ) === "bottom"
    );

  const totalPrice =
    selectedProducts.reduce(
      (sum, item) =>
        sum +
        getFinalPrice(item),
      0
    );

  /* =======================================================
     FIT POSITION
  ======================================================= */

  const resetPositions =
    () => {
      setPositions({
        top: {
          x: 0,
          y: 0,
          scale: 1,
        },

        bottom: {
          x: 0,
          y: 0,
          scale: 1,
        },
      });

      setZoom(1);
    };

  const getPositionFor = (
    item,
    section
  ) => {
    const preset =
      getFitConfig(
        item,
        section
      );

    const manual =
      positions[section] || {
        x: 0,
        y: 0,
        scale: 1,
      };

    return {
      x:
        preset.x +
        manual.x,

      y:
        preset.y +
        manual.y,

      scale:
        preset.scale *
        manual.scale,

      width:
        preset.width,

      height:
        preset.height,
    };
  };

  /* =======================================================
     DRAG
  ======================================================= */

  const startDrag = (
    event,
    slot
  ) => {
    if (
      mode !== "manual"
    ) {
      return;
    }

    if (generatedImage) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setActiveAdjustment(
      slot
    );

    const pointer =
      event.touches?.[0] ||
      event;

    const startX =
      pointer.clientX;

    const startY =
      pointer.clientY;

    const startPosition =
      {
        x:
          positions[slot]
            ?.x || 0,

        y:
          positions[slot]
            ?.y || 0,
      };

    const move = (
      moveEvent
    ) => {
      moveEvent.preventDefault();

      const movePointer =
        moveEvent.touches?.[0] ||
        moveEvent;

      const deltaX =
        movePointer.clientX -
        startX;

      const deltaY =
        movePointer.clientY -
        startY;

      setPositions(
        (prev) => ({
          ...prev,

          [slot]: {
            ...prev[slot],

            x:
              startPosition.x +
              deltaX,

            y:
              startPosition.y +
              deltaY,
          },
        })
      );
    };

    const stop = () => {
      document.removeEventListener(
        "mousemove",
        move
      );

      document.removeEventListener(
        "mouseup",
        stop
      );

      document.removeEventListener(
        "touchmove",
        move
      );

      document.removeEventListener(
        "touchend",
        stop
      );
    };

    document.addEventListener(
      "mousemove",
      move
    );

    document.addEventListener(
      "mouseup",
      stop
    );

    document.addEventListener(
      "touchmove",
      move,
      {
        passive: false,
      }
    );

    document.addEventListener(
      "touchend",
      stop
    );
  };

  /* =======================================================
     SCALE
  ======================================================= */

  const updateScale = (
    slot,
    value
  ) => {
    setPositions(
      (prev) => ({
        ...prev,

        [slot]: {
          ...prev[slot],

          scale:
            Number(value),
        },
      })
    );
  };

  /* =======================================================
     SELECT PRODUCT
  ======================================================= */

  const addToFit = (
    product
  ) => {
    if (!product?._id) {
      return;
    }

    if (
      mode !== "manual"
    ) {
      return;
    }

    setAiSuggestion("");
    setAiError("");

    setGeneratedImage("");
    setImageError("");

    const section =
      getProductSection(
        product
      );

    if (
      section !== "top" &&
      section !== "bottom"
    ) {
      return;
    }

    setActiveAdjustment(
      section
    );

    setSelectedProducts(
      (prev) => {
        const exists =
          prev.some(
            (item) =>
              item._id ===
              product._id
          );

        if (exists) {
          return prev.filter(
            (item) =>
              item._id !==
              product._id
          );
        }

        if (
          section === "top"
        ) {
          return [
            ...prev.filter(
              (item) =>
                getProductSection(
                  item
                ) !== "top"
            ),
            product,
          ];
        }

        return [
          ...prev.filter(
            (item) =>
              getProductSection(
                item
              ) !== "bottom"
          ),
          product,
        ];
      }
    );

    setPositions(
      (prev) => ({
        ...prev,

        [section]: {
          x: 0,
          y: 0,
          scale: 1,
        },
      })
    );
  };

  /* =======================================================
     CLEAR
  ======================================================= */

  const clearFit = () => {
    setSelectedProducts(
      []
    );

    resetPositions();

    setAiSuggestion("");
    setAiError("");

    setGeneratedImage("");
    setImageError("");
  };

  /* =======================================================
     AUTOMATIC FIT
  ======================================================= */

  const generateAutomaticFit =
    () => {
      setAiSuggestion("");
      setAiError("");

      setGeneratedImage("");
      setImageError("");

      if (
        topOptions.length ===
          0 &&
        bottomOptions.length ===
          0
      ) {
        return;
      }

      if (
        topOptions.length >
          0 &&
        bottomOptions.length >
          0
      ) {
        const rankedPairs =
          [];

        topOptions.forEach(
          (top) => {
            bottomOptions.forEach(
              (bottom) => {
                rankedPairs.push(
                  {
                    top,
                    bottom,
                    score:
                      scorePair(
                        top,
                        bottom
                      ),
                  }
                );
              }
            );
          }
        );

        rankedPairs.sort(
          (a, b) =>
            b.score -
            a.score
        );

        const selectedPair =
          rankedPairs[0];

        setSelectedProducts(
          [
            selectedPair.top,
            selectedPair.bottom,
          ].filter(Boolean)
        );

        resetPositions();

        return;
      }

      if (
        topOptions.length >
        0
      ) {
        setSelectedProducts([
          topOptions[0],
        ]);

        resetPositions();

        return;
      }

      setSelectedProducts([
        bottomOptions[0],
      ]);

      resetPositions();
    };

  /* =======================================================
     MODE
  ======================================================= */

  const handleModeChange = (
    nextMode
  ) => {
    setMode(nextMode);

    setGeneratedImage("");
    setImageError("");

    if (
      nextMode ===
      "automatic"
    ) {
      generateAutomaticFit();
    }
  };

  /* =======================================================
     AI STYLE SUGGESTION
  ======================================================= */

  const generateAISuggestion =
    async () => {
      try {
        setAiLoading(true);
        setAiError("");
        setAiSuggestion("");

        if (
          !selectedTop &&
          !selectedBottom
        ) {
          setAiError(
            "Pick at least one item before using AI Style Analysis."
          );

          return;
        }

        if (!token) {
          setAiError(
            "You are not logged in. Please log in before using AI Style Analysis."
          );

          return;
        }

        if (!backendUrl) {
          setAiError(
            "Backend URL is not configured."
          );

          return;
        }

        const response =
          await axios.post(
            `${backendUrl}/api/ai/suggest-fit`,
            {
              top: selectedTop
                ? {
                    name:
                      selectedTop.name,

                    category:
                      selectedTop.category,

                    color:
                      selectedTop.color,

                    styleVibe:
                      selectedTop.styleVibe,

                    styleTags:
                      selectedTop.styleTags,

                    price:
                      selectedTop.price,
                  }
                : null,

              bottom:
                selectedBottom
                  ? {
                      name:
                        selectedBottom.name,

                      category:
                        selectedBottom.category,

                      color:
                        selectedBottom.color,

                      styleVibe:
                        selectedBottom.styleVibe,

                      styleTags:
                        selectedBottom.styleTags,

                      price:
                        selectedBottom.price,
                    }
                  : null,

              style:
                "modern streetwear",
            },

            getAuthConfig()
          );

        if (
          response.data?.success
        ) {
          setAiSuggestion(
            response.data
              .suggestion || ""
          );
        } else {
          setAiError(
            response.data
              ?.message ||
              "AI style analysis failed."
          );
        }
      } catch (error) {
        console.error(
          "AI Style Analysis Error:",
          error
        );

        if (
          error.response?.status ===
          401
        ) {
          setAiError(
            "Your login session is invalid or expired. Please log in again."
          );

          return;
        }

        setAiError(
          error.response?.data
            ?.message ||
            "AI style analysis failed. Please try again."
        );
      } finally {
        setAiLoading(false);
      }
    };

  /* =======================================================
     AI OUTFIT IMAGE
  ======================================================= */

  const generateAIOutfitImage =
    async () => {
      if (
        !selectedTop &&
        !selectedBottom
      ) {
        return;
      }

      if (!backendUrl) {
        setImageError(
          "Backend URL is not configured."
        );

        return;
      }

      if (!token) {
        setImageError(
          "You are not logged in. Please log in before generating an AI outfit."
        );

        return;
      }

      const requestId =
        Date.now();

      generationRequestIdRef.current =
        requestId;

      try {
        setImageLoading(true);
        setImageError("");
        setGeneratedImage("");

        const mannequinBase64 =
          await imageUrlToBase64(
            assets.mannequin
          );

        const topImage =
          selectedTop
            ? await imageUrlToBase64(
                getProductImage(
                  selectedTop
                )
              )
            : null;

        const bottomImage =
          selectedBottom
            ? await imageUrlToBase64(
                getProductImage(
                  selectedBottom
                )
              )
            : null;

        const response =
          await axios.post(
            `${backendUrl}/api/ai/generate-fit-image`,
            {
              mannequin:
                mannequinBase64,

              skinTone: {
                type:
                  skinTone.type,

                label:
                  skinTone.label,

                color:
                  skinTone.color,
              },

              top: selectedTop
                ? {
                    name:
                      selectedTop.name,

                    category:
                      selectedTop.category,

                    color:
                      selectedTop.color,

                    styleVibe:
                      selectedTop.styleVibe,

                    styleTags:
                      selectedTop.styleTags,

                    image:
                      topImage,
                  }
                : null,

              bottom:
                selectedBottom
                  ? {
                      name:
                        selectedBottom.name,

                      category:
                        selectedBottom.category,

                      color:
                        selectedBottom.color,

                      styleVibe:
                        selectedBottom.styleVibe,

                      styleTags:
                        selectedBottom.styleTags,

                      image:
                        bottomImage,
                  }
                : null,

              style: `
Generate a realistic full-body Saint Clothing mannequin wearing the selected clothing.

If only a top is provided:
generate only the selected top naturally fitted to the mannequin.

If only a bottom is provided:
generate only the selected bottom naturally fitted to the mannequin.

If both are provided:
generate the complete outfit.

Preserve the actual product design, colors, logos, graphics, proportions and details.

The mannequin skin tone should match:
${skinTone.label} / ${skinTone.color}.

Use a clean black studio background.

Centered full-body fashion catalog photograph.

No text.
No watermark.
No extra clothing.
No additional accessories.
              `,
            },
            getAuthConfig()
          );

        if (
          generationRequestIdRef.current !==
          requestId
        ) {
          return;
        }

        if (
          response.data?.success
        ) {
          setGeneratedImage(
            response.data.image ||
              ""
          );
        } else {
          setImageError(
            response.data
              ?.message ||
              response.data
                ?.details?.message ||
              "AI outfit image generation failed."
          );
        }
      } catch (error) {
        if (
          generationRequestIdRef.current !==
          requestId
        ) {
          return;
        }

        console.error(
          "AI Outfit Image Error:",
          error
        );

        const backendMessage =
          error.response?.data
            ?.message || "";

        const backendDetails =
          error.response?.data
            ?.details?.message ||
          "";

        const fullMessage =
          `${backendMessage} ${backendDetails}`;

        if (
          error.response
            ?.status === 401
        ) {
          setImageError(
            "Your login session is invalid or expired. Please log in again."
          );

          return;
        }

        const isQuotaError =
          fullMessage.includes(
            "429"
          ) ||
          fullMessage
            .toLowerCase()
            .includes(
              "quota"
            ) ||
          fullMessage.includes(
            "RESOURCE_EXHAUSTED"
          );

        const isRetryDelay =
          fullMessage.includes(
            "retryDelay"
          ) ||
          fullMessage
            .toLowerCase()
            .includes(
              "retry"
            );

        const isModelError =
          fullMessage
            .toLowerCase()
            .includes(
              "not found"
            ) ||
          fullMessage
            .toLowerCase()
            .includes(
              "not supported"
            );

        if (
          isQuotaError ||
          isRetryDelay
        ) {
          setImageError(
            "Gemini image generation is temporarily rate-limited. Please wait and try again."
          );

          return;
        }

        if (
          isModelError
        ) {
          setImageError(
            "Gemini image model is not available for this API key."
          );

          return;
        }

        setImageError(
          backendMessage ||
            backendDetails ||
            "AI outfit image generation failed. Please check Render logs."
        );
      } finally {
        if (
          generationRequestIdRef.current ===
          requestId
        ) {
          setImageLoading(false);
        }
      }
    };

  /* =======================================================
     AUTO AI GENERATION
  ======================================================= */

  useEffect(() => {
    if (
      mode !==
      "automatic"
    ) {
      return;
    }

    if (
      !selectedTop &&
      !selectedBottom
    ) {
      return;
    }

    if (!token) {
      return;
    }

    if (
      autoGenerateTimerRef.current
    ) {
      clearTimeout(
        autoGenerateTimerRef.current
      );
    }

    autoGenerateTimerRef.current =
      setTimeout(() => {
        generateAIOutfitImage();
      }, 900);

    return () => {
      if (
        autoGenerateTimerRef.current
      ) {
        clearTimeout(
          autoGenerateTimerRef.current
        );
      }
    };
  }, [
    mode,
    selectedTop?._id,
    selectedBottom?._id,
    skinTone.type,
    token,
    backendUrl,
  ]);

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const downloadOutfit =
    () => {
      if (!generatedImage) {
        return;
      }

      const link =
        document.createElement(
          "a"
        );

      link.href =
        generatedImage;

      link.download =
        "saint-generated-outfit.png";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();
    };

  /* =======================================================
     PRODUCT CARD
  ======================================================= */

  const renderProductCard = (
    item,
    active
  ) => {
    const section =
      getProductSection(item);

    return (
      <button
        key={item._id}
        type="button"
        onClick={() =>
          addToFit(item)
        }
        disabled={
          mode ===
          "automatic"
        }
        className={`group relative w-full overflow-hidden rounded-[8px] border text-left transition-all duration-200 ${
          active
            ? "border-black bg-black text-white"
            : "border-black/10 bg-white hover:border-black/40"
        } ${
          mode ===
          "automatic"
            ? "cursor-default opacity-70"
            : ""
        }`}
      >
        <div
          className={`relative aspect-[1.15] overflow-hidden ${
            active
              ? "bg-white"
              : "bg-[#f4f1eb]"
          }`}
        >
          <img
            src={getProductImage(
              item
            )}
            alt={item.name}
            draggable={false}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
          />

          {active && (
            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black text-[10px] text-white">
              ✓
            </div>
          )}
        </div>

        <div className="p-3">
          <p
            className={`line-clamp-1 text-[10px] font-black uppercase tracking-tight ${
              active
                ? "text-white"
                : "text-black"
            }`}
          >
            {item.name}
          </p>

          <div className="mt-1 flex items-center justify-between">
            <p
              className={`text-[10px] font-semibold ${
                active
                  ? "text-white/60"
                  : "text-black/50"
              }`}
            >
              {currency}
              {getFinalPrice(
                item
              ).toLocaleString()}
            </p>

            <p
              className={`text-[8px] font-black uppercase tracking-widest ${
                active
                  ? "text-white/40"
                  : "text-black/30"
              }`}
            >
              {section}
            </p>
          </div>
        </div>
      </button>
    );
  };

  /* =======================================================
     CURRENT FIT CONFIG
  ======================================================= */

  const topFit =
    selectedTop
      ? getPositionFor(
          selectedTop,
          "top"
        )
      : null;

  const bottomFit =
    selectedBottom
      ? getPositionFor(
          selectedBottom,
          "bottom"
        )
      : null;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f5f3ef] px-3 py-4 md:px-5 lg:px-6">
      <style>
        {`
          @keyframes saintFade {
            from {
              opacity: 0;
              transform: scale(.985);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes saintPulse {
            0%,
            100% {
              opacity: .55;
            }

            50% {
              opacity: 1;
            }
          }

          @keyframes saintSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          .saint-fade {
            animation: saintFade .28s ease both;
          }

          .saint-pulse {
            animation: saintPulse 1.4s ease-in-out infinite;
          }

          .saint-spin {
            animation: saintSpin .9s linear infinite;
          }

          .saint-scroll::-webkit-scrollbar {
            width: 5px;
          }

          .saint-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .saint-scroll::-webkit-scrollbar-thumb {
            background: #c9c9c9;
            border-radius: 999px;
          }

          .saint-no-scrollbar::-webkit-scrollbar {
            display: none;
          }

          .saint-no-scrollbar {
            scrollbar-width: none;
          }

          input[type="range"] {
            accent-color: #111;
          }
        `}
      </style>

      <div className="mx-auto max-w-[1450px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                ✦
              </span>

              <div>
                <h1 className="text-xl font-black uppercase leading-none tracking-[-0.06em] text-black md:text-2xl">
                  Style Builder
                </h1>

                <p className="mt-1 text-[11px] font-medium text-black/50">
                  Build your perfect Saint fit
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full rounded-[8px] border border-black/10 bg-white p-1 sm:w-[250px]">
            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  "manual"
                )
              }
              className={`flex-1 rounded-[6px] py-2.5 text-[10px] font-black uppercase tracking-widest transition ${
                mode ===
                "manual"
                  ? "bg-black text-white"
                  : "text-black/50 hover:text-black"
              }`}
            >
              Manual
            </button>

            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  "automatic"
                )
              }
              className={`flex-1 rounded-[6px] py-2.5 text-[10px] font-black uppercase tracking-widest transition ${
                mode ===
                "automatic"
                  ? "bg-black text-white"
                  : "text-black/50 hover:text-black"
              }`}
            >
              AI Assist
            </button>
          </div>
        </header>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[235px_minmax(430px,1fr)_300px]">

          {/* =================================================
              LEFT CONTROLS
          ================================================= */}

          <aside className="order-2 rounded-[10px] border border-black/10 bg-[#fbfaf7] p-4 xl:order-1">

            {/* CATEGORY */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/50">
                  Category
                </p>

                <span className="text-[9px] font-bold text-black/30">
                  {category}
                </span>
              </div>

              <select
                value={
                  category
                }
                onChange={(e) =>
                  setCategory(
                    e.target
                      .value
                  )
                }
                className="w-full rounded-[7px] border border-black/10 bg-white px-3 py-2.5 text-xs font-semibold outline-none transition focus:border-black"
              >
                {CATEGORIES.map(
                  (cat) => (
                    <option
                      key={cat}
                      value={cat}
                    >
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SKIN TONE */}

            <div className="mt-4 border-t border-black/10 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/50">
                  Skin Tone
                </p>

                <span className="text-[9px] font-black text-black/30">
                  TYPE{" "}
                  {skinTone.type}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-6 gap-2">
                {SKIN_TONES.map(
                  (tone) => (
                    <button
                      key={
                        tone.type
                      }
                      type="button"
                      title={`${tone.type} — ${tone.label}`}
                      onClick={() => {
                        setSkinTone(
                          tone
                        );

                        setGeneratedImage(
                          ""
                        );

                        setImageError(
                          ""
                        );
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className={`h-7 w-7 rounded-full border transition ${
                          skinTone.type ===
                          tone.type
                            ? "border-black ring-2 ring-black ring-offset-2"
                            : "border-black/10"
                        }`}
                        style={{
                          backgroundColor:
                            tone.color,
                        }}
                      />

                      <span className="text-[8px] font-black text-black/40">
                        {tone.type}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* BACKGROUND */}

            <div className="mt-4 border-t border-black/10 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/50">
                Background
              </p>

              <div className="mt-3 flex gap-2">
                {PREVIEW_BACKGROUNDS.map(
                  (bg) => (
                    <button
                      key={
                        bg.name
                      }
                      type="button"
                      title={
                        bg.name
                      }
                      onClick={() => {
                        setPreviewBg(
                          bg.color
                        );

                        setGeneratedImage(
                          ""
                        );

                        setImageError(
                          ""
                        );
                      }}
                      className={`h-8 w-8 rounded-full border transition ${
                        previewBg ===
                        bg.color
                          ? "border-black ring-2 ring-black ring-offset-2"
                          : "border-black/10"
                      }`}
                      style={{
                        backgroundColor:
                          bg.color,
                      }}
                    />
                  )
                )}
              </div>
            </div>

            {/* FIT */}

            <div className="mt-4 border-t border-black/10 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/50">
                  Fit Adjustment
                </p>

                <button
                  type="button"
                  onClick={
                    resetPositions
                  }
                  className="text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black"
                >
                  Reset
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1 rounded-[7px] bg-black/5 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setActiveAdjustment(
                      "top"
                    )
                  }
                  disabled={
                    !selectedTop
                  }
                  className={`rounded-[5px] py-2 text-[9px] font-black uppercase tracking-widest ${
                    activeAdjustment ===
                    "top"
                      ? "bg-white text-black shadow-sm"
                      : "text-black/40"
                  }`}
                >
                  Top
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveAdjustment(
                      "bottom"
                    )
                  }
                  disabled={
                    !selectedBottom
                  }
                  className={`rounded-[5px] py-2 text-[9px] font-black uppercase tracking-widest ${
                    activeAdjustment ===
                    "bottom"
                      ? "bg-white text-black shadow-sm"
                      : "text-black/40"
                  }`}
                >
                  Bottom
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-black/50">
                    Scale
                  </span>

                  <span className="text-[9px] font-black text-black">
                    {Number(
                      positions[
                        activeAdjustment
                      ]?.scale ||
                        1
                    ).toFixed(
                      2
                    )}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.01"
                  value={
                    positions[
                      activeAdjustment
                    ]?.scale ||
                    1
                  }
                  onChange={(e) =>
                    updateScale(
                      activeAdjustment,
                      e.target
                        .value
                    )
                  }
                  disabled={
                    mode !==
                    "manual"
                  }
                  className="mt-2 w-full"
                />

                <p className="mt-2 text-[8px] leading-relaxed text-black/35">
                  Drag the selected
                  garment directly
                  on the mannequin
                  for fine
                  positioning.
                </p>
              </div>
            </div>

            {/* TOTAL */}

            <div className="mt-4 rounded-[8px] bg-black p-3 text-white">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                  Outfit Total
                </span>

                <span className="text-sm font-black">
                  {currency}
                  {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </aside>

          {/* =================================================
              CENTER
          ================================================= */}

          <main className="order-1 min-w-0 xl:order-2">

            {/* PREVIEW */}

            <section
              className="relative min-h-[610px] overflow-hidden rounded-[10px] border border-black/10"
              style={{
                background:
                  generatedImage
                    ? "#050505"
                    : previewBg,
              }}
            >

              {/* LABEL */}

              <div className="absolute left-4 top-4 z-[100]">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mix-blend-difference">
                  Preview
                </p>

                <p className="mt-1 text-[10px] font-semibold text-white/30 mix-blend-difference">
                  {generatedImage
                    ? "AI GENERATED"
                    : "MANUAL FIT"}
                </p>
              </div>

              {/* =================================================
                  FLOATING GENERATING MESSAGE
              ================================================= */}

              {imageLoading && (
                <div className="absolute left-1/2 top-1/2 z-[200] -translate-x-1/2 -translate-y-1/2">
                  <div className="flex min-w-[220px] flex-col items-center rounded-[12px] border border-white/10 bg-black/90 px-7 py-5 text-center text-white shadow-2xl backdrop-blur-md">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20">
                      <span className="saint-spin text-lg">
                        ✦
                      </span>
                    </div>

                    <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em]">
                      Generating Outfit
                    </p>

                    <p className="mt-1 text-[9px] font-medium text-white/45 saint-pulse">
                      Creating your AI fashion preview...
                    </p>

                  </div>
                </div>
              )}

              {/* ERROR */}

              {imageError && (
                <div className="absolute bottom-4 left-4 right-4 z-[100] rounded-[7px] bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600">
                  {imageError}
                </div>
              )}

              {/* =================================================
                  AI IMAGE
              ================================================= */}

              {generatedImage ? (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <img
                    src={
                      generatedImage
                    }
                    alt="AI Generated Outfit"
                    className="saint-fade max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="relative h-[690px] w-[430px] shrink-0"
                    style={{
                      transform: `scale(${zoom})`,
                    }}
                  >

                    {/* MANNEQUIN */}

                    <img
                      src={
                        assets.mannequin
                      }
                      alt="Mannequin"
                      draggable={
                        false
                      }
                      className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[680px] w-[400px] -translate-x-1/2 -translate-y-1/2 select-none object-contain"
                      style={{
                        filter: `sepia(.28) saturate(1.08) hue-rotate(${skinTone.hue}deg) brightness(${skinTone.brightness})`,
                      }}
                    />

                    {/* BOTTOM */}

                    {selectedBottom &&
                      bottomFit && (
                        <div
                          onMouseDown={(
                            event
                          ) =>
                            startDrag(
                              event,
                              "bottom"
                            )
                          }
                          onTouchStart={(
                            event
                          ) =>
                            startDrag(
                              event,
                              "bottom"
                            )
                          }
                          className="absolute left-1/2 top-[270px] z-20 flex cursor-grab touch-none select-none items-center justify-center active:cursor-grabbing"
                          style={{
                            width:
                              bottomFit.width,

                            height:
                              bottomFit.height,

                            transform: `translateX(-50%) translate(${bottomFit.x}px, ${bottomFit.y}px) scale(${bottomFit.scale})`,
                          }}
                        >
                          <img
                            key={
                              selectedBottom._id
                            }
                            src={getProductImage(
                              selectedBottom
                            )}
                            alt={
                              selectedBottom.name
                            }
                            draggable={
                              false
                            }
                            className="saint-fade pointer-events-none h-full w-full select-none object-contain"
                          />
                        </div>
                      )}

                    {/* TOP */}

                    {selectedTop &&
                      topFit && (
                        <div
                          onMouseDown={(
                            event
                          ) =>
                            startDrag(
                              event,
                              "top"
                            )
                          }
                          onTouchStart={(
                            event
                          ) =>
                            startDrag(
                              event,
                              "top"
                            )
                          }
                          className="absolute left-1/2 top-[72px] z-30 flex cursor-grab touch-none select-none items-center justify-center active:cursor-grabbing"
                          style={{
                            width:
                              topFit.width,

                            height:
                              topFit.height,

                            transform: `translateX(-50%) translate(${topFit.x}px, ${topFit.y}px) scale(${topFit.scale})`,
                          }}
                        >
                          <img
                            key={
                              selectedTop._id
                            }
                            src={getProductImage(
                              selectedTop
                            )}
                            alt={
                              selectedTop.name
                            }
                            draggable={
                              false
                            }
                            className="saint-fade pointer-events-none h-full w-full select-none object-contain"
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* =================================================
                  ZOOM
              ================================================= */}

              <div className="absolute bottom-3 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-[8px] border border-black/10 bg-white/95 p-1 shadow-lg backdrop-blur">

                <button
                  type="button"
                  onClick={() =>
                    setZoom(
                      (value) =>
                        Math.max(
                          0.85,
                          value -
                            0.05
                        )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] text-sm font-black hover:bg-black/5"
                >
                  −
                </button>

                <span className="min-w-[55px] text-center text-[9px] font-black uppercase tracking-widest">
                  {Math.round(
                    zoom * 100
                  )}
                  %
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setZoom(
                      (value) =>
                        Math.min(
                          1.15,
                          value +
                            0.05
                        )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] text-sm font-black hover:bg-black/5"
                >
                  +
                </button>

                <div className="mx-1 h-5 w-px bg-black/10" />

                <button
                  type="button"
                  onClick={() =>
                    setZoom(1)
                  }
                  className="rounded-[6px] px-2 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-black/5"
                >
                  Reset
                </button>
              </div>
            </section>

            {/* =================================================
                ACTION BAR — NOW UNDER MANNEQUIN
            ================================================= */}

            <section className="mt-3 rounded-[10px] border border-black/10 bg-[#fbfaf7] p-3">

              <div className="flex flex-col gap-2 sm:flex-row">

                {/* AI STYLE ANALYSIS */}

                <button
                  type="button"
                  onClick={
                    generateAISuggestion
                  }
                  disabled={
                    aiLoading ||
                    (!selectedTop &&
                      !selectedBottom) ||
                    mode ===
                      "automatic"
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-[7px] border border-black bg-white py-3 text-[10px] font-black uppercase tracking-widest transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>
                    ✦
                  </span>

                  {aiLoading
                    ? "Analyzing..."
                    : "AI Style Analysis"}
                </button>

                {/* GENERATE */}

                <button
                  type="button"
                  onClick={
                    generateAIOutfitImage
                  }
                  disabled={
                    imageLoading ||
                    (!selectedTop &&
                      !selectedBottom)
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-[7px] bg-black py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>
                    ✦
                  </span>

                  {imageLoading
                    ? "Generating..."
                    : "Generate Outfit"}
                </button>

              </div>

              {/* AI SUGGESTION */}

              {aiError && (
                <p className="mt-2 rounded-[7px] bg-red-50 p-2.5 text-[9px] font-semibold text-red-600">
                  {aiError}
                </p>
              )}

              {aiSuggestion && (
                <div className="mt-2 rounded-[8px] border border-black/10 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[9px] text-white">
                      ✦
                    </span>

                    <p className="text-[9px] font-black uppercase tracking-widest">
                      Saint AI
                    </p>
                  </div>

                  <p className="mt-2 text-[10px] leading-relaxed text-black/60">
                    {
                      aiSuggestion
                    }
                  </p>
                </div>
              )}

              {/* DOWNLOAD */}

              {generatedImage && (
                <button
                  type="button"
                  onClick={
                    downloadOutfit
                  }
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-[7px] border border-black/10 bg-white py-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:border-black"
                >
                  ↓ Save / Download Image
                </button>
              )}

              {/* CLEAR */}

              {selectedProducts.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    clearFit
                  }
                  className="mt-1 w-full py-2 text-[9px] font-black uppercase tracking-widest text-black/30 hover:text-black"
                >
                  Clear Outfit
                </button>
              )}

            </section>
          </main>

          {/* =================================================
              RIGHT PRODUCT PANEL
          ================================================= */}

          <aside className="order-3 min-w-0 rounded-[10px] border border-black/10 bg-[#fbfaf7] p-3">

            {/* =================================================
                TOP
            ================================================= */}

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[-0.03em]">
                    Top
                  </h2>

                  <p className="mt-0.5 text-[9px] font-medium text-black/35">
                    Shirts & Jerseys
                  </p>
                </div>

                {selectedTop && (
                  <button
                    type="button"
                    onClick={() =>
                      addToFit(
                        selectedTop
                      )
                    }
                    className="text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* ONE TOP PRODUCT ONLY */}

              <div className="mt-3">
                {topOptions.length ===
                0 ? (
                  <div className="rounded-[8px] border border-dashed border-black/10 p-5 text-center">
                    <p className="text-[9px] font-bold text-black/35">
                      No top items
                      found.
                    </p>
                  </div>
                ) : (
                  paginatedTopOptions.map(
                    (item) =>
                      renderProductCard(
                        item,
                        selectedTop?._id ===
                          item._id
                      )
                  )
                )}
              </div>

              {/* TOP NAVIGATION */}

              {topOptions.length >
                1 && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTopPage(
                        (page) =>
                          Math.max(
                            1,
                            page -
                              1
                          )
                      )
                    }
                    disabled={
                      topPage ===
                      1
                    }
                    className="flex-1 rounded-[6px] border border-black/10 bg-white px-2 py-2 text-[8px] font-black uppercase tracking-widest transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ← Prev
                  </button>

                  <span className="min-w-[45px] text-center text-[8px] font-black uppercase tracking-widest text-black/40">
                    {topPage} /{" "}
                    {
                      topTotalPages
                    }
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setTopPage(
                        (page) =>
                          Math.min(
                            topTotalPages,
                            page +
                              1
                          )
                      )
                    }
                    disabled={
                      topPage ===
                      topTotalPages
                    }
                    className="flex-1 rounded-[6px] border border-black/10 bg-white px-2 py-2 text-[8px] font-black uppercase tracking-widest transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* =================================================
                BOTTOM
            ================================================= */}

            <div className="mt-4 border-t border-black/10 pt-4">

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[-0.03em]">
                    Bottom
                  </h2>

                  <p className="mt-0.5 text-[9px] font-medium text-black/35">
                    Shorts & Pants
                  </p>
                </div>

                {selectedBottom && (
                  <button
                    type="button"
                    onClick={() =>
                      addToFit(
                        selectedBottom
                      )
                    }
                    className="text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* ONE BOTTOM PRODUCT ONLY */}

              <div className="mt-3">
                {bottomOptions.length ===
                0 ? (
                  <div className="rounded-[8px] border border-dashed border-black/10 p-5 text-center">
                    <p className="text-[9px] font-bold text-black/35">
                      No bottom
                      items found.
                    </p>
                  </div>
                ) : (
                  paginatedBottomOptions.map(
                    (item) =>
                      renderProductCard(
                        item,
                        selectedBottom?._id ===
                          item._id
                      )
                  )
                )}
              </div>

              {/* BOTTOM NAVIGATION */}

              {bottomOptions.length >
                1 && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBottomPage(
                        (page) =>
                          Math.max(
                            1,
                            page -
                              1
                          )
                      )
                    }
                    disabled={
                      bottomPage ===
                      1
                    }
                    className="flex-1 rounded-[6px] border border-black/10 bg-white px-2 py-2 text-[8px] font-black uppercase tracking-widest transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ← Prev
                  </button>

                  <span className="min-w-[45px] text-center text-[8px] font-black uppercase tracking-widest text-black/40">
                    {
                      bottomPage
                    }{" "}
                    /{" "}
                    {
                      bottomTotalPages
                    }
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setBottomPage(
                        (page) =>
                          Math.min(
                            bottomTotalPages,
                            page +
                              1
                          )
                      )
                    }
                    disabled={
                      bottomPage ===
                      bottomTotalPages
                    }
                    className="flex-1 rounded-[6px] border border-black/10 bg-white px-2 py-2 text-[8px] font-black uppercase tracking-widest transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* =================================================
                AI MODE INFO
            ================================================= */}

            {mode ===
              "automatic" && (
              <div className="mt-4 rounded-[8px] bg-black p-3 text-white">
                <div className="flex items-center gap-2">
                  <span>
                    ✦
                  </span>

                  <p className="text-[10px] font-black uppercase tracking-widest">
                    AI Assist
                  </p>
                </div>

                <p className="mt-2 text-[9px] leading-relaxed text-white/50">
                  AI automatically
                  selects a matching
                  top and bottom and
                  generates your
                  outfit preview.
                </p>
              </div>
            )}

          </aside>
        </div>
      </div>
    </div>
  );
};

export default StyleBuilder;