import React,{createContext,useEffect,useState,useCallback,useRef}from"react";
import{toast}from"react-toastify";
import{useNavigate}from"react-router-dom";
import axios from"axios";

export const ShopContext=createContext();

const SIZE_ORDER=["S","M","L","XL","2XL","3XL"];
const DEFAULT_CATEGORIES=["Tshirt","Long Sleeve","Jorts","Mesh Shorts","Crop Jersey"];
const DEFAULT_BACKEND_URL="https://saint-clothing-backend-lzs6.onrender.com";

const normalizeStockObject=(stock={})=>{
  try{
    const stockObj=typeof stock==="string"?JSON.parse(stock):stock||{};
    if(typeof stockObj!=="object"||Array.isArray(stockObj))throw new Error("Invalid stock object");
    const normalized={};
    SIZE_ORDER.forEach((size)=>{
      const matchingKey=Object.keys(stockObj).find((key)=>String(key).toUpperCase()===size);
      normalized[size]=Number(matchingKey?stockObj[matchingKey]:0);
    });
    return normalized;
  }catch(error){
    console.log("Stock normalization error:",error);
    return{S:0,M:0,L:0,XL:0,"2XL":0,"3XL":0};
  }
};

const getAvailableStockForSize=(product,size)=>{
  const normalizedSize=String(size||"").toUpperCase();
  const actualStock=Number(product?.stock?.[normalizedSize]||0);
  const preorderStock=Number(product?.preorderStock?.[normalizedSize]||0);
  const preorderEnabled=product?.preorderEnabled!==false;
  const preorderThreshold=Number(product?.preorderThreshold??5);
  const isPreorderSize=preorderEnabled&&actualStock<=preorderThreshold&&preorderStock>0;
  return{availableStock:isPreorderSize?preorderStock:actualStock,isPreorderSize,actualStock,preorderStock,preorderEnabled,preorderThreshold};
};

