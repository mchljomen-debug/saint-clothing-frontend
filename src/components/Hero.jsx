import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Carousel } from "antd";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const HERO_CACHE_KEY = "saint_home_hero";

const resolveImage = (img) => {
  if (!img) return "";
  const value = String(img).trim();

  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/uploads/")) return `${backendUrl}${value}`;

  return `${backendUrl}/uploads/${value.replace(/^\/+/, "")}`;
};

const Hero = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(ShopContext);

  const [greetingPrefix, setGreetingPrefix] = useState("");

  const [heroData, setHeroData] = useState({
    tickerEnabled: true,
    newUserGreeting: "Welcome",
    returningUserGreeting: "Welcome back",
    tickerText:
      "{greeting}, {name}! Try our mobile AR fitting experience and explore the latest from Saint Clothing.",
    slides: [],
  });

  /* ================= FETCH HERO ================= */
  const fetchHero = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cachedHero = sessionStorage.getItem(HERO_CACHE_KEY);

        if (cachedHero) {
          const parsedHero = JSON.parse(cachedHero);
          setHeroData(parsedHero);
          return;
        }
      }

      const { data } = await axios.get(`${backendUrl}/api/hero`);

      if (data.success && data.hero) {
        const slides = (data.hero.slides || [])
          .map((slide) => ({
            title: slide.title || "",
            subtitle: slide.subtitle || "",
            description: slide.description || "",
            cta: slide.cta || "Explore",
            image: resolveImage(slide.image),
            action: slide.action || "collection",
          }))
          .filter((slide) => slide.image);

        const nextHeroData = {
          tickerEnabled:
            typeof data.hero.tickerEnabled === "boolean"
              ? data.hero.tickerEnabled
              : true,
          newUserGreeting: data.hero.newUserGreeting || "Welcome",
          returningUserGreeting:
            data.hero.returningUserGreeting || "Welcome back",
          tickerText:
            data.hero.tickerText ||
            "{greeting}, {name}! Try our mobile AR fitting experience and explore the latest from Saint Clothing.",
          slides,
        };

        setHeroData(nextHeroData);
        sessionStorage.setItem(HERO_CACHE_KEY, JSON.stringify(nextHeroData));
      }
    } catch (error) {
      console.log("Hero fetch error:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchHero();

    const handleRefresh = () => {
      sessionStorage.removeItem(HERO_CACHE_KEY);
      fetchHero(true);
    };

    window.addEventListener("hero-refresh", handleRefresh);

    return () => {
      window.removeEventListener("hero-refresh", handleRefresh);
    };
  }, [fetchHero]);

  /* ================= LOGIN STATE ================= */
  const isLoggedInUser = Boolean(
    token && (user?._id || user?.id || user?.email)
  );

  const resolvedUserName = useMemo(() => {
    if (!isLoggedInUser) return "";

    if (user?.firstName?.trim()) return user.firstName.trim();
    if (user?.name?.trim()) return user.name.trim().split(" ")[0];
    if (user?.email) return user.email.split("@")[0];

    return "";
  }, [isLoggedInUser, user]);

  /* ================= FIXED LOGIN COUNT ================= */
  useEffect(() => {
    if (!isLoggedInUser || !user?._id || !token) {
      setGreetingPrefix("");
      return;
    }

    const loginCountKey = `saint_login_count_${user._id}`;
    const lastTokenKey = `saint_last_login_token_${user._id}`;

    const lastToken = localStorage.getItem(lastTokenKey);
    let count = Number(localStorage.getItem(loginCountKey) || 0);

    if (lastToken !== token) {
      count += 1;
      localStorage.setItem(loginCountKey, String(count));
      localStorage.setItem(lastTokenKey, token);
    }

    if (count <= 1) {
      setGreetingPrefix(heroData.newUserGreeting || "Welcome");
    } else {
      setGreetingPrefix(heroData.returningUserGreeting || "Welcome back");
    }
  }, [
    isLoggedInUser,
    user?._id,
    token,
    heroData.newUserGreeting,
    heroData.returningUserGreeting,
  ]);

  /* ================= TICKER ================= */
  const tickerMessage = useMemo(() => {
    if (!isLoggedInUser || !resolvedUserName || !heroData.tickerEnabled) {
      return "";
    }

    return (heroData.tickerText || "{greeting}, {name}!")
      .replaceAll("{greeting}", greetingPrefix || "Welcome")
      .replaceAll("{name}", resolvedUserName);
  }, [isLoggedInUser, resolvedUserName, heroData, greetingPrefix]);

  /* ================= ACTION ================= */
  const handleAction = (action) => {
    if (action === "ar") {
      navigate("/collection");
      window.scrollTo(0, 0);
      return;
    }

    if (action === "collection") {
      navigate("/collection");
      window.scrollTo(0, 0);
      return;
    }

    if (action === "bestseller") {
      const el = document.getElementById("best-seller-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        navigate("/collection");
      }
      return;
    }

    if (action === "latest") {
      const el = document.getElementById("latest-collection-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        navigate("/collection");
      }
    }
  };

  if (!heroData.slides.length) return null;

  return (
    <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden bg-black">
      {/* ================= TICKER ================= */}
      {isLoggedInUser && tickerMessage && (
        <div className="ticker-wrap">
          <div className="ticker-track">
            <div className="ticker-text">
              {Array(8)
                .fill(tickerMessage)
                .map((text, i) => (
                  <span key={i} className="ticker-item">
                    {text}
                    <span className="ticker-separator"> ✦ </span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO ================= */}
      <div className="hero-container">
        <Carousel
          arrows
          infinite
          autoplay
          autoplaySpeed={3000}
          speed={700}
          effect="fade"
          dots
          pauseOnHover={false}
          className="hero-carousel"
        >
          {heroData.slides.map((slide, index) => (
            <div
              key={index}
              className="relative w-full h-[420px] sm:h-[500px] md:h-[620px] lg:h-[640px]"
            >
              <img
                className="w-full h-full object-cover"
                src={slide.image}
                alt={slide.title}
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                    backgroundSize: "80px 80px",
                  }}
                />
              </div>

              <div className="absolute inset-0 z-10 flex items-end px-5 pb-16 sm:px-8 sm:pb-20 md:px-14 md:pb-24 lg:px-24 lg:pb-28">
                <div className="relative max-w-4xl">
                  {slide.action === "ar" && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-white" />
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white">
                        Mobile AR Feature
                      </span>
                    </div>
                  )}

                  <h1 className="max-w-4xl text-white uppercase font-black text-4xl sm:text-7xl md:text-7xl lg:text-[7rem] leading-[0.78] tracking-[-0.08em]">
                    {slide.title}
                  </h1>

                  {slide.subtitle && (
                    <div className="mt-7 flex items-center gap-4">
                      <span className="h-px w-12 bg-white/70" />

                      <p className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.35em] text-white/75">
                        {slide.subtitle}
                      </p>
                    </div>
                  )}

                  <p className="mt-5 max-w-md text-xs sm:text-sm md:text-base leading-6 text-white/60">
                    {slide.description}
                  </p>

                  <button
                    onClick={() => handleAction(slide.action)}
                    className="group mt-7 inline-flex items-center gap-8 border border-white/40 bg-white px-7 py-4 text-[9px] font-black uppercase tracking-[0.28em] text-black transition-all duration-300 hover:bg-transparent hover:text-white"
                  >
                    <span>{slide.cta}</span>
                    <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
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
        .hero-carousel .slick-track {
          width: 100%;
        }

        .hero-carousel .slick-list {
          overflow: hidden;
        }

        .hero-carousel .slick-slide {
          height: auto !important;
        }

        .hero-carousel .slick-slide > div {
          height: 100%;
        }

        .ticker-wrap {
          position: absolute;
          top: 0;
          width: 100%;
          overflow: hidden;
          z-index: 40;

          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);

          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: tickerLoop 25s linear infinite;
        }

        .ticker-text {
          display: flex;
          white-space: nowrap;
          padding: 3px 0;
        }

        .ticker-item {
          padding-right: 28px;
          color: #0A0D17;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .ticker-separator {
          margin: 0 16px;
          opacity: 0.35;
          color: #0A0D17;
        }

        @keyframes tickerLoop {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;