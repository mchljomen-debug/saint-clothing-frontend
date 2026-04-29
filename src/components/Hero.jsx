import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
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
    tickerText: "{greeting}, {name}! Ready to explore the latest from Saint Clothing?",
    slides: [],
  });

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

  const isLoggedInUser = Boolean(token && (user?._id || user?.id || user?.email));

  const resolvedUserName = useMemo(() => {
    if (!isLoggedInUser) return "";
    if (user?.firstName?.trim()) return user.firstName.trim();
    if (user?.name?.trim()) return user.name.trim().split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "";
  }, [isLoggedInUser, user]);

  useEffect(() => {
    if (!isLoggedInUser || !user?._id) {
      setGreetingPrefix("");
      return;
    }

    const seenKey = `saint_seen_greeting_${user._id}`;
    const alreadySeen = localStorage.getItem(seenKey) === "true";

    setGreetingPrefix(alreadySeen ? "Welcome back" : "Welcome");

    if (!alreadySeen) {
      localStorage.setItem(seenKey, "true");
    }
  }, [isLoggedInUser, user?._id]);

  const tickerMessage = useMemo(() => {
    if (!isLoggedInUser || !resolvedUserName || !heroData.tickerEnabled) return "";

    return (heroData.tickerText || "{greeting}, {name}!")
      .replaceAll("{greeting}", greetingPrefix || "Welcome")
      .replaceAll("{name}", resolvedUserName)
      .replaceAll("Welcome back,", `${greetingPrefix || "Welcome"},`);
  }, [isLoggedInUser, resolvedUserName, heroData, greetingPrefix]);

  const handleAction = (action) => {
    if (action === "collection") {
      navigate("/collection");
      window.scrollTo(0, 0);
      return;
    }

    if (action === "bestseller") {
      const el = document.getElementById("best-seller-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else navigate("/collection");
      return;
    }

    if (action === "latest") {
      const el = document.getElementById("latest-collection-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else navigate("/collection");
    }
  };

  if (!heroData.slides.length) return null;

  return (
    <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden bg-black">
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
            className="relative w-full h-[420px] sm:h-[500px] md:h-[620px] lg:h-[720px]"
          >
            <img className="w-full h-full object-cover" src={slide.image} alt={slide.title} />

            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute inset-0 flex items-center px-5 sm:px-6 md:px-14 lg:px-24 z-10 pt-12 sm:pt-14">
              <div className="max-w-3xl">
                <h1 className="text-white uppercase font-black text-3xl sm:text-5xl md:text-7xl leading-[0.95]">
                  {slide.title}
                </h1>

                <p className="mt-4 md:mt-5 text-sm md:text-base text-white/70 max-w-lg leading-relaxed">
                  {slide.description}
                </p>

                <button
                  onClick={() => handleAction(slide.action)}
                  className="mt-6 md:mt-8 bg-white text-black px-7 sm:px-8 md:px-10 py-3 md:py-4 uppercase tracking-[0.22em] md:tracking-[0.25em] text-[10px] md:text-xs font-bold hover:bg-transparent hover:text-white border border-white transition"
                >
                  {slide.cta}
                </button>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      <style jsx="true">{`
        .ticker-wrap {
          position: absolute;
          top: 0;
          width: 100%;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.5);
          z-index: 40;
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
          color: white;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .ticker-separator {
          margin: 0 16px;
          opacity: 0.5;
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