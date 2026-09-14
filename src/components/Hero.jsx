import React,{useContext,useEffect,useMemo,useState,useCallback,useRef}from"react";
import{Carousel}from"antd";
import{useNavigate}from"react-router-dom";
import{ShopContext}from"../context/ShopContext";
import axios from"axios";

const backendUrl=import.meta.env.VITE_BACKEND_URL;
const HERO_CACHE_KEY="saint_home_hero";

const resolveImage=(img)=>{
  if(!img)return"";
  const value=String(img).trim();
  if(value.startsWith("http://")||value.startsWith("https://"))return value;
  if(value.startsWith("/uploads/"))return`${backendUrl}${value}`;
  return`${backendUrl}/uploads/${value.replace(/^\/+/,"")}`;
};

const Hero=()=>{
  const navigate=useNavigate();
  const{user,token}=useContext(ShopContext);
  const carouselWrapperRef=useRef(null);
  const[activeSlide,setActiveSlide]=useState(0);
  const[greetingPrefix,setGreetingPrefix]=useState("");
  const[heroData,setHeroData]=useState({
    tickerEnabled:true,
    newUserGreeting:"Welcome",
    returningUserGreeting:"Welcome back",
    tickerText:"{greeting}, {name}! Try our mobile AR fitting experience and explore the latest from Saint Clothing.",
    slides:[]
  });

  const syncCarouselAccessibility=useCallback(()=>{
    const root=carouselWrapperRef.current;
    if(!root)return;

    const slides=root.querySelectorAll(".slick-slide");

    slides.forEach((slide)=>{
      const hidden=slide.getAttribute("aria-hidden")==="true";
      const focusable=slide.querySelectorAll("button,a[href],input,select,textarea,[tabindex]");

      focusable.forEach((element)=>{
        if(hidden){
          element.setAttribute("tabindex","-1");
        }else if(element.classList.contains("hero-cta")){
          element.setAttribute("tabindex","0");
        }
      });
    });
  },[]);

  const handleSlideChange=useCallback((current)=>{
    setActiveSlide(current);

    requestAnimationFrame(()=>{
      syncCarouselAccessibility();
    });

    setTimeout(()=>{
      syncCarouselAccessibility();
    },750);
  },[syncCarouselAccessibility]);

  const fetchHero=useCallback(async(forceRefresh=false)=>{
    try{
      if(!forceRefresh){
        const cachedHero=sessionStorage.getItem(HERO_CACHE_KEY);

        if(cachedHero){
          const parsedHero=JSON.parse(cachedHero);
          setHeroData(parsedHero);
          return;
        }
      }

      const{data}=await axios.get(`${backendUrl}/api/hero`);

      if(data.success&&data.hero){
        const slides=(data.hero.slides||[]).map((slide)=>({
          title:slide.title||"",
          subtitle:slide.subtitle||"",
          description:slide.description||"",
          cta:slide.cta||"Explore",
          image:resolveImage(slide.image),
          action:slide.action||"collection"
        })).filter((slide)=>slide.image);

        const nextHeroData={
          tickerEnabled:typeof data.hero.tickerEnabled==="boolean"?data.hero.tickerEnabled:true,
          newUserGreeting:data.hero.newUserGreeting||"Welcome",
          returningUserGreeting:data.hero.returningUserGreeting||"Welcome back",
          tickerText:data.hero.tickerText||"{greeting}, {name}! Try our mobile AR fitting experience and explore the latest from Saint Clothing.",
          slides
        };

        setHeroData(nextHeroData);
        sessionStorage.setItem(HERO_CACHE_KEY,JSON.stringify(nextHeroData));
      }
    }catch(error){
      console.error("Hero fetch error:",error);
    }
  },[]);

  useEffect(()=>{
    fetchHero();

    const handleRefresh=()=>{
      sessionStorage.removeItem(HERO_CACHE_KEY);
      fetchHero(true);
    };

    window.addEventListener("hero-refresh",handleRefresh);
    return()=>window.removeEventListener("hero-refresh",handleRefresh);
  },[fetchHero]);

  useEffect(()=>{
    if(!heroData.slides.length)return;

    const timer=setTimeout(()=>{
      syncCarouselAccessibility();
    },100);

    return()=>clearTimeout(timer);
  },[heroData.slides,syncCarouselAccessibility]);

  const isLoggedInUser=Boolean(token&&(user?._id||user?.id||user?.email));

  const resolvedUserName=useMemo(()=>{
    if(!isLoggedInUser)return"";
    if(user?.firstName?.trim())return user.firstName.trim();
    if(user?.name?.trim())return user.name.trim().split(" ")[0];
    if(user?.email)return user.email.split("@")[0];
    return"";
  },[isLoggedInUser,user]);

  useEffect(()=>{
    if(!isLoggedInUser||!user?._id||!token){
      setGreetingPrefix("");
      return;
    }

    const loginCountKey=`saint_login_count_${user._id}`;
    const lastTokenKey=`saint_last_login_token_${user._id}`;
    const lastToken=localStorage.getItem(lastTokenKey);
    let count=Number(localStorage.getItem(loginCountKey)||0);

    if(lastToken!==token){
      count+=1;
      localStorage.setItem(loginCountKey,String(count));
      localStorage.setItem(lastTokenKey,token);
    }

    setGreetingPrefix(count<=1?heroData.newUserGreeting||"Welcome":heroData.returningUserGreeting||"Welcome back");
  },[isLoggedInUser,user?._id,token,heroData.newUserGreeting,heroData.returningUserGreeting]);

  const tickerMessage=useMemo(()=>{
    if(!isLoggedInUser||!resolvedUserName||!heroData.tickerEnabled)return"";

    return(heroData.tickerText||"{greeting}, {name}!")
      .replaceAll("{greeting}",greetingPrefix||"Welcome")
      .replaceAll("{name}",resolvedUserName);
  },[isLoggedInUser,resolvedUserName,heroData.tickerEnabled,heroData.tickerText,greetingPrefix]);

  const handleAction=(action)=>{
    if(action==="ar"||action==="collection"){
      navigate("/collection");
      window.scrollTo({top:0,behavior:"smooth"});
      return;
    }

    if(action==="bestseller"){
      const el=document.getElementById("best-seller-section");

      if(el){
        el.scrollIntoView({behavior:"smooth",block:"start"});
      }else{
        navigate("/collection");
        window.scrollTo({top:0,behavior:"smooth"});
      }

      return;
    }

    if(action==="latest"){
      const el=document.getElementById("latest-collection-section");

      if(el){
        el.scrollIntoView({behavior:"smooth",block:"start"});
      }else{
        navigate("/collection");
        window.scrollTo({top:0,behavior:"smooth"});
      }
    }
  };

  if(!heroData.slides.length)return null;

  return(
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-black"aria-label="Featured Saint Clothing collections">
      {isLoggedInUser&&tickerMessage&&(
        <>
          <span className="sr-only">{tickerMessage}</span>

          <div className="ticker-wrap"aria-hidden="true">
            <div className="ticker-track">
              <div className="ticker-text">
                {Array(8).fill(tickerMessage).map((text,i)=>(
                  <span key={i}className="ticker-item">
                    {text}
                    <span className="ticker-separator"> ✦ </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div ref={carouselWrapperRef}className="hero-container">
        <Carousel
          arrows
          infinite
          autoplay
          autoplaySpeed={3000}
          speed={700}
          effect="fade"
          dots
          pauseOnHover={false}
          afterChange={handleSlideChange}
          className="hero-carousel"
        >
          {heroData.slides.map((slide,index)=>(
            <div key={`${slide.title}-${index}`}className="relative h-[420px] w-full sm:h-[500px] md:h-[620px] lg:h-[640px]">
              <img
                className="h-full w-full object-cover"
                src={slide.image}
                alt={slide.title?`${slide.title} - Saint Clothing collection`:"Saint Clothing featured collection"}
                width="1920"
                height="1080"
                loading={index===0?"eager":"lazy"}
                fetchPriority={index===0?"high":"auto"}
                decoding="async"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"aria-hidden="true"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"aria-hidden="true"/>

              <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay"aria-hidden="true">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:"linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)",
                    backgroundSize:"80px 80px"
                  }}
                />
              </div>

              <div className="absolute inset-0 z-10 flex items-end px-5 pb-16 sm:px-8 sm:pb-20 md:px-14 md:pb-24 lg:px-24 lg:pb-28">
                <div className="relative max-w-4xl">
                  {slide.action==="ar"&&(
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-white"aria-hidden="true"/>
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white">
                        Mobile AR Feature
                      </span>
                    </div>
                  )}

                  {index===0?(
                    <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.78] tracking-[-0.08em] text-white sm:text-7xl md:text-7xl lg:text-[7rem]">
                      {slide.title}
                    </h1>
                  ):(
                    <h2 className="max-w-4xl text-4xl font-black uppercase leading-[0.78] tracking-[-0.08em] text-white sm:text-7xl md:text-7xl lg:text-[7rem]">
                      {slide.title}
                    </h2>
                  )}

                  {slide.subtitle&&(
                    <div className="mt-7 flex items-center gap-4">
                      <span className="h-px w-12 bg-white/70"aria-hidden="true"/>
                      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white sm:text-[10px] md:text-xs">
                        {slide.subtitle}
                      </p>
                    </div>
                  )}

                  {slide.description&&(
                    <p className="mt-5 max-w-md text-xs leading-6 text-white/80 sm:text-sm md:text-base">
                      {slide.description}
                    </p>
                  )}

                  <button
                    type="button"
                    tabIndex={index===activeSlide?0:-1}
                    aria-label={`${slide.cta||"Explore"} ${slide.title||"Saint Clothing collection"}`}
                    onClick={()=>handleAction(slide.action)}
                    className="hero-cta group mt-7 inline-flex items-center gap-8 border border-white/40 bg-white px-7 py-4 text-[9px] font-black uppercase tracking-[0.28em] text-black transition-all duration-300 hover:bg-transparent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    <span>{slide.cta}</span>
                    <span className="text-lg transition-transform duration-300 group-hover:translate-x-1"aria-hidden="true">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      <style jsx="true">{`
        .hero-carousel,
        .hero-carousel .slick-list,
        .hero-carousel .slick-track{
          width:100%;
        }

        .hero-carousel .slick-list{
          overflow:hidden;
        }

        .hero-carousel .slick-slide{
          height:auto!important;
        }

        .hero-carousel .slick-slide>div{
          height:100%;
        }

        .ticker-wrap{
          position:absolute;
          top:0;
          width:100%;
          overflow:hidden;
          z-index:40;
          background:rgba(255,255,255,.6);
          backdrop-filter:blur(14px);
          -webkit-backdrop-filter:blur(14px);
          border-bottom:1px solid rgba(0,0,0,.08);
          box-shadow:0 8px 24px rgba(0,0,0,.08);
        }

        .ticker-track{
          display:flex;
          width:max-content;
          animation:tickerLoop 25s linear infinite;
          will-change:transform;
        }

        .ticker-text{
          display:flex;
          white-space:nowrap;
          padding:3px 0;
        }

        .ticker-item{
          padding-right:28px;
          color:#0A0D17;
          font-size:11px;
          font-weight:900;
          letter-spacing:.1em;
          text-transform:uppercase;
        }

        .ticker-separator{
          margin:0 16px;
          opacity:.35;
          color:#0A0D17;
        }

        .sr-only{
          position:absolute;
          width:1px;
          height:1px;
          padding:0;
          margin:-1px;
          overflow:hidden;
          clip:rect(0,0,0,0);
          white-space:nowrap;
          border:0;
        }

        @keyframes tickerLoop{
          0%{transform:translateX(0)}
          100%{transform:translateX(-50%)}
        }

        @media(prefers-reduced-motion:reduce){
          .ticker-track{
            animation:none;
            transform:none;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;