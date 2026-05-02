import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
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

      {/* ================= HERO (ORIGINAL - FIXED) ================= */}
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <Hero />
      </div>

      {/* ================= YOUR CATEGORY SECTION (UNCHANGED) ================= */}
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

      {/* ================= LATEST ================= */}
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] mt-10">
        <LatestCollection />
      </div>

      {/* ================= BEST SELLER ================= */}
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] mt-10">
        <BestSeller />
      </div>

      {/* ================= POLICY ================= */}
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] mt-10">
        <OurPolicy />
      </div>

      {/* ================= NEWSLETTER ================= */}
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] mt-6 pb-6">
        <NewsletterBox />
      </div>
    </div>
  );
};

export default Home;