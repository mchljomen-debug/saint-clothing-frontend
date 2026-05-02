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

      {/* ================= HERO (ORIGINAL) ================= */}
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <Hero />
      </div>

      {/* ================= CATEGORIES ================= */}
      <section className="mt-6 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
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

        {loadingCategories ? (
          <div className="flex h-[40vh] items-center justify-center">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
              Loading categories...
            </p>
          </div>
        ) : visibleCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCategories.map((cat) => (
              <button
                key={cat._id || cat.name}
                onClick={() => goToCategory(cat.name)}
                className="group relative h-[380px] overflow-hidden rounded-[6px] bg-[#e8e2d7] text-left shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <p className="text-6xl font-black text-black/10">
                      SAINT
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                    Category
                  </p>

                  <h3 className="mt-1 text-2xl font-black uppercase">
                    {cat.name}
                  </h3>

                  <p className="mt-2 text-xs uppercase tracking-widest">
                    Shop Now →
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-[40vh] items-center justify-center text-center">
            <p className="text-sm font-black uppercase text-gray-400">
              No categories available
            </p>
          </div>
        )}
      </section>

      {/* ================= LATEST ================= */}
      <div className="mt-10 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <LatestCollection />
      </div>

      {/* ================= BEST SELLER ================= */}
      <div className="mt-10 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <BestSeller />
      </div>

      {/* ================= POLICY ================= */}
      <div className="mt-10 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <OurPolicy />
      </div>

      {/* ================= NEWSLETTER ================= */}
      <div className="mt-6 pb-6 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <NewsletterBox />
      </div>
    </div>
  );
};

export default Home;