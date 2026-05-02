import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Hero from "../components/Hero";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import { backendUrl } from "../App";

const Home = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => cat?.name && cat?.isActive !== false);
  }, [categories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await axios.get(`${backendUrl}/api/category/list`);

        if (res.data?.success) {
          setCategories(res.data.categories || []);
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f4]">
      {/* HERO */}
      <section className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <Hero />
      </section>

      {/* TOP NAV BUTTONS */}
      <section className="sticky top-[72px] z-30 border-y border-black/10 bg-[#f8f7f4]/90 px-3 py-3 backdrop-blur-md sm:px-[5vw] md:top-[80px] md:px-[7vw] lg:px-[8vw]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            Shop Categories
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/latest")}
              className="rounded-full bg-black px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white"
            >
              Latest
            </button>

            <button
              onClick={() => navigate("/best-sellers")}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-[9px] font-black uppercase tracking-widest text-black"
            >
              Best
            </button>
          </div>
        </div>
      </section>

      {/* FULL SCREEN CATEGORY SECTIONS */}
      {loadingCategories ? (
        <div className="flex h-[70vh] items-center justify-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
            Loading categories...
          </p>
        </div>
      ) : visibleCategories.length > 0 ? (
        <div>
          {visibleCategories.map((cat, index) => (
            <section
              key={cat._id || cat.name}
              className="relative flex min-h-[calc(100vh-72px)] items-end overflow-hidden bg-[#e8e2d7] md:min-h-[calc(100vh-80px)]"
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#e8e2d7]">
                  <p className="select-none text-[18vw] font-black uppercase tracking-[-0.08em] text-black/[0.04]">
                    SAINT
                  </p>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              <div className="relative z-10 w-full px-5 pb-10 sm:px-[7vw] sm:pb-14 lg:px-[8vw]">
                <div className="max-w-3xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70">
                    {String(cat.section || "category")}
                  </p>

                  <h2 className="mt-2 text-5xl font-black uppercase tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">
                    {cat.name}
                  </h2>

                  {Array.isArray(cat.matchWith) && cat.matchWith.length > 0 && (
                    <p className="mt-3 max-w-xl text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                      Pairs with {cat.matchWith.slice(0, 3).join(", ")}
                    </p>
                  )}

                  <button
                    onClick={() => goToCategory(cat.name)}
                    className="mt-6 bg-white px-7 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-black transition hover:bg-black hover:text-white"
                  >
                    Shop {cat.name}
                  </button>
                </div>

                <p className="absolute bottom-5 right-5 text-[10px] font-black uppercase tracking-[0.25em] text-white/60 sm:right-[7vw] lg:right-[8vw]">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(visibleCategories.length).padStart(2, "0")}
                </p>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex h-[70vh] items-center justify-center px-4 text-center">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">
              No categories available
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Add category images in admin first.
            </p>
          </div>
        </div>
      )}

      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <div className="mt-6">
          <OurPolicy />
        </div>

        <div className="mt-4 pb-6">
          <NewsletterBox />
        </div>
      </div>
    </div>
  );
};

export default Home;