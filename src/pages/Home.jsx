import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import { backendUrl } from "../App";
import { assets } from "../assets/assets";

const CATEGORY_CACHE_KEY = "saint_home_categories";

const Home = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => cat?.name && cat?.isActive !== false);
  }, [categories]);

  useEffect(() => {
    const cached = sessionStorage.getItem(CATEGORY_CACHE_KEY);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCategories(parsed);
        setLoadingCategories(false);
        return;
      } catch {
        sessionStorage.removeItem(CATEGORY_CACHE_KEY);
      }
    }

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const res = await axios.get(`${backendUrl}/api/category/list`);

        if (res.data?.success) {
          const data = res.data.categories || [];
          setCategories(data);
          sessionStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(data));
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("LOAD HOME CATEGORIES ERROR:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const goToCategory = (category) => {
    navigate(`/collection?category=${encodeURIComponent(category)}`);
    window.scrollTo(0, 0);
  };

  const goToBuildFit = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    navigate("/style-builder");
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f4]">
      {/* ================= HERO ================= */}
      <section className="relative min-h-[calc(100vh-72px)] overflow-hidden md:min-h-[calc(100vh-80px)] [&>*]:min-h-[calc(100vh-72px)] md:[&>*]:min-h-[calc(100vh-80px)]">
        <Hero />
      </section>

      {/* ================= BUILD FIT PREMIUM PROMO ================= */}
      <section className="mt-6 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <div className="group relative overflow-hidden rounded-[5px] bg-[#050505] text-white shadow-[0_30px_80px_rgba(0,0,0,0.22)]">

          <div className="absolute inset-0 opacity-[0.08]">
            <div className="absolute left-[-8%] top-[-20%] text-[22vw] font-black uppercase tracking-[-0.12em] text-white">
              SAINT
            </div>
            <div className="absolute bottom-[-18%] right-[-4%] text-[18vw] font-black uppercase tracking-[-0.12em] text-white">
              FIT
            </div>
          </div>

          <div className="relative z-10 grid min-h-[420px] grid-cols-1 items-center gap-10 px-6 py-14 sm:px-8 md:grid-cols-[1fr_0.85fr] md:px-12 lg:px-16">

            {/* TEXT */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.38em] text-white/50">
                Saint Clothing Feature
              </p>

              <h2 className="mt-3 text-5xl font-black uppercase tracking-[-0.07em]">
                Build Your Fit
              </h2>

              <p className="mt-5 text-sm text-white/65">
                Mix tops and bottoms in one visual outfit builder.
              </p>

              <button
                onClick={goToBuildFit}
                className="mt-6 border border-white bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-black transition hover:bg-transparent hover:text-white"
              >
                Try Build Fit →
              </button>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {["Pick Top", "Pick Bottom", "Build Look"].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[5px] border border-white/10 bg-white/[0.04] px-4 py-4"
                  >
                    <p className="text-[10px] text-white/40">0{index + 1}</p>
                    <p className="text-[10px] uppercase">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* IMAGE PREVIEW */}
            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="relative overflow-hidden rounded-[5px] border border-white/15 bg-[#f8f7f4] p-5">

                <p className="absolute inset-0 flex items-center justify-center text-[6rem] font-black text-black/[0.05]">
                  SAINT
                </p>

                <img
                  src={assets.build_fit_preview}
                  className="relative z-10 w-full object-contain"
                />

                <p className="mt-4 text-center text-[10px] uppercase text-black/40">
                  Top + Bottom Styling
                </p>

              </div>
            </div>

          </div>

          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/30" />
        </div>
      </section>

      {/* ================= CATEGORY ================= */}
      <section className="mt-6">
        <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
                Saint Clothing
              </p>

              <h2 className="mt-1 text-3xl font-black uppercase tracking-[-0.05em] text-black sm:text-5xl">
                Categories
              </h2>
            </div>

            <button
              onClick={() => navigate("/collection")}
              className="hidden bg-black px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-black sm:block"
            >
              View All →
            </button>
          </div>
        </div>

        {loadingCategories ? (
          <div className="flex h-[60vh] items-center justify-center">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
              Loading categories...
            </p>
          </div>
        ) : visibleCategories.length > 0 ? (
          <div className="snap-y snap-mandatory">
            {visibleCategories.map((cat, index) => (
              <section
                key={cat._id || cat.name}
                className="relative flex min-h-[calc(100vh-72px)] snap-start items-end overflow-hidden bg-[#e8e2d7] md:min-h-[calc(100vh-80px)]"
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#e8e2d7]">
                    <p className="select-none text-[18vw] font-black uppercase tracking-[-0.08em] text-black/[0.04]">
                      SAINT
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="relative z-10 w-full px-5 pb-10 sm:px-[7vw] sm:pb-14 lg:px-[8vw]">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70">
                    {cat.section || "category"}
                  </p>

                  <h2 className="mt-2 text-5xl font-black uppercase tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">
                    {cat.name}
                  </h2>

                  <button
                    onClick={() => goToCategory(cat.name)}
                    className="mt-6 bg-white px-7 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-black transition hover:bg-black hover:text-white"
                  >
                    Shop {cat.name} →
                  </button>

                  <p className="absolute bottom-5 right-5 text-[10px] font-black uppercase tracking-[0.25em] text-white/60 sm:right-[7vw] lg:right-[8vw]">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(visibleCategories.length).padStart(2, "0")}
                  </p>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex h-[60vh] items-center justify-center text-center">
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">
              No categories available
            </p>
          </div>
        )}
      </section>

      {/* ================= OTHER SECTIONS ================= */}
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] mt-10">
        <LatestCollection />
      </div>

      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] mt-10">
        <BestSeller />
      </div>

      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] mt-10">
        <OurPolicy />
      </div>

      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] mt-6 pb-6">
        <NewsletterBox />
      </div>
    </div>
  );
};

export default Home;