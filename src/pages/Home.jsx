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
    <div className="min-h-screen bg-[#f8f7f4] overflow-x-hidden">

      {/* HERO */}
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <Hero />
      </div>

      {/* CATEGORY SECTION (UNIQLO STYLE BUT CLEAN) */}
      <section className="mt-6 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
              Saint Clothing
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-black sm:text-5xl">
              Categories
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/latest")}
              className="rounded-full bg-black px-4 py-2 text-[10px] font-black uppercase text-white"
            >
              Latest
            </button>

            <button
              onClick={() => navigate("/best-sellers")}
              className="rounded-full border px-4 py-2 text-[10px] font-black uppercase"
            >
              Best
            </button>
          </div>
        </div>

        {loadingCategories ? (
          <p className="text-center text-sm font-black text-gray-400">
            Loading categories...
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => goToCategory(cat.name)}
                className="group relative h-[420px] overflow-hidden bg-[#e8e2d7]"
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-6xl font-black text-black/10">SAINT</p>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute bottom-0 p-5 text-white">
                  <h3 className="text-3xl font-black uppercase">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-xs uppercase tracking-widest">
                    Shop Now →
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 🔥 LATEST COLLECTION BACK */}
      <div className="mt-10 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <LatestCollection />
      </div>

      {/* 🔥 BEST SELLERS BACK */}
      <div className="mt-10 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <BestSeller />
      </div>

      {/* POLICY */}
      <div className="mt-10 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <OurPolicy />
      </div>

      {/* NEWSLETTER */}
      <div className="mt-6 pb-6 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <NewsletterBox />
      </div>
    </div>
  );
};

export default Home;