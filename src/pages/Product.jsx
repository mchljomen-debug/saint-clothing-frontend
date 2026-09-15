import React,{useCallback,useContext,useEffect,useMemo,useRef,useState}from"react";
import{useLocation,useNavigate,useParams}from"react-router-dom";
import axios from"axios";
import{ShopContext}from"../context/ShopContext";
import RelatedProducts from"../components/RelatedProducts";
import ReviewSection from"../components/ReviewSection";
import ProductItem from"../components/ProductItem";
import Product3DViewer from"../components/Product3DViewer";
import ProductGallery from"../components/ProductGallery";
import ProductInfo from"../components/ProductInfo";
import useRecommendations from"../hooks/useRecommendations";

const SIZE_ORDER=["S","M","L","XL","2XL","3XL"];

const getStockValue=(stock,size)=>{
  if(!stock)return 0;
  const target=String(size).toUpperCase();

  if(typeof stock.get==="function"){
    return Number(stock.get(target)??stock.get(target.toLowerCase()))||0;
  }

  if(typeof stock==="object"){
    const entry=Object.entries(stock).find(([key])=>String(key).toUpperCase()===target);
    return Number(entry?.[1])||0;
  }

  return 0;
};

const getTotalStock=(stock)=>{
  if(!stock)return 0;

  if(typeof stock.get==="function"){
    let total=0;
    for(const value of stock.values())total+=Number(value)||0;
    return total;
  }

  if(typeof stock==="object"){
    return Object.values(stock).reduce((sum,value)=>sum+(Number(value)||0),0);
  }

  return 0;
};

const normalizeBranch=(value)=>String(value||"").trim().toLowerCase();
const normalizeValue=(value)=>String(value||"").trim().toLowerCase();

const getMediaUrl=(value,backendUrl)=>{
  if(!value)return"";
  const url=String(value).trim();
  if(/^(https?:\/\/|data:)/i.test(url))return url;
  return`${backendUrl}/uploads/${url.replace(/^\/+/,"")}`;
};

const formatRestockDate=(value)=>{
  if(!value)return"To be announced";

  try{
    return new Date(value).toLocaleDateString("en-PH",{
      year:"numeric",
      month:"short",
      day:"numeric"
    });
  }catch{
    return"To be announced";
  }
};

const getColorLabel=({color,colorHex})=>color?.trim()||colorHex?.trim()||"Default";

