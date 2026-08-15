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

/* =========================================================
   CONSTANTS
========================================================= */

const SIZE_ORDER = [
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
];

const DEFAULT_CATEGORIES = [
    "Tshirt",
    "Long Sleeve",
    "Jorts",
    "Mesh Shorts",
    "Crop Jersey",
];

/* =========================================================
   BACKEND URL
========================================================= */

const DEFAULT_BACKEND_URL =
    "https://saint-clothing-backend-lzs6.onrender.com";

/* =========================================================
   STOCK NORMALIZATION
========================================================= */

const normalizeStockObject = (stock = {}) => {
    try {
        const stockObj =
            typeof stock === "string"
                ? JSON.parse(stock)
                : stock || {};

        if (
            typeof stockObj !== "object" ||
            Array.isArray(stockObj)
        ) {
            throw new Error(
                "Invalid stock object"
            );
        }

        const normalized = {};

        SIZE_ORDER.forEach((size) => {
            const matchingKey =
                Object.keys(stockObj).find(
                    (key) =>
                        String(key).toUpperCase() ===
                        size
                );

            normalized[size] = Number(
                matchingKey
                    ? stockObj[matchingKey]
                    : 0
            );
        });

        return normalized;
    } catch (error) {
        console.log(
            "Stock normalization error:",
            error
        );

        return {
            S: 0,
            M: 0,
            L: 0,
            XL: 0,
            "2XL": 0,
            "3XL": 0,
        };
    }
};

/* =========================================================
   AVAILABLE STOCK
========================================================= */

const getAvailableStockForSize = (
    product,
    size
) => {
    const normalizedSize =
        String(size || "").toUpperCase();

    const actualStock = Number(
        product?.stock?.[normalizedSize] || 0
    );

    const preorderStock = Number(
        product?.preorderStock?.[
            normalizedSize
        ] || 0
    );

    const preorderEnabled =
        product?.preorderEnabled !== false;

    const preorderThreshold = Number(
        product?.preorderThreshold ?? 5
    );

    const isPreorderSize =
        preorderEnabled &&
        actualStock <= preorderThreshold &&
        preorderStock > 0;

    return {
        availableStock: isPreorderSize
            ? preorderStock
            : actualStock,

        isPreorderSize,

        actualStock,

        preorderStock,

        preorderEnabled,

        preorderThreshold,
    };
};

/* =========================================================
   PROVIDER
========================================================= */

