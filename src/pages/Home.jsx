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
      } catch {
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const goToCategory = (category) => {
    navigate(`/collection?category=${encodeURIComponent(category)}`);
  };

  const goToBuildFit = () => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    else navigate("/style-builder");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f4]">

      {/* HERO */}
      <section className="relative min-h-[calc(100vh-72px)] md:min-h-[calc(100vh-80px)]">
        <Hero />
      </section>

      {/* BUILD FIT PREMIUM */}
      <section className="mt-6 px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <div className="relative overflow-hidden rounded-[30px] bg-black text-white">

          <div className="grid md:grid-cols-2 gap-10 px-6 py-14">

            {/* TEXT */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                Saint Feature
              </p>

              <h2 className="mt-2 text-5xl font-black uppercase">
                Build Your Fit
              </h2>

              <p className="mt-4 text-sm text-white/70">
                Mix tops and bottoms visually and create your outfit before checkout.
              </p>

              <button
                onClick={goToBuildFit}
                className="mt-6 bg-white text-black px-6 py-3 text-xs font-black uppercase"
              >
                Try Build Fit →
              </button>

              {/* STEPS */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {["Pick Top", "Pick Bottom", "Build Look"].map((item, i) => (
                  <div key={i} className="bg-white/10 p-3 rounded-xl text-center">
                    <p className="text-[10px] text-white/50">0{i + 1}</p>
                    <p className="text-[10px] uppercase">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* VISUAL (LIKE YOUR IMAGE) */}
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center relative">

              <p className="absolute text-[6rem] font-black text-black/5 top-10">
                SAINT
              </p>

              {/* TOP */}
              <div className="w-[180px] h-[120px] bg-[#e8dcc3] rounded-xl shadow-md"></div>

              {/* GAP */}
              <div className="h-4"></div>

              {/* BOTTOM */}
              <div className="w-[200px] h-[140px] bg-black rounded-xl"></div>

            </div>

          </div>
        </div>
      </section>

      {/* CATEGORY */}
      <section className="mt-6">
        {loadingCategories ? (
          <div className="h-[60vh] flex items-center justify-center">
            <p>Loading...</p>
          </div>
        ) : (
          visibleCategories.map((cat) => (
            <div key={cat.name} className="h-screen flex items-end bg-gray-200">
              <div className="p-6">
                <h2 className="text-5xl text-white">{cat.name}</h2>
                <button
                  onClick={() => goToCategory(cat.name)}
                  className="bg-white text-black px-6 py-3 mt-4"
                >
                  Shop →
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />
    </div>
  );
};

export default Home;