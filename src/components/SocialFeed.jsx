import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const SOCIAL_FEED_CACHE_KEY = "saint_social_feed";

const SocialFeed = () => {
  const containerRef = useRef(null);
  const [feed, setFeed] = useState({
    enabled: false,
    title: "Latest From Saint Social",
    subtitle:
      "Follow the latest drops, outfits, and AR try-on updates from Saint Clothing.",
    embedCode: "",
  });

  const fetchSocialFeed = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cachedFeed = sessionStorage.getItem(SOCIAL_FEED_CACHE_KEY);

        if (cachedFeed) {
          setFeed(JSON.parse(cachedFeed));
          return;
        }
      }

      const { data } = await axios.get(`${backendUrl}/api/social-feed`);

      if (data.success && data.feed) {
        const nextFeed = {
          enabled: Boolean(data.feed.enabled),
          title: data.feed.title || "Latest From Saint Social",
          subtitle:
            data.feed.subtitle ||
            "Follow the latest drops, outfits, and AR try-on updates from Saint Clothing.",
          embedCode: data.feed.embedCode || "",
        };

        setFeed(nextFeed);
        sessionStorage.setItem(SOCIAL_FEED_CACHE_KEY, JSON.stringify(nextFeed));
      }
    } catch (error) {
      console.log("Social feed fetch error:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchSocialFeed();

    const handleRefresh = () => {
      sessionStorage.removeItem(SOCIAL_FEED_CACHE_KEY);
      fetchSocialFeed(true);
    };

    window.addEventListener("social-feed-refresh", handleRefresh);

    return () => {
      window.removeEventListener("social-feed-refresh", handleRefresh);
    };
  }, [fetchSocialFeed]);

  useEffect(() => {
    if (!containerRef.current || !feed.embedCode) return;

    containerRef.current.innerHTML = "";

    const temp = document.createElement("div");
    temp.innerHTML = feed.embedCode;

    Array.from(temp.childNodes).forEach((node) => {
      if (node.nodeName === "SCRIPT") {
        const script = document.createElement("script");

        Array.from(node.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });

        script.textContent = node.textContent;
        containerRef.current.appendChild(script);
      } else {
        containerRef.current.appendChild(node.cloneNode(true));
      }
    });
  }, [feed.embedCode]);

  if (!feed.enabled || !feed.embedCode) return null;

  return (
    <section className="w-full bg-white px-4 py-14 sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-400">
              Saint Social
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase text-[#0A0D17] sm:text-3xl md:text-4xl">
              {feed.title}
            </h2>

            <p className="mt-3 max-w-2xl text-sm text-gray-500">
              {feed.subtitle}
            </p>
          </div>

          <div className="rounded-full border border-black/10 px-4 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A0D17]">
              Live Updates
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[5px] border border-black/10 bg-[#fafaf8] p-3 sm:p-5">
          <div ref={containerRef} />
        </div>
      </div>
    </section>
  );
};

export default SocialFeed;