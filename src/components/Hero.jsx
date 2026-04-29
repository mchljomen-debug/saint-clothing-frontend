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
      "{greeting}, {name}! Ready to explore the latest from Saint Clothing?",
    slides: [],
  });

  /* ================= FETCH HERO ================= */
  const fetchHero = useCallback(async () => {
    try {
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

        setHeroData({
          tickerEnabled:
            typeof data.hero.tickerEnabled === "boolean"
              ? data.hero.tickerEnabled
              : true,
          newUserGreeting: data.hero.newUserGreeting || "Welcome",
          returningUserGreeting:
            data.hero.returningUserGreeting || "Welcome back",
          tickerText:
            data.hero.tickerText ||
            "{greeting}, {name}! Ready to explore the latest from Saint Clothing?",
          slides,
        });
      }
    } catch (error) {
      console.log("Hero fetch error:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchHero();

    const handleRefresh = () => fetchHero();
    window.addEventListener("hero-refresh", handleRefresh);

    return () => {
      window.removeEventListener("hero-refresh", handleRefresh);
    };
  }, [fetchHero]);

  /* ================= LOGIN ================= */
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

  /* ================= LOGIN COUNT FIX ================= */
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
      setGreetingPrefix(
        heroData.returningUserGreeting || "Welcome back"
      );
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

  const handleAction = (action) => {
    if (action === "collection") {
      navigate("/collection");
      window.scrollTo(0, 0);
      return;
    }

    if (action === "bestseller") {
      const el = document.getElementById("best-seller-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/collection");
      }
      return;
    }

    if (action === "latest") {
      const el = document.getElementById("latest-collection-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/collection");
      }
    }
  };

  if (!heroData.slides.length) return null;

  return (
    <>
      {/* ================= FIXED TICKER ================= */}
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

      {/* Push hero down so it won't hide behind ticker */}
      <div className="pt-[44px]">
        <Carousel
          arrows
          infinite
          autoplay
          autoplaySpeed={3000}
          speed={700}
          effect="fade"
          dots
          pauseOnHover={false}
        >
          {heroData.slides.map((slide, index) => (
            <div
              key={index}
              className="relative w-full h-[420px] sm:h-[500px] md:h-[620px] lg:h-[720px]"
            >
              <img
                className="w-full h-full object-cover"
                src={slide.image}
                alt={slide.title}
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute inset-0 flex items-center px-6 md:px-16 lg:px-24 z-10">
                <div className="max-w-3xl">
                  <h1 className="text-white uppercase font-black text-4xl md:text-7xl leading-[0.95]">
                    {slide.title}
                  </h1>

                  <p className="mt-4 text-white/70 max-w-lg">
                    {slide.description}
                  </p>

                  <button
                    onClick={() => handleAction(slide.action)}
                    className="mt-6 bg-white text-black px-8 py-3 uppercase text-xs font-bold border border-white hover:bg-transparent hover:text-white transition"
                  >
                    {slide.cta}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      {/* ================= STYLE ================= */}
      <style jsx="true">{`
        .ticker-wrap {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 999;

          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);

          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: tickerLoop 25s linear infinite;
        }

        .ticker-text {
          display: flex;
          white-space: nowrap;
          padding: 10px 0;
        }

        .ticker-item {
          padding-right: 28px;
          color: #0a0d17;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .ticker-separator {
          margin: 0 16px;
          opacity: 0.35;
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
    </>
  );
};

export default Hero;