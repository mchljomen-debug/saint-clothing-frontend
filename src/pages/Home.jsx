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

  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => cat?.name && cat?.isActive !== false);
  }, [categories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/category/list`);

        if (res.data?.success) {
          setCategories(res.data.categories || []);
        }
      } catch (error) {
        console.error("LOAD HOME CATEGORIES ERROR:", error);
        setCategories([]);
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
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <div className="mb-5">
          <Hero />
        </div>

        <section className="py-8">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
                Saint Clothing
              </p>

              <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-black sm:text-5xl">
                Shop by Category
              </h1>

              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-gray-500">
                Explore Saint Clothing by category. Clean streetwear essentials,
                curated by style and fit.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/latest")}
                className="rounded-full border border-black bg-black px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
              >
                Latest
              </button>

              <button
                onClick={() => navigate("/best-sellers")}
                className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition hover:border-black"
              >
                Best Sellers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCategories.map((cat, index) => (
              <button
                key={cat._id || cat.name}
                onClick={() => goToCategory(cat.name)}
                className={`group relative overflow-hidden rounded-[6px] bg-[#e8e2d7] text-left shadow-[0_16px_40px_rgba(0,0,0,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.14)] ${
                  index === 0 ? "sm:col-span-2 xl:col-span-1" : ""
                }`}
              >
                <div className="relative h-[420px] sm:h-[480px]">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#e8e2d7]">
                      <p className="select-none text-7xl font-black uppercase tracking-[-0.08em] text-black/[0.04]">
                        SAINT
                      </p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-0 border border-black/10" />

                  <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
                    <span className="rounded-full bg-white/85 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-black backdrop-blur-sm">
                      {cat.section || "category"}
                    </span>

                    <span className="rounded-full bg-black/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                      Shop
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/65">
                      Category
                    </p>

                    <h2 className="mt-1 text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl">
                      {cat.name}
                    </h2>

                    {Array.isArray(cat.matchWith) && cat.matchWith.length > 0 && (
                      <p className="mt-2 line-clamp-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                        Pairs with {cat.matchWith.slice(0, 3).join(", ")}
                      </p>
                    )}

                    <div className="mt-4 inline-flex items-center gap-3 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black transition group-hover:bg-black group-hover:text-white">
                      Shop Now <span>→</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {visibleCategories.length === 0 && (
            <div className="rounded-[6px] border border-black/10 bg-white p-10 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-gray-400">
                No categories available
              </p>
            </div>
          )}
        </section>

        <div className="mt-4">
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