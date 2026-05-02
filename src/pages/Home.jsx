import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import { backendUrl } from "../App";

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
        <div className="group relative overflow-hidden rounded-[30px] bg-[#050505] text-white shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.12),transparent_28%)]" />

          <div className="absolute inset-0 opacity-[0.08]">
            <div className="absolute left-[-8%] top-[-20%] text-[22vw] font-black uppercase tracking-[-0.12em] text-white">
              SAINT
            </div>
            <div className="absolute bottom-[-18%] right-[-4%] text-[18vw] font-black uppercase tracking-[-0.12em] text-white">
              FIT
            </div>
          </div>

          <div className="relative z-10 grid min-h-[420px] grid-cols-1 items-center gap-10 px-6 py-14 sm:px-8 md:grid-cols-[1fr_0.85fr] md:px-12 lg:px-16">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.38em] text-white/50">
                Saint Clothing Feature
              </p>

              <h2 className="mt-3 max-w-2xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
                Build Your Fit
              </h2>

              <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-white/65 md:text-base">
                Mix tops, bottoms, and shoes in one visual outfit builder.
                Create your look before checkout and discover better style
                combinations.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={goToBuildFit}
                  className="bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-black transition hover:bg-transparent hover:text-white border border-white"
                >
                  Try Build Fit →
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/collection")}
                  className="border border-white/20 bg-white/5 px-8 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-white transition hover:border-white hover:bg-white hover:text-black"
                >
                  Shop Collection
                </button>
              </div>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                {["Pick Items", "Match Style", "Build Look"].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur"
                  >
                    <p className="text-[10px] font-black text-white/40">
                      0{index + 1}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="absolute -inset-6 rounded-[36px] bg-white/10 blur-3xl transition duration-700 group-hover:bg-white/15" />

              <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">
                    Outfit Preview
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-black">
                    New
                  </span>
                </div>

                <div className="grid grid-cols-[0.8fr_1.2fr] gap-4">
                  <div className="space-y-3">
                    <div className="h-24 rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                        Top
                      </p>
                      <div className="mt-4 h-8 rounded-lg bg-white/30" />
                    </div>

                    <div className="h-24 rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                        Bottom
                      </p>
                      <div className="mt-4 h-8 rounded-lg bg-white/20" />
                    </div>

                    <div className="h-20 rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                        Shoes
                      </p>
                      <div className="mt-3 h-6 rounded-lg bg-white/25" />
                    </div>
                  </div>

                  <div className="relative min-h-[280px] overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-white/15 to-white/5">
                    <div className="absolute inset-x-8 top-10 h-24 rounded-[40px_40px_18px_18px] bg-white/75 shadow-2xl" />
                    <div className="absolute inset-x-12 top-[138px] h-24 rounded-[18px_18px_34px_34px] bg-white/35 shadow-2xl" />
                    <div className="absolute bottom-8 left-10 h-8 w-20 rounded-full bg-white/55" />
                    <div className="absolute bottom-8 right-10 h-8 w-20 rounded-full bg-white/35" />

                    <p className="absolute bottom-4 left-4 right-4 text-center text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
                      Visual Mix & Match
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-white via-white/30 to-transparent" />
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