const ShopContextProvider = ({
    children,
}) => {
    const currency = "₱";
    const delivery_fee = 10;

    const navigate = useNavigate();

    /* =====================================================
       BACKEND URL
    ===================================================== */

    const backendUrl = (
        import.meta.env.VITE_BACKEND_URL ||
        DEFAULT_BACKEND_URL
    )
        .trim()
        .replace(/\/+$/, "");

    /* =====================================================
       STATE
    ===================================================== */

    const [search, setSearch] =
        useState("");

    const [showSearch, setShowSearch] =
        useState(false);

    const [cartItems, setCartItems] =
        useState({});

    const [cartCount, setCartCount] =
        useState(0);

    const [products, setProducts] =
        useState([]);

    const [
        categoryOptions,
        setCategoryOptions,
    ] = useState(DEFAULT_CATEGORIES);

    const [token, setToken] =
        useState("");

    const [user, setUser] =
        useState(null);

    const [authReady, setAuthReady] =
        useState(false);

    const pollingRef =
        useRef(null);

    /* =====================================================
       AUTH HEADERS
    ===================================================== */

    const getAuthHeaders =
        useCallback((userToken) => {
            const cleanToken =
                String(
                    userToken || ""
                ).trim();

            if (!cleanToken) {
                return {};
            }

            return {
                Authorization: `Bearer ${cleanToken}`,
            };
        }, []);

    /* =====================================================
       CLEAR AUTH DATA
    ===================================================== */

    const clearAuthData =
        useCallback(() => {
            console.log(
                "Clearing invalid authentication data."
            );

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            setToken("");
            setUser(null);
            setCartItems({});
            setCartCount(0);

            if (pollingRef.current) {
                clearInterval(
                    pollingRef.current
                );

                pollingRef.current =
                    null;
            }
        }, []);

    /* =====================================================
       CATEGORIES
    ===================================================== */

    const getCategoriesData =
        useCallback(
            async (
                currentProducts = []
            ) => {
                try {
                    const response =
                        await axios.get(
                            `${backendUrl}/api/category/list`,
                            {
                                timeout: 20000,
                            }
                        );

                    if (
                        response.data
                            ?.success
                    ) {
                        const backendCategories =
                            (
                                response
                                    .data
                                    .categories ||
                                []
                            )
                                .map(
                                    (
                                        item
                                    ) =>
                                        item.name
                                )
                                .filter(
                                    Boolean
                                );

                        const productCategories =
                            (
                                currentProducts ||
                                []
                            )
                                .map(
                                    (
                                        item
                                    ) =>
                                        item.category
                                )
                                .filter(
                                    Boolean
                                );

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
                        error.response
                            ?.data ||
                            error.message
                    );

                    const productCategories =
                        (
                            currentProducts ||
                            []
                        )
                            .map(
                                (
                                    item
                                ) =>
                                    item.category
                            )
                            .filter(
                                Boolean
                            );

                    setCategoryOptions(
                        Array.from(
                            new Set([
                                ...DEFAULT_CATEGORIES,
                                ...productCategories,
                            ])
                        )
                    );
                }
            },
            [backendUrl]
        );

    /* =====================================================
       CURRENT USER
    ===================================================== */

    const fetchCurrentUser =
        useCallback(
            async (
                userToken,
                options = {}
            ) => {
                const {
                    clearOn401 = true,
                    silent = true,
                } = options;

                const cleanToken =
                    String(
                        userToken || ""
                    ).trim();

                if (!cleanToken) {
                    return null;
                }

                try {
                    console.log(
                        "Verifying user token..."
                    );

                    const response =
                        await axios.post(
                            `${backendUrl}/api/user/me`,
                            {},
                            {
                                headers:
                                    getAuthHeaders(
                                        cleanToken
                                    ),
                                timeout: 20000,
                            }
                        );

                    if (
                        response.data
                            ?.success &&
                        response.data
                            ?.user
                    ) {
                        const currentUser =
                            response.data
                                .user;

                        setUser(
                            currentUser
                        );

                        localStorage.setItem(
                            "user",
                            JSON.stringify(
                                currentUser
                            )
                        );

                        console.log(
                            "User token verified successfully."
                        );

                        return currentUser;
                    }

                    return null;
                } catch (error) {
                    const status =
                        error.response
                            ?.status;

                    console.log(
                        "Fetch current user error:",
                        error.response
                            ?.data ||
                            error.message
                    );

                    /*
                     * IMPORTANT:
                     *
                     * 401 means the token is no
                     * longer accepted by the backend.
                     *
                     * This is NOT a CORS error.
                     */
                    if (
                        status === 401 &&
                        clearOn401
                    ) {
                        clearAuthData();

                        if (
                            !silent
                        ) {
                            toast.error(
                                "Your session has expired. Please login again."
                            );
                        }
                    }

                    return null;
                }
            },
            [
                backendUrl,
                getAuthHeaders,
                clearAuthData,
            ]
        );

    /* =====================================================
       PRODUCTS
    ===================================================== */

    const getProductsData =
        useCallback(
            async () => {
                try {
                    const response =
                        await axios.get(
                            `${backendUrl}/api/product/list`,
                            {
                                timeout: 20000,
                            }
                        );

                    if (
                        response.data
                            ?.success
                    ) {
                        const productsData =
                            (
                                response.data
                                    .products ||
                                []
                            ).map(
                                (p) => ({
                                    ...p,

                                    stock:
                                        normalizeStockObject(
                                            p.stock
                                        ),

                                    preorderStock:
                                        normalizeStockObject(
                                            p.preorderStock
                                        ),

                                    preorderEnabled:
                                        p.preorderEnabled !==
                                        false,

                                    preorderThreshold:
                                        Number(
                                            p.preorderThreshold ??
                                                5
                                        ),

                                    preorderRestockDate:
                                        p.preorderRestockDate ||
                                        null,

                                    preorderNote:
                                        p.preorderNote ||
                                        "",

                                    onSale:
                                        !!p.onSale,

                                    salePercent:
                                        Number(
                                            p.salePercent ||
                                                0
                                        ),

                                    price:
                                        Number(
                                            p.price ||
                                                0
                                        ),
                                })
                            );

                        const reversedProducts =
                            [
                                ...productsData,
                            ].reverse();

                        setProducts(
                            reversedProducts
                        );

                        await getCategoriesData(
                            reversedProducts
                        );
                    } else {
                        setProducts(
                            []
                        );

                        await getCategoriesData(
                            []
                        );
                    }
                } catch (error) {
                    console.log(
                        "Products fetch error:",
                        error.response
                            ?.data ||
                            error.message
                    );

                    toast.error(
                        "Failed to fetch products: " +
                            error.message
                    );

                    setProducts(
                        []
                    );

                    await getCategoriesData(
                        []
                    );
                }
            },
            [
                backendUrl,
                getCategoriesData,
            ]
        );

    /* =====================================================
       CART COUNT
    ===================================================== */

    const calculateCartCount =
        useCallback(
            (cart) => {
                return Object.values(
                    cart || {}
                ).reduce(
                    (
                        acc,
                        sizes
                    ) => {
                        const sizeTotal =
                            Object.values(
                                sizes ||
                                    {}
                            ).reduce(
                                (
                                    sum,
                                    qty
                                ) =>
                                    sum +
                                    (Number(
                                        qty
                                    ) || 0),
                                0
                            );

                        return (
                            acc +
                            sizeTotal
                        );
                    },
                    0
                );
            },
            []
        );

    /* =====================================================
       FETCH CART
    ===================================================== */

    const fetchCart =
        useCallback(
            async (
                userToken,
                userId,
                silent = true
            ) => {
                const cleanToken =
                    String(
                        userToken || ""
                    ).trim();

                if (
                    !cleanToken ||
                    !userId
                ) {
                    return;
                }

                try {
                    const response =
                        await axios.post(
                            `${backendUrl}/api/cart/get`,
                            {},
                            {
                                headers:
                                    getAuthHeaders(
                                        cleanToken
                                    ),
                                timeout: 20000,
                            }
                        );

                    if (
                        response.data
                            ?.success
                    ) {
                        const backendCart =
                            response.data
                                .cartData ||
                            {};

                        setCartItems(
                            (
                                previous
                            ) => {
                                const previousString =
                                    JSON.stringify(
                                        previous
                                    );

                                const nextString =
                                    JSON.stringify(
                                        backendCart
                                    );

                                if (
                                    previousString !==
                                    nextString
                                ) {
                                    localStorage.setItem(
                                        `cart_${userId}`,
                                        JSON.stringify(
                                            backendCart
                                        )
                                    );

                                    setCartCount(
                                        calculateCartCount(
                                            backendCart
                                        )
                                    );

                                    return backendCart;
                                }

                                setCartCount(
                                    calculateCartCount(
                                        previous
                                    )
                                );

                                return previous;
                            }
                        );
                    }
                } catch (error) {
                    console.log(
                        "Failed to fetch cart:",
                        error.response
                            ?.data ||
                            error.message
                    );

                    if (
                        error.response
                            ?.status ===
                        401
                    ) {
                        clearAuthData();

                        /*
                         * Don't repeatedly show
                         * session-expired errors
                         * from cart polling.
                         */
                        return;
                    }

                    if (
                        !silent
                    ) {
                        toast.error(
                            "Failed to refresh cart"
                        );
                    }
                }
            },
            [
                backendUrl,
                getAuthHeaders,
                calculateCartCount,
                clearAuthData,
            ]
        );

    /* =====================================================
       CART POLLING
    ===================================================== */

    const startCartPolling =
        useCallback(() => {
            if (
                pollingRef.current
            ) {
                clearInterval(
                    pollingRef.current
                );
            }

            if (
                !token ||
                !user?._id
            ) {
                return;
            }

            pollingRef.current =
                setInterval(() => {
                    fetchCart(
                        token,
                        user._id,
                        true
                    );
                }, 4000);
        }, [
            token,
            user?._id,
            fetchCart,
        ]);

    const stopCartPolling =
        useCallback(() => {
            if (
                pollingRef.current
            ) {
                clearInterval(
                    pollingRef.current
                );

                pollingRef.current =
                    null;
            }
        }, []);

    /* =====================================================
       ADD TO CART
    ===================================================== */

    const addToCart =
        useCallback(
            async (
                itemId,
                size,
                quantity = 1
            ) => {
                if (
                    !token ||
                    !user?._id
                ) {
                    toast.error(
                        "Please login to add items to cart"
                    );

                    navigate(
                        "/login"
                    );

                    return false;
                }

                if (!size) {
                    toast.error(
                        "Please select a size"
                    );

                    return false;
                }

                const normalizedSize =
                    String(
                        size
                    ).toUpperCase();

                const qty =
                    Number(
                        quantity || 1
                    );

                if (
                    !Number.isFinite(
                        qty
                    ) ||
                    qty <= 0
                ) {
                    toast.error(
                        "Invalid quantity"
                    );

                    return false;
                }

                const product =
                    products.find(
                        (p) =>
                            String(
                                p._id
                            ) ===
                            String(
                                itemId
                            )
                    );

                if (!product) {
                    toast.error(
                        "Product not found"
                    );

                    return false;
                }

                const {
                    availableStock,
                    isPreorderSize,
                } =
                    getAvailableStockForSize(
                        product,
                        normalizedSize
                    );

                const currentQty =
                    Number(
                        cartItems[
                            itemId
                        ]?.[
                            normalizedSize
                        ] || 0
                    );

                if (
                    currentQty + qty >
                    availableStock
                ) {
                    toast.error(
                        isPreorderSize
                            ? "Cannot exceed available pre-order slots"
                            : "Cannot exceed available stock"
                    );

                    return false;
                }

                try {
                    const response =
                        await axios.post(
                            `${backendUrl}/api/cart/add`,
                            {
                                itemId,
                                size:
                                    normalizedSize,
                                quantity:
                                    qty,
                            },
                            {
                                headers:
                                    getAuthHeaders(
                                        token
                                    ),
                                timeout: 20000,
                            }
                        );

                    if (
                        response.data
                            ?.success
                    ) {
                        const updatedCart =
                            response
                                .data
                                .cartData ||
                            {};

                        setCartItems(
                            updatedCart
                        );

                        setCartCount(
                            calculateCartCount(
                                updatedCart
                            )
                        );

                        localStorage.setItem(
                            `cart_${user._id}`,
                            JSON.stringify(
                                updatedCart
                            )
                        );

                        toast.success(
                            isPreorderSize
                                ? "Pre-order added to cart"
                                : "Added to cart"
                        );

                        return true;
                    }

                    toast.error(
                        response.data
                            ?.message ||
                            "Failed to add to cart"
                    );

                    return false;
                } catch (error) {
                    console.log(
                        "Add to cart error:",
                        error.response
                            ?.data ||
                            error.message
                    );

                    if (
                        error.response
                            ?.status ===
                        401
                    ) {
                        clearAuthData();

                        toast.error(
                            "Session expired. Please login again."
                        );

                        navigate(
                            "/login"
                        );

                        return false;
                    }

                    toast.error(
                        error.response
                            ?.data
                            ?.message ||
                            "Failed to add to cart"
                    );

                    return false;
                }
            },
            [
                token,
                user?._id,
                products,
                cartItems,
                backendUrl,
                navigate,
                getAuthHeaders,
                calculateCartCount,
                clearAuthData,
            ]
        );

    /* =====================================================
       UPDATE CART
    ===================================================== */

    const updateQuantity =
        useCallback(
            async (
                itemId,
                size,
                quantity
            ) => {
                if (
                    !token ||
                    !user?._id
                ) {
                    return;
                }

                const normalizedSize =
                    String(
                        size
                    ).toUpperCase();

                const nextQuantity =
                    Number(
                        quantity || 0
                    );

                if (
                    !Number.isFinite(
                        nextQuantity
                    ) ||
                    nextQuantity < 0
                ) {
                    toast.error(
                        "Invalid quantity"
                    );

                    return;
                }

                const product =
                    products.find(
                        (p) =>
                            String(
                                p._id
                            ) ===
                            String(
                                itemId
                            )
                    );

                if (!product) {
                    return;
                }

                const {
                    availableStock,
                    isPreorderSize,
                } =
                    getAvailableStockForSize(
                        product,
                        normalizedSize
                    );

                if (
                    nextQuantity >
                    availableStock
                ) {
                    toast.error(
                        isPreorderSize
                            ? "Cannot exceed available pre-order slots"
                            : "Cannot exceed available stock"
                    );

                    return;
                }

                try {
                    const response =
                        await axios.post(
                            `${backendUrl}/api/cart/update`,
                            {
                                itemId,
                                size:
                                    normalizedSize,
                                quantity:
                                    nextQuantity,
                            },
                            {
                                headers:
                                    getAuthHeaders(
                                        token
                                    ),
                                timeout: 20000,
                            }
                        );

                    if (
                        response.data
                            ?.success
                    ) {
                        const updatedCart =
                            response
                                .data
                                .cartData ||
                            {};

                        setCartItems(
                            updatedCart
                        );

                        setCartCount(
                            calculateCartCount(
                                updatedCart
                            )
                        );

                        localStorage.setItem(
                            `cart_${user._id}`,
                            JSON.stringify(
                                updatedCart
                            )
                        );
                    } else {
                        toast.error(
                            response
                                .data
                                ?.message ||
                                "Failed to update cart"
                        );
                    }
                } catch (error) {
                    console.log(
                        "Update cart error:",
                        error.response
                            ?.data ||
                            error.message
                    );

                    if (
                        error.response
                            ?.status ===
                        401
                    ) {
                        clearAuthData();

                        toast.error(
                            "Session expired. Please login again."
                        );

                        navigate(
                            "/login"
                        );

                        return;
                    }

                    toast.error(
                        error.response
                            ?.data
                            ?.message ||
                            "Failed to update cart"
                    );
                }
            },
            [
                token,
                user?._id,
                products,
                backendUrl,
                getAuthHeaders,
                calculateCartCount,
                clearAuthData,
                navigate,
            ]
        );

    /* =====================================================
       CLEAR CART
    ===================================================== */

    const clearCart =
        useCallback(
            async () => {
                if (
                    !token ||
                    !user?._id
                ) {
                    return;
                }

                try {
                    const response =
                        await axios.post(
                            `${backendUrl}/api/cart/clear`,
                            {},
                            {
                                headers:
                                    getAuthHeaders(
                                        token
                                    ),
                                timeout: 20000,
                            }
                        );

                    if (
                        response.data
                            ?.success
                    ) {
                        setCartItems(
                            {}
                        );

                        setCartCount(
                            0
                        );

                        localStorage.removeItem(
                            `cart_${user._id}`
                        );
                    } else {
                        toast.error(
                            response
                                .data
                                ?.message ||
                                "Failed to clear cart"
                        );
                    }
                } catch (error) {
                    console.log(
                        "Clear cart error:",
                        error.response
                            ?.data ||
                            error.message
                    );

                    if (
                        error.response
                            ?.status ===
                        401
                    ) {
                        clearAuthData();

                        toast.error(
                            "Session expired. Please login again."
                        );

                        navigate(
                            "/login"
                        );

                        return;
                    }

                    toast.error(
                        error.response
                            ?.data
                            ?.message ||
                            "Failed to clear cart"
                    );
                }
            },
            [
                token,
                user?._id,
                backendUrl,
                getAuthHeaders,
                clearAuthData,
                navigate,
            ]
        );

    /* =====================================================
       INITIAL APP LOAD
    ===================================================== */

    useEffect(() => {
        let mounted = true;

        const initializeApp =
            async () => {
                try {
                    console.log(
                        "================================"
                    );

                    console.log(
                        "INITIALIZING SHOP CONTEXT"
                    );

                    console.log(
                        "Backend:",
                        backendUrl
                    );

                    console.log(
                        "================================"
                    );

                    const savedToken =
                        String(
                            localStorage.getItem(
                                "token"
                            ) || ""
                        ).trim();

                    const savedUser =
                        localStorage.getItem(
                            "user"
                        );

                    let activeUser =
                        null;

                    /* =====================================
                       NO TOKEN
                    ===================================== */

                    if (!savedToken) {
                        console.log(
                            "No saved authentication token."
                        );

                        setToken("");
                        setUser(null);
                    }

                    /* =====================================
                       TOKEN EXISTS
                    ===================================== */

                    if (
                        savedToken
                    ) {
                        console.log(
                            "Saved token found. Verifying..."
                        );

                        setToken(
                            savedToken
                        );

                        /*
                         * Restore cached user temporarily.
                         * This allows the UI to render quickly.
                         */
                        if (
                            savedUser
                        ) {
                            try {
                                const parsedUser =
                                    JSON.parse(
                                        savedUser
                                    );

                                if (
                                    parsedUser &&
                                    parsedUser._id
                                ) {
                                    setUser(
                                        parsedUser
                                    );

                                    activeUser =
                                        parsedUser;
                                }
                            } catch (
                                error
                            ) {
                                console.log(
                                    "Saved user parse error:",
                                    error
                                );

                                localStorage.removeItem(
                                    "user"
                                );
                            }
                        }

                        /*
                         * VERIFY TOKEN AGAINST
                         * THE CURRENT BACKEND.
                         */
                        const verifiedUser =
                            await fetchCurrentUser(
                                savedToken,
                                {
                                    clearOn401:
                                        true,
                                    silent: true,
                                }
                            );

                        if (
                            verifiedUser
                        ) {
                            activeUser =
                                verifiedUser;
                        } else {
                            /*
                             * fetchCurrentUser()
                             * already clears auth
                             * on 401.
                             */
                            activeUser =
                                null;
                        }
                    }

                    /* =====================================
                       LOAD PRODUCTS
                    ===================================== */

                    if (
                        mounted
                    ) {
                        await getProductsData();
                    }

                    /* =====================================
                       LOAD CART ONLY IF TOKEN
                       WAS SUCCESSFULLY VERIFIED
                    ===================================== */

                    if (
                        savedToken &&
                        activeUser?._id
                    ) {
                        /*
                         * Only fetch cart if the
                         * token is still active.
                         */
                        const currentToken =
                            localStorage.getItem(
                                "token"
                            );

                        if (
                            currentToken
                        ) {
                            await fetchCart(
                                currentToken,
                                activeUser._id,
                                true
                            );
                        }
                    }
                } catch (error) {
                    console.log(
                        "Initial app load error:",
                        error
                    );
                } finally {
                    if (
                        mounted
                    ) {
                        setAuthReady(
                            true
                        );
                    }
                }
            };

        initializeApp();

        return () => {
            mounted = false;
        };
    }, [
        backendUrl,
        fetchCurrentUser,
        getProductsData,
        fetchCart,
    ]);

    /* =====================================================
       AUTH / CART EFFECT
    ===================================================== */

    useEffect(() => {
        if (
            !authReady
        ) {
            return;
        }

        if (
            token &&
            user?._id
        ) {
            fetchCart(
                token,
                user._id,
                true
            );

            startCartPolling();
        } else {
            stopCartPolling();

            setCartItems(
                {}
            );

            setCartCount(
                0
            );
        }

        return () => {
            stopCartPolling();
        };
    }, [
        authReady,
        token,
        user?._id,
        fetchCart,
        startCartPolling,
        stopCartPolling,
    ]);

    /* =====================================================
       VISIBILITY / FOCUS
    ===================================================== */

    useEffect(() => {
        const handleVisibility =
            () => {
                if (
                    document.visibilityState ===
                    "visible"
                ) {
                    if (
                        token &&
                        user?._id
                    ) {
                        fetchCart(
                            token,
                            user._id,
                            true
                        );
                    }

                    getProductsData();
                }
            };

        const handleStorage =
            () => {
                /*
                 * Read the latest token from
                 * localStorage instead of relying
                 * entirely on an old closure.
                 */
                const latestToken =
                    String(
                        localStorage.getItem(
                            "token"
                        ) || ""
                    ).trim();

                if (
                    latestToken &&
                    user?._id
                ) {
                    fetchCurrentUser(
                        latestToken,
                        {
                            clearOn401:
                                true,
                            silent: true,
                        }
                    );

                    fetchCart(
                        latestToken,
                        user._id,
                        true
                    );
                }
            };

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        );

        window.addEventListener(
            "storage",
            handleStorage
        );

        window.addEventListener(
            "focus",
            handleVisibility
        );

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );

            window.removeEventListener(
                "storage",
                handleStorage
            );

            window.removeEventListener(
                "focus",
                handleVisibility
            );
        };
    }, [
        token,
        user?._id,
        fetchCurrentUser,
        fetchCart,
        getProductsData,
    ]);

    /* =====================================================
       CART AMOUNT
    ===================================================== */

    const getCartAmount =
        useCallback(() => {
            return Object.entries(
                cartItems || {}
            ).reduce(
                (
                    total,
                    [
                        itemId,
                        sizes,
                    ]
                ) => {
                    const product =
                        products.find(
                            (p) =>
                                String(
                                    p._id
                                ) ===
                                String(
                                    itemId
                                )
                        );

                    if (
                        !product
                    ) {
                        return total;
                    }

                    const basePrice =
                        Number(
                            product.price ||
                                0
                        );

                    const salePercent =
                        Number(
                            product.salePercent ||
                                0
                        );

                    const finalPrice =
                        product.onSale &&
                        salePercent > 0
                            ? Math.max(
                                  basePrice -
                                      (basePrice *
                                          salePercent) /
                                          100,
                                  0
                              )
                            : basePrice;

                    const totalForProduct =
                        Object.values(
                            sizes || {}
                        ).reduce(
                            (
                                sum,
                                qty
                            ) =>
                                sum +
                                Number(
                                    qty ||
                                        0
                                ) *
                                    finalPrice,
                            0
                        );

                    return (
                        total +
                        totalForProduct
                    );
                },
                0
            );
        }, [
            cartItems,
            products,
        ]);

    /* =====================================================
       CONTEXT VALUE
    ===================================================== */

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

        getCartCount: () =>
            cartCount,

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

        getAvailableStockForSize,
    };

    return (
        <ShopContext.Provider
            value={value}
        >
            {children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;