const Product=()=>{
  const{products,currency,addToCart,backendUrl,user,token}=useContext(ShopContext);
  const{productId,id}=useParams();
  const pid=productId||id||"";
  const navigate=useNavigate();
  const location=useLocation();

  const[productData,setProductData]=useState(null);
  const[selectedImage,setSelectedImage]=useState("");
  const[size,setSize]=useState("");
  const[quantity,setQuantity]=useState(1);
  const[activeTab,setActiveTab]=useState("description");
  const[canReview,setCanReview]=useState(false);
  const[showSizeChart,setShowSizeChart]=useState(false);
  const[tryOnModalOpen,setTryOnModalOpen]=useState(false);
  const[show3DModalOpen,setShow3DModalOpen]=useState(false);
  const[branches,setBranches]=useState([]);
  const[purchaseWarning,setPurchaseWarning]=useState("");
  const[addingToCart,setAddingToCart]=useState(false);

  const warningTimeoutRef=useRef(null);
  const addToCartBtnRef=useRef(null);
  const product3DViewerRef=useRef(null);
  const addLockRef=useRef(false);

  const showWarning=useCallback((message)=>{
    if(warningTimeoutRef.current)clearTimeout(warningTimeoutRef.current);
    setPurchaseWarning(message);

    warningTimeoutRef.current=setTimeout(()=>{
      setPurchaseWarning("");
    },4000);
  },[]);

  const clearWarning=useCallback(()=>{
    if(warningTimeoutRef.current)clearTimeout(warningTimeoutRef.current);
    setPurchaseWarning("");
  },[]);

  useEffect(()=>{
    return()=>{
      if(warningTimeoutRef.current)clearTimeout(warningTimeoutRef.current);
    };
  },[]);

  const isLoggedIn=Boolean(user&&token);
  const validPid=pid&&!["undefined","null"].includes(String(pid));

  const loadProduct=useCallback(async()=>{
    if(!validPid){
      setProductData(false);
      return;
    }

    try{
      const{data}=await axios.get(`${backendUrl}/api/product/single/${pid}`,{timeout:10000});

      if(!data?.success||!data?.product){
        setProductData(false);
        return;
      }

      const product=data.product;

      setProductData(product);
      setSelectedImage(product.images?.[0]?getMediaUrl(product.images[0],backendUrl):"");
      setSize("");
      setQuantity(1);
      setShowSizeChart(false);
      clearWarning();
    }catch(error){
      console.error("LOAD PRODUCT ERROR:",error);
      setProductData(false);
    }
  },[backendUrl,pid,validPid,clearWarning]);

  const loadBranches=useCallback(async()=>{
    try{
      const{data}=await axios.get(`${backendUrl}/api/branch/list`,{timeout:8000});
      setBranches(data?.success&&Array.isArray(data.branches)?data.branches:[]);
    }catch(error){
      console.log("BRANCH LOAD ERROR:",error?.message);
      setBranches([]);
    }
  },[backendUrl]);

  const loadCanReview=useCallback(async()=>{
    if(!token||!validPid){
      setCanReview(false);
      return;
    }

    try{
      const{data}=await axios.get(`${backendUrl}/api/product/can-review/${pid}`,{
        headers:{
          Authorization:`Bearer ${token}`,
          token
        },
        timeout:8000
      });

      setCanReview(Boolean(data?.success&&data?.canReview));
    }catch{
      setCanReview(false);
    }
  },[backendUrl,pid,token,validPid]);

  useEffect(()=>{
    if(!validPid){
      setProductData(false);
      return;
    }

    loadProduct();
    loadBranches();
  },[loadProduct,loadBranches,validPid]);

  useEffect(()=>{
    if(!validPid){
      setCanReview(false);
      return;
    }

    loadCanReview();
  },[loadCanReview,validPid]);

  useEffect(()=>{
    if(!validPid){
      window.scrollTo({top:0,behavior:"smooth"});
      return;
    }

    if(location.hash==="#reviews"){
      setActiveTab("reviews");

      setTimeout(()=>{
        document.getElementById("reviews-section")?.scrollIntoView({
          behavior:"smooth",
          block:"start"
        });
      },200);
    }else{
      window.scrollTo({top:0,behavior:"smooth"});
    }
  },[location,validPid]);

  useEffect(()=>{
    if(!token||!user?._id||!productData?._id)return;

    const trackView=async()=>{
      try{
        await axios.post(`${backendUrl}/api/recommendation/track`,{
          userId:user._id,
          productId:productData._id,
          signalType:"view"
        },{
          headers:{
            Authorization:`Bearer ${token}`
          },
          timeout:8000
        });
      }catch(error){
        if(error?.response?.status!==404){
          console.log("TRACK VIEW SKIPPED:",error?.response?.status||error?.message);
        }
      }
    };

    trackView();
  },[backendUrl,productData?._id,token,user?._id]);

  useEffect(()=>{
    if(!show3DModalOpen&&!showSizeChart)return;

    const onKeyDown=(event)=>{
      if(event.key==="Escape"){
        setShow3DModalOpen(false);
        setShowSizeChart(false);
      }
    };

    document.body.style.overflow="hidden";
    window.addEventListener("keydown",onKeyDown);

    return()=>{
      document.body.style.overflow="";
      window.removeEventListener("keydown",onKeyDown);
    };
  },[show3DModalOpen,showSizeChart]);

  const colorVariants=useMemo(()=>{
    if(!productData?.groupCode||!Array.isArray(products))return[];

    const sameGroup=products.filter((item)=>
      item&&
      normalizeValue(item.groupCode)===normalizeValue(productData.groupCode)&&
      !item.isDeleted
    );

    return sameGroup.filter((item,index,array)=>
      index===array.findIndex((x)=>
        normalizeValue(x.color)===normalizeValue(item.color)&&
        normalizeValue(x.colorHex)===normalizeValue(item.colorHex)
      )
    );
  },[products,productData]);

  const normalizedStock=useMemo(()=>{
    if(!productData)return{};

    return Object.fromEntries(
      SIZE_ORDER.map((s)=>[s,getStockValue(productData.stock,s)])
    );
  },[productData]);

  const normalizedPreorderStock=useMemo(()=>{
    if(!productData)return{};

    return Object.fromEntries(
      SIZE_ORDER.map((s)=>[s,getStockValue(productData.preorderStock,s)])
    );
  },[productData]);

  const preorderThreshold=Number(productData?.preorderThreshold??5);
  const preorderEnabled=productData?.preorderEnabled!==false;

  const availableSizes=useMemo(()=>{
    if(!productData)return[];

    const backendSizes=Array.isArray(productData.sizes)
      ?productData.sizes.map((s)=>String(s).toUpperCase())
      :[];

    const stockSizes=productData.stock&&typeof productData.stock==="object"
      ?Object.keys(productData.stock).map((s)=>String(s).toUpperCase())
      :[];

    const preorderSizes=productData.preorderStock&&typeof productData.preorderStock==="object"
      ?Object.keys(productData.preorderStock).map((s)=>String(s).toUpperCase())
      :[];

    return[...new Set([...backendSizes,...stockSizes,...preorderSizes])]
      .filter((s)=>SIZE_ORDER.includes(s))
      .sort((a,b)=>SIZE_ORDER.indexOf(a)-SIZE_ORDER.indexOf(b));
  },[productData]);

  const isSizeAvailable=useCallback((targetSize)=>{
    const actual=Number(normalizedStock[targetSize]||0);
    const preorder=Number(normalizedPreorderStock[targetSize]||0);

    return actual>0||(preorderEnabled&&actual<=0&&preorder>0);
  },[normalizedStock,normalizedPreorderStock,preorderEnabled]);

  useEffect(()=>{
    if(!availableSizes.length){
      setSize("");
      return;
    }

    const preferred=String(user?.preferences?.preferredSize||"").toUpperCase();

    if(preferred&&availableSizes.includes(preferred)&&isSizeAvailable(preferred)){
      setSize(preferred);
      return;
    }

    setSize(availableSizes.find(isSizeAvailable)||"");
  },[availableSizes,isSizeAvailable,pid,user?.preferences?.preferredSize]);

  const reviews=Array.isArray(productData?.reviews)?productData.reviews:[];

  const averageRating=reviews.length
    ?(reviews.reduce((sum,item)=>sum+Number(item.rating||0),0)/reviews.length).toFixed(1)
    :"0.0";

  const finalPrice=useMemo(()=>{
    if(!productData)return"0.00";

    const price=Number(productData.price||0);
    const discount=Number(productData.salePercent||0);

    if(productData.onSale&&discount>0){
      return Math.max(price-(price*discount)/100,0).toFixed(2);
    }

    return price.toFixed(2);
  },[productData]);

  const displayColor=productData?.color||"Default";

  const selectedActualStock=size?Number(normalizedStock[size]||0):0;
  const selectedPreorderStock=size?Number(normalizedPreorderStock[size]||0):0;

  const totalProductStock=getTotalStock(productData?.stock);
  const totalPreorderStock=getTotalStock(productData?.preorderStock);

  const isProductPreOrder=SIZE_ORDER.some((s)=>{
    const actual=Number(normalizedStock[s]||0);
    const preorder=Number(normalizedPreorderStock[s]||0);

    return preorderEnabled&&actual<=0&&preorder>0;
  });

  const isProductOutOfStock=
    totalProductStock<=0&&
    (!preorderEnabled||totalPreorderStock<=0);

  const isProductSellingFast=
    !isProductPreOrder&&
    totalProductStock>0&&
    totalProductStock<=10;

  const isSelectedSizePreOrder=Boolean(
    preorderEnabled&&
    size&&
    selectedActualStock<=0&&
    selectedPreorderStock>0
  );

  const isSelectedSizeOutOfStock=Boolean(
    size&&
    selectedActualStock<=0&&
    (!preorderEnabled||selectedPreorderStock<=0)
  );

  const selectedStock=isSelectedSizePreOrder
    ?selectedPreorderStock
    :selectedActualStock;

  const expectedRestockDate=formatRestockDate(productData?.preorderRestockDate);

  const has3DModel=Boolean(productData?.model3d);

  const previewVideoUrl=productData?.previewVideo
    ?getMediaUrl(productData.previewVideo,backendUrl)
    :"";

  const modelFileName=String(productData?.model3d||"")
    .split("?")[0]
    .toLowerCase();

  const isVideoFile=[".mp4",".webm",".ogg"].some((ext)=>modelFileName.endsWith(ext));
  const isModelViewerFile=[".glb",".gltf"].some((ext)=>modelFileName.endsWith(ext));

  const previewFileUrl=has3DModel
    ?getMediaUrl(productData.model3d,backendUrl)
    :"";

  const availableBranches=useMemo(()=>{
    if(!productData||!Array.isArray(products))return[];

    const activeBranches=Array.isArray(branches)
      ?branches.filter((b)=>b.isActive)
      :[];

    const matchesProduct=(item)=>{
      if(!item||item.isDeleted)return false;

      if(productData.sku&&item.sku){
        return normalizeValue(item.sku)===normalizeValue(productData.sku);
      }

      if(productData.groupCode&&item.groupCode){
        const sameGroup=
          normalizeValue(item.groupCode)===normalizeValue(productData.groupCode);

        const sameColor=
          normalizeValue(item.color)===normalizeValue(productData.color);

        const sameColorHex=
          !productData.colorHex||
          !item.colorHex||
          normalizeValue(item.colorHex)===normalizeValue(productData.colorHex);

        return sameGroup&&sameColor&&sameColorHex;
      }

      return(
        normalizeValue(item.name)===normalizeValue(productData.name)&&
        normalizeValue(item.category)===normalizeValue(productData.category)&&
        normalizeValue(item.color)===normalizeValue(productData.color)
      );
    };

    const matchingProducts=products.filter(matchesProduct);
    const fallback=new Map();

    matchingProducts.forEach((item)=>{
      const code=normalizeBranch(item.branch);

      if(!code||fallback.has(code))return;

      fallback.set(code,{
        _id:code,
        code,
        name:item.branch,
        isActive:true
      });
    });

    const source=activeBranches.length>0
      ?activeBranches
      :Array.from(fallback.values());

    return source.map((branchItem)=>{
      const branch=normalizeBranch(branchItem.code||branchItem.name);

      const items=matchingProducts.filter(
        (item)=>normalizeBranch(item.branch)===branch
      );

      const totalStock=items.reduce(
        (sum,item)=>sum+getTotalStock(item.stock),
        0
      );

      return{
        branch,
        branchName:branchItem.name||branchItem.code||branch,
        totalStock,
        available:totalStock>0||isProductPreOrder
      };
    });
  },[branches,isProductPreOrder,productData,products]);

  const{recommendations:styleRecommendations}=useRecommendations({
    backendUrl,
    products,
    productId:productData?._id||null,
    category:productData?.category||"",
    color:productData?.color||"",
    userId:user?._id||null,
    limit:4,
    enabled:Boolean(productData?._id)
  });

  useEffect(()=>{
    if(!size)return;

    if(selectedStock<=0){
      setQuantity(1);
      return;
    }

    if(quantity>selectedStock){
      setQuantity(selectedStock);
    }

    if(quantity<1){
      setQuantity(1);
    }
  },[quantity,selectedStock,size]);

  useEffect(()=>{
    if(size&&!isSelectedSizeOutOfStock&&selectedStock>0){
      clearWarning();
    }
  },[size,isSelectedSizeOutOfStock,selectedStock,clearWarning]);

  const animateToCart=useCallback((buttonElement)=>{
    try{
      const cartEl=document.getElementById("cart-icon-target");
      const buttonEl=buttonElement||addToCartBtnRef.current;

      if(!cartEl||!buttonEl||!selectedImage)return;

      const buttonRect=buttonEl.getBoundingClientRect();
      const cartRect=cartEl.getBoundingClientRect();

      const startX=buttonRect.left+buttonRect.width/2;
      const startY=buttonRect.top+buttonRect.height/2;
      const endX=cartRect.left+cartRect.width/2;
      const endY=cartRect.top+cartRect.height/2;

      const flyer=document.createElement("div");

      Object.assign(flyer.style,{
        position:"fixed",
        left:`${startX-34}px`,
        top:`${startY-34}px`,
        width:"68px",
        height:"68px",
        borderRadius:"9999px",
        overflow:"hidden",
        zIndex:"99999",
        pointerEvents:"none",
        background:"#ffffff",
        border:"2px solid rgba(255,255,255,0.95)",
        boxShadow:"0 20px 55px rgba(0,0,0,0.30), 0 5px 15px rgba(0,0,0,0.15)",
        willChange:"left, top, transform, opacity",
        transform:"translate3d(0,0,0) scale(1)"
      });

      const img=document.createElement("img");

      Object.assign(img.style,{
        width:"100%",
        height:"100%",
        objectFit:"contain",
        display:"block",
        padding:"5px"
      });

      img.src=selectedImage;
      img.alt="";

      flyer.appendChild(img);
      document.body.appendChild(flyer);

      const duration=850;
      const arcHeight=125;
      const animationStart=performance.now();

      const animate=(currentTime)=>{
        if(!flyer.isConnected)return;

        const progress=Math.min(
          Math.max((currentTime-animationStart)/duration,0),
          1
        );

        const ease=1-Math.pow(1-progress,3);
        const x=startX+(endX-startX)*ease;
        const baseY=startY+(endY-startY)*ease;
        const y=baseY-Math.sin(Math.PI*ease)*arcHeight;
        const scale=1-ease*0.72;
        const rotation=ease*18;
        const opacity=ease>0.76?1-(ease-0.76)/0.24:1;

        flyer.style.left=`${x-34}px`;
        flyer.style.top=`${y-34}px`;
        flyer.style.transform=`translate3d(0,0,0) scale(${scale}) rotate(${rotation}deg)`;
        flyer.style.opacity=String(Math.max(opacity,0));

        if(progress<1){
          window.requestAnimationFrame(animate);
        }else{
          flyer.remove();
          cartEl.classList.add("cart-bump");

          setTimeout(()=>{
            cartEl.classList.remove("cart-bump");
          },450);
        }
      };

      window.requestAnimationFrame(animate);
    }catch(error){
      console.log("CART ANIMATION SKIPPED:",error?.message||error);
    }
  },[selectedImage]);

  const zoomInModel=()=>product3DViewerRef.current?.zoomIn?.();
  const zoomOutModel=()=>product3DViewerRef.current?.zoomOut?.();
  const resetModelView=()=>product3DViewerRef.current?.reset?.();
  const toggleAutoRotate=()=>product3DViewerRef.current?.toggleAutoRotate?.();

  const validatePurchase=()=>{
    clearWarning();

    if(!token||!user?._id){
      showWarning("Please login to continue with your purchase.");
      navigate("/login");
      return false;
    }

    if(!productData?._id){
      showWarning("Product information is unavailable.");
      return false;
    }

    if(isProductOutOfStock){
      showWarning("This product is currently out of stock.");
      return false;
    }

    if(!size){
      showWarning("Please select a size before continuing.");
      return false;
    }

    if(isSelectedSizeOutOfStock){
      showWarning(`Size ${size} is currently out of stock.`);
      return false;
    }

    const safeQuantity=Number(quantity);

    if(!Number.isFinite(safeQuantity)||safeQuantity<1){
      showWarning("Please select a valid quantity.");
      return false;
    }

    if(safeQuantity>selectedStock){
      showWarning(
        isSelectedSizePreOrder
          ?`Only ${selectedStock} pre-order slot${selectedStock===1?"":"s"} left for size ${size}.`
          :`Only ${selectedStock} item${selectedStock===1?"":"s"} left for size ${size}.`
      );

      return false;
    }

    return true;
  };

  const handleBuyNow=()=>{
    if(!validatePurchase())return;

    const safeQuantity=Math.max(1,Math.min(Number(quantity)||1,selectedStock));

    localStorage.setItem("checkout_cart",JSON.stringify([
      {
        ...productData,
        quantity:safeQuantity,
        size:String(size).toUpperCase(),
        isPreorder:Boolean(isSelectedSizePreOrder),
        expectedRestockDate:productData.preorderRestockDate||null,
        preorderNote:productData.preorderNote||""
      }
    ]));

    navigate("/place-order");
  };

  const handleTryItOn=()=>{
    setTryOnModalOpen(true);
  };

  const handleShow3D=()=>{
    if(!isLoggedIn){
      showWarning("Please login first to use the 3D product view.");
      return;
    }

    if(!has3DModel){
      showWarning("No 3D model or video is attached to this product.");
      return;
    }

    clearWarning();
    setShow3DModalOpen(true);
  };

  const handleAddToCart=async(event)=>{
    if(addLockRef.current||addingToCart)return;
    if(!validatePurchase())return;

    const clickedButton=event?.currentTarget||addToCartBtnRef.current;
    const safeQuantity=Math.max(1,Math.min(Number(quantity)||1,selectedStock));
    const normalizedSize=String(size||"").trim().toUpperCase();

    addLockRef.current=true;
    setAddingToCart(true);

    try{
      console.log("=================================");
      console.log("ADD TO CART REQUEST");
      console.log("PRODUCT:",productData._id);
      console.log("SIZE:",normalizedSize);
      console.log("QUANTITY:",safeQuantity);
      console.log("ACTUAL STOCK:",selectedActualStock);
      console.log("PREORDER STOCK:",selectedPreorderStock);
      console.log("IS PREORDER:",isSelectedSizePreOrder);
      console.log("=================================");

      const added=await addToCart(
        productData._id,
        normalizedSize,
        safeQuantity
      );

      if(added===false){
        showWarning("Unable to add this product to your cart. Please try again.");
        return;
      }

      clearWarning();

      setTimeout(()=>{
        animateToCart(clickedButton);
      },0);

      if(token&&user?._id){
        axios.post(`${backendUrl}/api/recommendation/track`,{
          userId:user._id,
          productId:productData._id,
          signalType:"cart"
        },{
          headers:{
            Authorization:`Bearer ${token}`
          },
          timeout:8000
        }).catch((error)=>{
          console.log(
            "TRACK CART SKIPPED:",
            error?.response?.status||
            error?.message||
            "Recommendation service unavailable"
          );
        });
      }
    }catch(error){
      console.error("ADD TO CART ERROR:",error?.response?.data||error);

      showWarning(
        error?.response?.data?.message||
        error?.message||
        "Failed to add this product to your cart."
      );
    }finally{
      addLockRef.current=false;
      setAddingToCart(false);
    }
  };

  if(productData===null){
    return(
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 border border-black border-t-transparent rounded-full animate-spin"/>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.32em] text-black/40">
            Loading Product
          </p>
        </div>
      </div>
    );
  }

  if(productData===false){
    return(
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-black/40">
            Saint Clothing
          </p>

          <h1 className="mt-4 text-3xl md:text-5xl font-black uppercase tracking-[-0.04em]">
            Product Not Found
          </h1>

          <button
            type="button"
            onClick={()=>navigate("/collection")}
            className="mt-7 inline-flex h-12 items-center justify-center bg-black px-7 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black/80"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  const scrollToReviews=()=>{
    setActiveTab("reviews");

    setTimeout(()=>{
      document.getElementById("reviews-section")?.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });
    },100);
  };

  return(
    <>
      <style>{`
        .cart-bump{
          animation:cartBump .45s cubic-bezier(.2,.8,.2,1);
          transform-origin:center;
        }

        @keyframes cartBump{
          0%{transform:scale(1)}
          30%{transform:scale(1.25)}
          55%{transform:scale(.92)}
          75%{transform:scale(1.08)}
          100%{transform:scale(1)}
        }

        @keyframes productFadeIn{
          from{opacity:0;transform:translateY(14px)}
          to{opacity:1;transform:translateY(0)}
        }

        @keyframes slidePanelIn{
          from{opacity:0;transform:translateX(36px)}
          to{opacity:1;transform:translateX(0)}
        }

        @keyframes modalFade{
          from{opacity:0}
          to{opacity:1}
        }

        @keyframes warningIn{
          from{opacity:0;transform:translateY(-6px)}
          to{opacity:1;transform:translateY(0)}
        }

        .product-page-enter{animation:productFadeIn .55s ease both}
        .modal-fade{animation:modalFade .2s ease both}
        .warning-container{animation:warningIn .22s ease both}
        .scrollbar-thin-hide::-webkit-scrollbar{display:none}
        .scrollbar-thin-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <main className="min-h-screen bg-[#F5F4F0] text-[#0A0D17] product-page-enter">
        <div className="px-5 pt-8 sm:px-8 md:px-[7vw] lg:px-[10vw] lg:pt-12">
          <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-black"/>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.28em]">
                Saint Clothing
              </p>
            </div>

            <p className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.24em] text-black/40">
              Product / Details
            </p>
          </div>
        </div>

        <section className="px-5 pb-10 pt-5 sm:px-8 sm:pb-14 sm:pt-7 md:px-[7vw] lg:px-[10vw] lg:pb-20 lg:pt-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(390px,0.88fr)] lg:gap-14 xl:gap-20">
            <ProductGallery
              productData={productData}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              backendUrl={backendUrl}
              getMediaUrl={getMediaUrl}
              isProductPreOrder={isProductPreOrder}
              isProductOutOfStock={isProductOutOfStock}
              previewVideoUrl={previewVideoUrl}
              handleTryItOn={handleTryItOn}
              handleShow3D={handleShow3D}
              has3DModel={has3DModel}
            />

            <div className="relative">
              {purchaseWarning&&(
                <div className="warning-container mb-4 flex items-start gap-3 border border-black/10 bg-[#ECEAE4] px-4 py-3.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center border border-black/20 text-[9px] font-black">
                    !
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-black/40">
                      Attention
                    </p>

                    <p className="mt-1 text-[10px] font-bold leading-5 text-black/75">
                      {purchaseWarning}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearWarning}
                    aria-label="Dismiss warning"
                    className="flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-black text-black/30 transition hover:text-black"
                  >
                    ×
                  </button>
                </div>
              )}

              <ProductInfo
                productData={productData}
                currency={currency}
                isLoggedIn={isLoggedIn}
                averageRating={averageRating}
                reviews={reviews}
                scrollToReviews={scrollToReviews}
                finalPrice={finalPrice}
                isProductOutOfStock={isProductOutOfStock}
                isProductPreOrder={isProductPreOrder}
                isProductSellingFast={isProductSellingFast}
                displayColor={displayColor}
                colorVariants={colorVariants}
                backendUrl={backendUrl}
                getMediaUrl={getMediaUrl}
                getColorLabel={getColorLabel}
                navigate={navigate}
                expectedRestockDate={expectedRestockDate}
                user={user}
                availableSizes={availableSizes}
                normalizedStock={normalizedStock}
                normalizedPreorderStock={normalizedPreorderStock}
                preorderEnabled={preorderEnabled}
                preorderThreshold={preorderThreshold}
                size={size}
                setSize={(newSize)=>{
                  setSize(newSize);
                  setQuantity(1);
                  clearWarning();
                }}
                isSelectedSizePreOrder={isSelectedSizePreOrder}
                selectedPreorderStock={selectedPreorderStock}
                selectedActualStock={selectedActualStock}
                isSelectedSizeOutOfStock={isSelectedSizeOutOfStock}
                quantity={quantity}
                setQuantity={setQuantity}
                selectedStock={selectedStock}
                handleAddToCart={handleAddToCart}
                handleBuyNow={handleBuyNow}
                addToCartBtnRef={addToCartBtnRef}
                setShowSizeChart={setShowSizeChart}
                addingToCart={addingToCart}
              />
            </div>
          </div>
        </section>

        <section
          id="reviews-section"
          className="border-y border-black/10 bg-[#ECEAE4] px-5 py-12 sm:px-8 sm:py-16 md:px-[7vw] lg:px-[10vw] lg:py-20"
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.32fr_0.68fr] lg:gap-16">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-black/40">
                Product Information
              </p>

              <h2 className="mt-4 max-w-[260px] text-3xl font-black uppercase leading-[0.95] tracking-[-0.045em] sm:text-4xl">
                Details
                <br/>
                Matter.
              </h2>
            </div>

            <div>
              <div className="flex overflow-x-auto border-b border-black/15 scrollbar-thin-hide">
                {[
                  ["description","Description"],
                  ["branches","Branches"],
                  ["reviews",`Reviews (${reviews.length})`]
                ].map(([tab,label])=>(
                  <button
                    key={tab}
                    type="button"
                    onClick={()=>setActiveTab(tab)}
                    className={`mr-6 shrink-0 border-b-2 py-4 text-[9px] font-black uppercase tracking-[0.16em] transition ${
                      activeTab===tab
                        ?"border-black text-black"
                        :"border-transparent text-black/35 hover:text-black"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab==="description"&&(
                <div className="pt-7">
                  <p className="max-w-3xl text-sm leading-7 text-black/60 sm:text-base sm:leading-8">
                    {productData.description||"No description available."}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-px border border-black/10 bg-black/10 sm:grid-cols-3">
                    {[
                      ["Category",productData.category||"Product"],
                      ["Color",displayColor],
                      ["Fit",productData.fitType||"Standard"]
                    ].map(([label,value])=>(
                      <div key={label} className="bg-[#ECEAE4] p-4 sm:p-5">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-black/35">
                          {label}
                        </p>

                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.08em]">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab==="branches"&&(
                <div className="pt-7">
                  <p className="max-w-2xl text-sm leading-7 text-black/50">
                    Check which Saint Clothing branch currently has this exact product available.
                  </p>

                  <div className="mt-7 grid grid-cols-1 gap-px border border-black/10 bg-black/10 md:grid-cols-2">
                    {availableBranches.length?(
                      availableBranches.map((item)=>(
                        <div key={item.branch} className="bg-[#ECEAE4] p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                                {item.branchName}
                              </p>

                              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-black/35">
                                {item.branch}
                              </p>
                            </div>

                            <span className={`shrink-0 px-2 py-1 text-[7px] font-black uppercase tracking-[0.12em] ${
                              item.available
                                ?"bg-black text-white"
                                :"border border-black/15 text-black/30"
                            }`}>
                              {item.available?"Available":"Unavailable"}
                            </span>
                          </div>

                          <div className="mt-6 flex items-end justify-between border-t border-black/10 pt-4">
                            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-black/35">
                              Product Stock
                            </p>

                            <p className="text-lg font-black tracking-[-0.03em]">
                              {item.totalStock}
                            </p>
                          </div>
                        </div>
                      ))
                    ):(
                      <div className="bg-[#ECEAE4] p-6 text-sm font-medium text-black/40 md:col-span-2">
                        No branch data available.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab==="reviews"&&(
                <div className="pt-7">
                  <ReviewSection
                    productId={productData._id}
                    reviews={reviews}
                    backendUrl={backendUrl}
                    token={token}
                    user={user}
                    canReview={canReview}
                    onReviewAdded={loadProduct}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:px-8 sm:py-16 md:px-[7vw] lg:px-[10vw] lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-5 border-b border-black/10 pb-5 sm:mb-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-black/35">
                Explore More
              </p>

              <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.035em] sm:text-3xl">
                Related Pieces
              </h2>
            </div>

            <span className="hidden text-[8px] font-black uppercase tracking-[0.2em] text-black/30 sm:block">
              Saint Clothing
            </span>
          </div>

          <RelatedProducts
            category={productData.category}
            currentProductId={productData._id}
          />
        </section>

        {styleRecommendations.length>0&&(
          <section className="border-t border-black/10 bg-[#ECEAE4] px-5 py-12 sm:px-8 sm:py-16 md:px-[7vw] lg:px-[10vw] lg:py-20">
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-black/10 pb-6 sm:mb-10 sm:flex-row sm:items-end">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/35">
                  Saint Styling
                </p>

                <h2 className="mt-3 text-3xl font-black uppercase leading-none tracking-[-0.045em] sm:text-4xl">
                  Complete
                  <br className="sm:hidden"/>{" "}
                  The Look
                </h2>
              </div>

              <p className="max-w-xs text-[10px] font-medium uppercase leading-5 tracking-[0.06em] text-black/40">
                Pieces selected to complement this product.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
              {styleRecommendations.map((item)=>(
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
                  autoPlayPreview
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {showSizeChart&&productData.sizeChartImage&&(
        <div className="modal-fade fixed inset-0 z-[85]">
          <button
            type="button"
            aria-label="Close size chart"
            onClick={()=>setShowSizeChart(false)}
            className="absolute inset-0 h-full w-full bg-black/45 backdrop-blur-[3px]"
          />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-[470px] flex-col border-l border-black/10 bg-[#F5F4F0] [animation:slidePanelIn_.22s_ease]">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-5 sm:px-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-black/35">
                  Saint Clothing
                </p>

                <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.03em]">
                  Size Guide
                </h2>
              </div>

              <button
                type="button"
                onClick={()=>setShowSizeChart(false)}
                className="flex h-10 w-10 items-center justify-center border border-black/10 bg-transparent text-sm font-black transition hover:bg-black hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="overflow-hidden bg-[#ECEAE4]">
                <img
                  src={getMediaUrl(productData.sizeChartImage,backendUrl)}
                  alt="Size chart"
                  className="h-auto w-full object-contain"
                />
              </div>

              <div className="mt-6 border-t border-black/10 pt-5">
                <p className="text-[9px] font-black uppercase tracking-[0.22em]">
                  Fit Guide
                </p>

                <p className="mt-3 text-sm leading-7 text-black/55">
                  Compare your body measurements with the chart for a better fit. If you want a looser streetwear look, choose one size up from your regular fit.
                </p>
              </div>
            </div>

            <div className="border-t border-black/10 p-5 sm:p-6">
              <button
                type="button"
                onClick={()=>setShowSizeChart(false)}
                className="h-12 w-full bg-black text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black/85"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {tryOnModalOpen&&(
        <div className="modal-fade fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden border border-white/10 bg-[#111] text-white shadow-[0_35px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/35">
                  Saint Clothing / Virtual
                </p>

                <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.02em]">
                  Try It On
                </h2>
              </div>

              <button
                type="button"
                onClick={()=>setTryOnModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-xs font-black transition hover:bg-white hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
              <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
                <p className="max-w-md text-2xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-3xl">
                  Experience the product before you wear it.
                </p>

                <p className="mt-5 max-w-md text-sm leading-6 text-white/45">
                  Scan the QR code or open the app on your phone to continue using Saint Clothing Try It On.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  <a
                    href="https://your-app-download-link.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center bg-white px-5 text-[9px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-white/85"
                  >
                    Download App
                  </a>

                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center border border-white/10 px-5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:border-white"
                  >
                    App Link
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center p-6">
                <div className="aspect-square w-full max-w-[250px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex h-full w-full items-center justify-center border border-white/5 bg-[#181818]">
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/60">
                        QR Placeholder
                      </p>

                      <p className="mt-2 text-[8px] uppercase tracking-[0.12em] text-white/25">
                        Put your QR here
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {show3DModalOpen&&(
        <div className="fixed inset-0 z-[95] bg-[#F5F4F0]">
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between border-b border-black/10 bg-[#F5F4F0] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/35">
                  Saint Clothing
                </p>

                <h2 className="mt-2 text-lg font-black uppercase tracking-[-0.025em] sm:text-xl">
                  3D Product Preview
                </h2>
              </div>

              <button
                type="button"
                onClick={()=>setShow3DModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center border border-black/10 text-xs font-black transition hover:bg-black hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="relative flex min-h-0 items-center justify-center bg-[#ECEAE4] p-3 sm:p-6">
                <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-1 sm:left-6 sm:top-6">
                  <button
                    type="button"
                    onClick={zoomInModel}
                    className="border border-black/10 bg-[#F5F4F0] px-3 py-2 text-[8px] font-black uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                  >
                    Zoom +
                  </button>

                  <button
                    type="button"
                    onClick={zoomOutModel}
                    className="border border-black/10 bg-[#F5F4F0] px-3 py-2 text-[8px] font-black uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                  >
                    Zoom −
                  </button>

                  <button
                    type="button"
                    onClick={resetModelView}
                    className="border border-black/10 bg-[#F5F4F0] px-3 py-2 text-[8px] font-black uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                  >
                    Reset
                  </button>

                  {isModelViewerFile&&(
                    <button
                      type="button"
                      onClick={toggleAutoRotate}
                      className="border border-black/10 bg-[#F5F4F0] px-3 py-2 text-[8px] font-black uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                    >
                      Rotate
                    </button>
                  )}
                </div>

                <div className="relative h-[65vh] w-full max-w-6xl overflow-hidden border border-black/10 bg-[#F5F4F0] lg:h-[78vh]">
                  <Product3DViewer
                    ref={product3DViewerRef}
                    modelUrl={previewFileUrl}
                    videoUrl={previewVideoUrl}
                    imageUrl={
                      productData.images?.[0]
                        ?getMediaUrl(productData.images[0],backendUrl)
                        :""
                    }
                    productName={productData.name}
                  />
                </div>
              </div>

              <aside className="overflow-y-auto border-t border-black/10 bg-[#F5F4F0] p-5 sm:p-6 lg:border-l lg:border-t-0">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-black/35">
                  Product Details
                </p>

                <h3 className="mt-4 text-3xl font-black uppercase leading-[0.9] tracking-[-0.045em]">
                  {productData.name}
                </h3>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="bg-black px-3 py-2 text-[8px] font-black uppercase tracking-[0.16em] text-white">
                    {productData.category||"Product"}
                  </span>

                  <span className="border border-black/10 px-3 py-2 text-[8px] font-black uppercase tracking-[0.16em] text-black/50">
                    Color / {displayColor}
                  </span>

                  <span className="border border-black/10 px-3 py-2 text-[8px] font-black uppercase tracking-[0.16em] text-black/50">
                    {isModelViewerFile?"3D Model":isVideoFile?"Video":"Preview"}
                  </span>
                </div>

                <div className="mt-8 border-t border-black/10 pt-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em]">
                    How To View
                  </p>

                  <p className="mt-3 text-sm leading-7 text-black/50">
                    Drag the item to rotate. Use the controls to inspect the shape, silhouette, and details before adding it to your bag.
                  </p>
                </div>

                <div className="mt-6 border-t border-black/10 pt-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em]">
                    File Type
                  </p>

                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em]">
                    {isModelViewerFile?"Interactive 3D Model":isVideoFile?"Video Preview":"Image Preview"}
                  </p>
                </div>

                {previewFileUrl&&(
                  <div className="mt-6 border-t border-black/10 pt-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em]">
                      3D File
                    </p>

                    <p className="mt-3 break-all text-[9px] font-medium leading-5 text-black/35">
                      {previewFileUrl}
                    </p>

                    <a
                      href={previewFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex h-10 items-center bg-black px-4 text-[8px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-black/85"
                    >
                      Open File
                    </a>
                  </div>
                )}

                <div className="mt-8 grid gap-2">
                  <button
                    type="button"
                    disabled={addingToCart}
                    onClick={handleAddToCart}
                    className="flex h-12 items-center justify-between bg-black px-4 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingToCart?"Adding...":"Add to Cart"}
                    <span className="text-lg">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={()=>setShow3DModalOpen(false)}
                    className="h-12 border border-black/10 text-[9px] font-black uppercase tracking-[0.18em] transition hover:border-black"
                  >
                    Back to Product
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Product;