import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import SocialFeed from "../components/SocialFeed";
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
      <section className="relative min-h-[calc(100vh-72px)] overflow-hidden md:min-h-[calc(100vh-80px)] [&>*]:min-h-[calc(100vh-72px)] md:[&>*]:min-h-[calc(100vh-100px)]">
        <Hero />
      </section>

      {/* ================= BUILD FIT EDITORIAL FEATURE ================= */}

      <section className="relative mt-[-1px] overflow-hidden bg-[#f8f7f4]">

        {/* Large editorial background word */}

        <div className="pointer-events-none absolute left-[-5vw] top-[-4vw] select-none text-[22vw] font-black leading-none tracking-[-0.12em] text-black/[0.025]">
          SAINT
        </div>

        {/* Technical vertical line */}

        <div className="pointer-events-none absolute left-[8vw] top-0 hidden h-full w-px bg-black/[0.07] lg:block" />

        {/* Technical horizontal line */}

        <div className="pointer-events-none absolute left-0 right-0 top-[18%] h-px bg-black/[0.06]" />

        <div className="relative mx-auto max-w-[1600px] px-5 pt-20 pb-8 sm:px-8 sm:pt-20 sm:pb-10 md:px-[7vw] md:pt-28 md:pb-12 lg:px-[8vw] lg:pt-36 lg:pb-5">

          ```
          {/* Section header */}
          <div className="mb-14 flex items-end justify-between gap-8 md:mb-20">

            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-black" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/45">
                  Saint / 02
                </p>
              </div>

              <h2 className="max-w-3xl text-[clamp(3.5rem,8vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.085em] text-black">
                Build
                <br />
                Your Fit.
              </h2>
            </div>

            <div className="hidden max-w-[220px] pb-2 text-right md:block">
              <p className="text-[9px] font-black uppercase leading-5 tracking-[0.22em] text-black/40">
                A different way
                <br />
                to style Saint.
              </p>
            </div>

          </div>

          {/* Main feature */}
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">

            {/* LEFT — information */}
            <div className="relative flex flex-col justify-between rounded-[4px] border border-black/10 bg-white p-7 sm:p-10 lg:min-h-[620px] lg:p-12">

              <div>
                <div className="flex items-center justify-between border-b border-black/10 pb-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                    Style Builder
                  </p>

                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-black/35">
                    01 — 03
                  </span>
                </div>

                <p className="mt-10 max-w-md text-sm font-medium leading-7 text-black/55 sm:text-base">
                  Combine pieces, experiment with proportions, and create your
                  complete Saint look before you even reach checkout.
                </p>
              </div>

              {/* Steps */}
              <div className="mt-12 space-y-0 border-t border-black/10">

                {[
                  ["01", "Choose a top", "Start with your statement piece."],
                  ["02", "Choose a bottom", "Balance the silhouette."],
                  ["03", "Build your look", "See everything together."],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="group grid grid-cols-[45px_1fr] gap-4 border-b border-black/10 py-5 transition hover:bg-black hover:px-4 hover:text-white"
                  >
                    <span className="text-[9px] font-black tracking-[0.2em] opacity-40">
                      {number}
                    </span>

                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em]">
                        {title}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 opacity-45">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}

              </div>

              {/* CTA */}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={goToBuildFit}
                  className="group flex items-center justify-between bg-black px-6 py-4 text-left text-white transition hover:bg-[#222]"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    Enter Build Fit
                  </span>

                  <span className="ml-8 text-lg transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/collection")}
                  className="border border-black/15 px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] transition hover:border-black hover:bg-black hover:text-white"
                >
                  Shop Collection
                </button>

              </div>
            </div>

            {/* RIGHT — visual */}
            <div className="group relative min-h-[520px] overflow-hidden bg-[#e8e4dc] lg:min-h-[620px]">

              {/* Giant number */}
              <div className="pointer-events-none absolute right-[-2vw] top-[-3vw] select-none text-[22vw] font-black leading-none tracking-[-0.12em] text-black/[0.045]">
                01
              </div>

              {/* Editorial label */}
              <div className="absolute left-6 top-6 z-20 flex items-center gap-3 sm:left-8 sm:top-8">
                <span className="h-2 w-2 rounded-full bg-black" />

                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/55">
                  Outfit Preview
                </p>
              </div>

              {/* Image */}
              <div className="absolute inset-[10%] flex items-center justify-center">

                <div className="absolute h-[65%] w-[65%] rounded-full border border-black/10" />
                <div className="absolute h-[78%] w-[78%] rounded-full border border-black/[0.06]" />

                <img
                  src={assets.build_fit_preview}
                  alt="Build Fit Preview"
                  className="relative z-10 h-full w-full object-contain p-5 transition duration-1000 ease-out group-hover:scale-[1.06]"
                />
              </div>

              {/* Bottom information */}
              <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-black/10 bg-[#e8e4dc]/90 p-6 backdrop-blur-md sm:p-8">

                <div className="flex items-end justify-between gap-5">

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/35">
                      Visual Styling System
                    </p>

                    <p className="mt-2 text-sm font-black uppercase tracking-[0.08em]">
                      Top + Bottom
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-black/35">
                      Interactive
                    </p>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em]">
                      Mix / Match
                    </p>
                  </div>

                </div>

              </div>

              {/* Corner marks */}
              <span className="absolute left-3 top-3 h-5 w-5 border-l border-t border-black/20" />


              <span className="absolute right-3 top-3 h-5 w-5 border-r border-t border-black/20" />
              <span className="absolute bottom-3 left-3 h-5 w-5 border-b border-l border-black/20" />
              <span className="absolute bottom-3 right-3 h-5 w-5 border-b border-r border-black/20" />

            </div>

          </div>

          {/* Bottom statement */}
          <div className="mt-16 flex flex-col gap-5 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">

            <p className="max-w-xl text-[10px] ml-5 font-black uppercase leading-5 tracking-[0.2em] text-black/35">
              Don't just buy the pieces.
              <span className="text-black"> Build the look.</span>
            </p>

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/30">
              Saint Clothing / Style System
            </p>

          </div>

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
      <div className="mt-10">
        <LatestCollection />
      </div>

      <div className="mt-10">
        <BestSeller />
      </div>

      <div className="mt-10">
        <SocialFeed />
      </div>

      <div className="mt-8">
        <OurPolicy />
      </div>

      <div className="px-5 pb-20 pt-12 sm:px-8 md:px-[7vw] lg:px-[10vw] lg:pb-20 lg:pt-16">
        <NewsletterBox />
      </div>
    </div>
  );
};

export default Home;