const ShopContextProvider=({children})=>{
  const currency="₱";
  const delivery_fee=10;
  const navigate=useNavigate();
  const backendUrl=(import.meta.env.VITE_BACKEND_URL||DEFAULT_BACKEND_URL).trim().replace(/\/+$/,"");

  const[search,setSearch]=useState("");
  const[showSearch,setShowSearch]=useState(false);
  const[cartItems,setCartItems]=useState({});
  const[cartCount,setCartCount]=useState(0);
  const[products,setProducts]=useState([]);
  const[categoryOptions,setCategoryOptions]=useState(DEFAULT_CATEGORIES);
  const[token,setToken]=useState("");
  const[user,setUser]=useState(null);
  const[authReady,setAuthReady]=useState(false);

  const pollingRef=useRef(null);

  const getAuthHeaders=useCallback((userToken)=>{
    const cleanToken=String(userToken||"").trim();
    if(!cleanToken)return{};
    return{Authorization:`Bearer ${cleanToken}`};
  },[]);

  const calculateCartCount=useCallback((cart)=>{
    return Object.values(cart||{}).reduce((acc,sizes)=>{
      const sizeTotal=Object.values(sizes||{}).reduce((sum,qty)=>sum+(Number(qty)||0),0);
      return acc+sizeTotal;
    },0);
  },[]);

  const clearAuthData=useCallback(()=>{
    console.log("Clearing invalid authentication data.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setCartItems({});
    setCartCount(0);
    if(pollingRef.current){
      clearInterval(pollingRef.current);
      pollingRef.current=null;
    }
  },[]);

  const getCategoriesData=useCallback(async(currentProducts=[])=>{
    try{
      const response=await axios.get(`${backendUrl}/api/category/list`,{timeout:20000});
      if(response.data?.success){
        const backendCategories=(response.data.categories||[]).map((item)=>item.name).filter(Boolean);
        const productCategories=(currentProducts||[]).map((item)=>item.category).filter(Boolean);
        setCategoryOptions(Array.from(new Set([...DEFAULT_CATEGORIES,...backendCategories,...productCategories])));
      }
    }catch(error){
      console.log("Category fetch error:",error.response?.data||error.message);
      const productCategories=(currentProducts||[]).map((item)=>item.category).filter(Boolean);
      setCategoryOptions(Array.from(new Set([...DEFAULT_CATEGORIES,...productCategories])));
    }
  },[backendUrl]);

  const fetchCurrentUser=useCallback(async(userToken,options={})=>{
    const{clearOn401=true,silent=true}=options;
    const cleanToken=String(userToken||"").trim();
    if(!cleanToken)return null;
    try{
      const response=await axios.post(`${backendUrl}/api/user/me`,{},{
        headers:getAuthHeaders(cleanToken),
        timeout:20000
      });
      if(response.data?.success&&response.data?.user){
        const currentUser=response.data.user;
        setUser(currentUser);
        localStorage.setItem("user",JSON.stringify(currentUser));
        return currentUser;
      }
      return null;
    }catch(error){
      const status=error.response?.status;
      console.log("Fetch current user error:",error.response?.data||error.message);
      if(status===401&&clearOn401){
        clearAuthData();
        if(!silent)toast.error("Your session has expired. Please login again.");
      }
      return null;
    }
  },[backendUrl,getAuthHeaders,clearAuthData]);

  const getProductsData=useCallback(async()=>{
    try{
      const response=await axios.get(`${backendUrl}/api/product/list`,{timeout:20000});
      if(response.data?.success){
        const productsData=(response.data.products||[]).map((p)=>({
          ...p,
          stock:normalizeStockObject(p.stock),
          preorderStock:normalizeStockObject(p.preorderStock),
          preorderEnabled:p.preorderEnabled!==false,
          preorderThreshold:Number(p.preorderThreshold??5),
          preorderRestockDate:p.preorderRestockDate||null,
          preorderNote:p.preorderNote||"",
          onSale:!!p.onSale,
          salePercent:Number(p.salePercent||0),
          price:Number(p.price||0)
        }));
        const reversedProducts=[...productsData].reverse();
        setProducts(reversedProducts);
        const productCategories=reversedProducts.map((item)=>item.category).filter(Boolean);
        setCategoryOptions(Array.from(new Set([...DEFAULT_CATEGORIES,...productCategories])));
        return reversedProducts;
      }
      setProducts([]);
      setCategoryOptions(DEFAULT_CATEGORIES);
      return[];
    }catch(error){
      console.log("Products fetch error:",error.response?.data||error.message);
      setProducts([]);
      setCategoryOptions(DEFAULT_CATEGORIES);
      return[];
    }
  },[backendUrl]);

  const fetchCart=useCallback(async(userToken,userId,silent=true)=>{
    const cleanToken=String(userToken||"").trim();
    if(!cleanToken||!userId)return null;
    try{
      const response=await axios.post(`${backendUrl}/api/cart/get`,{},{
        headers:getAuthHeaders(cleanToken),
        timeout:20000
      });
      if(response.data?.success){
        const backendCart=response.data.cartData||{};
        setCartItems(backendCart);
        setCartCount(calculateCartCount(backendCart));
        localStorage.setItem(`cart_${userId}`,JSON.stringify(backendCart));
        return backendCart;
      }
      return null;
    }catch(error){
      console.log("Failed to fetch cart:",error.response?.data||error.message);
      if(error.response?.status===401){
        clearAuthData();
        return null;
      }
      if(!silent)toast.error("Failed to refresh cart");
      return null;
    }
  },[backendUrl,getAuthHeaders,calculateCartCount,clearAuthData]);

  const startCartPolling=useCallback(()=>{
    if(pollingRef.current)clearInterval(pollingRef.current);
    if(!token||!user?._id)return;
    pollingRef.current=setInterval(()=>{
      fetchCart(token,user._id,true);
    },4000);
  },[token,user?._id,fetchCart]);

  const stopCartPolling=useCallback(()=>{
    if(pollingRef.current){
      clearInterval(pollingRef.current);
      pollingRef.current=null;
    }
  },[]);

  const addToCart=useCallback(async(itemId,size,quantity=1)=>{
    if(!token||!user?._id){
      toast.error("Please login to add items to cart");
      navigate("/login");
      return false;
    }

    if(!size){
      toast.error("Please select a size");
      return false;
    }

    const normalizedSize=String(size).toUpperCase();
    const qty=Number(quantity||1);

    if(!Number.isFinite(qty)||qty<=0){
      toast.error("Invalid quantity");
      return false;
    }

    const product=products.find((p)=>String(p._id)===String(itemId));

    if(!product){
      toast.error("Product not found");
      return false;
    }

    const{availableStock,isPreorderSize}=getAvailableStockForSize(product,normalizedSize);
    const currentQty=Number(cartItems[itemId]?.[normalizedSize]||0);

    if(currentQty+qty>availableStock){
      toast.error(isPreorderSize?"Cannot exceed available pre-order slots":"Cannot exceed available stock");
      return false;
    }

    try{
      const response=await axios.post(`${backendUrl}/api/cart/add`,{
        itemId,
        size:normalizedSize,
        quantity:qty
      },{
        headers:getAuthHeaders(token),
        timeout:20000
      });

      if(response.data?.success){
        const updatedCart=response.data.cartData||{};
        setCartItems(updatedCart);
        setCartCount(calculateCartCount(updatedCart));
        localStorage.setItem(`cart_${user._id}`,JSON.stringify(updatedCart));
        toast.success(isPreorderSize?"Pre-order added to cart":"Added to cart");
        return true;
      }

      toast.error(response.data?.message||"Failed to add to cart");
      return false;
    }catch(error){
      console.log("Add to cart error:",error.response?.data||error.message);

      if(error.response?.status===401){
        clearAuthData();
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return false;
      }

      toast.error(error.response?.data?.message||"Failed to add to cart");
      return false;
    }
  },[token,user?._id,products,cartItems,backendUrl,navigate,getAuthHeaders,calculateCartCount,clearAuthData]);

  const updateQuantity=useCallback(async(itemId,size,quantity)=>{
    if(!token||!user?._id)return false;

    const normalizedSize=String(size).toUpperCase();
    const nextQuantity=Number(quantity||0);

    if(!Number.isFinite(nextQuantity)||nextQuantity<0){
      toast.error("Invalid quantity");
      return false;
    }

    const product=products.find((p)=>String(p._id)===String(itemId));

    if(product&&nextQuantity>0){
      const{availableStock,isPreorderSize}=getAvailableStockForSize(product,normalizedSize);

      if(nextQuantity>availableStock){
        toast.error(isPreorderSize?"Cannot exceed available pre-order slots":"Cannot exceed available stock");
        return false;
      }
    }

    try{
      const response=await axios.post(`${backendUrl}/api/cart/update`,{
        itemId,
        size:normalizedSize,
        quantity:nextQuantity
      },{
        headers:getAuthHeaders(token),
        timeout:20000
      });

      if(response.data?.success){
        const updatedCart=response.data.cartData||{};
        setCartItems(updatedCart);
        setCartCount(calculateCartCount(updatedCart));
        localStorage.setItem(`cart_${user._id}`,JSON.stringify(updatedCart));
        return true;
      }

      toast.error(response.data?.message||"Failed to update cart");
      return false;
    }catch(error){
      console.log("Update cart error:",error.response?.data||error.message);

      if(error.response?.status===401){
        clearAuthData();
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return false;
      }

      toast.error(error.response?.data?.message||"Failed to update cart");
      return false;
    }
  },[token,user?._id,products,backendUrl,getAuthHeaders,calculateCartCount,clearAuthData,navigate]);

  const removePurchasedItems=useCallback(async(items=[])=>{
    if(!token||!user?._id)return false;
    if(!Array.isArray(items)||items.length===0)return true;

    stopCartPolling();

    try{
      const uniqueItems=[];
      const seen=new Set();

      for(const item of items){
        const itemId=item?._id||item?.productId;
        const size=String(item?.size||"").toUpperCase();

        if(!itemId||!size)continue;

        const key=`${itemId}_${size}`;

        if(seen.has(key))continue;

        seen.add(key);
        uniqueItems.push({itemId,size});
      }

      for(const item of uniqueItems){
        const response=await axios.post(`${backendUrl}/api/cart/update`,{
          itemId:item.itemId,
          size:item.size,
          quantity:0
        },{
          headers:getAuthHeaders(token),
          timeout:20000
        });

        if(!response.data?.success){
          throw new Error(response.data?.message||"Failed to remove purchased item");
        }
      }

      const refreshedCart=await fetchCart(token,user._id,true);

      if(refreshedCart){
        setCartItems(refreshedCart);
        setCartCount(calculateCartCount(refreshedCart));
        localStorage.setItem(`cart_${user._id}`,JSON.stringify(refreshedCart));
      }

      return true;
    }catch(error){
      console.log("REMOVE PURCHASED ITEMS ERROR:",error.response?.data||error.message);
      return false;
    }finally{
      startCartPolling();
    }
  },[
    token,
    user?._id,
    backendUrl,
    getAuthHeaders,
    fetchCart,
    calculateCartCount,
    stopCartPolling,
    startCartPolling
  ]);

  const clearCart=useCallback(async()=>{
    if(!token||!user?._id)return false;

    try{
      const response=await axios.post(`${backendUrl}/api/cart/clear`,{},{
        headers:getAuthHeaders(token),
        timeout:20000
      });

      if(response.data?.success){
        setCartItems({});
        setCartCount(0);
        localStorage.removeItem(`cart_${user._id}`);
        return true;
      }

      toast.error(response.data?.message||"Failed to clear cart");
      return false;
    }catch(error){
      console.log("Clear cart error:",error.response?.data||error.message);

      if(error.response?.status===401){
        clearAuthData();
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return false;
      }

      toast.error(error.response?.data?.message||"Failed to clear cart");
      return false;
    }
  },[token,user?._id,backendUrl,getAuthHeaders,clearAuthData,navigate]);

  useEffect(()=>{
    let mounted=true;

    const initializeAuth=async()=>{
      try{
        const savedToken=String(localStorage.getItem("token")||"").trim();
        const savedUser=localStorage.getItem("user");
        let activeUser=null;

        if(!savedToken){
          setToken("");
          setUser(null);
        }else{
          setToken(savedToken);

          if(savedUser){
            try{
              const parsedUser=JSON.parse(savedUser);

              if(parsedUser&&parsedUser._id){
                setUser(parsedUser);
                activeUser=parsedUser;
              }
            }catch(error){
              console.log("Saved user parse error:",error);
              localStorage.removeItem("user");
            }
          }

          const verifiedUser=await fetchCurrentUser(savedToken,{
            clearOn401:true,
            silent:true
          });

          if(verifiedUser)activeUser=verifiedUser;
        }

        if(savedToken&&activeUser?._id&&mounted){
          const currentToken=localStorage.getItem("token");

          if(currentToken){
            fetchCart(currentToken,activeUser._id,true);
          }
        }
      }catch(error){
        console.log("Initial app load error:",error);
      }finally{
        if(mounted)setAuthReady(true);
      }
    };

    initializeAuth();

    return()=>{
      mounted=false;
    };
  },[fetchCurrentUser,fetchCart]);

  useEffect(()=>{
    let cancelled=false;
    let idleId=null;
    let timerId=null;

    const loadProducts=()=>{
      if(cancelled)return;
      getProductsData();
    };

    if("requestIdleCallback"in window){
      idleId=window.requestIdleCallback(loadProducts,{timeout:1800});
    }else{
      timerId=window.setTimeout(loadProducts,700);
    }

    return()=>{
      cancelled=true;

      if(idleId!==null&&"cancelIdleCallback"in window){
        window.cancelIdleCallback(idleId);
      }

      if(timerId!==null){
        window.clearTimeout(timerId);
      }
    };
  },[getProductsData]);

  useEffect(()=>{
    if(!authReady)return;

    if(token&&user?._id){
      fetchCart(token,user._id,true);
      startCartPolling();
    }else{
      stopCartPolling();
      setCartItems({});
      setCartCount(0);
    }

    return()=>{
      stopCartPolling();
    };
  },[authReady,token,user?._id,fetchCart,startCartPolling,stopCartPolling]);

  useEffect(()=>{
    const handleVisibility=()=>{
      if(document.visibilityState!=="visible")return;

      if(token&&user?._id){
        fetchCart(token,user._id,true);
      }
    };

    const handleStorage=()=>{
      const latestToken=String(localStorage.getItem("token")||"").trim();

      if(latestToken&&user?._id){
        fetchCurrentUser(latestToken,{
          clearOn401:true,
          silent:true
        });

        fetchCart(latestToken,user._id,true);
      }
    };

    document.addEventListener("visibilitychange",handleVisibility);
    window.addEventListener("storage",handleStorage);

    return()=>{
      document.removeEventListener("visibilitychange",handleVisibility);
      window.removeEventListener("storage",handleStorage);
    };
  },[token,user?._id,fetchCurrentUser,fetchCart]);

  const getCartAmount=useCallback(()=>{
    return Object.entries(cartItems||{}).reduce((total,[itemId,sizes])=>{
      const product=products.find((p)=>String(p._id)===String(itemId));

      if(!product)return total;

      const basePrice=Number(product.price||0);
      const salePercent=Number(product.salePercent||0);

      const finalPrice=product.onSale&&salePercent>0
        ?Math.max(basePrice-(basePrice*salePercent)/100,0)
        :basePrice;

      const totalForProduct=Object.values(sizes||{}).reduce(
        (sum,qty)=>sum+Number(qty||0)*finalPrice,
        0
      );

      return total+totalForProduct;
    },0);
  },[cartItems,products]);

  const value={
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
    removePurchasedItems,
    clearCart,
    getCartCount:()=>cartCount,
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
    getAvailableStockForSize
  };

  return(
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;