import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Hero from "../components/Hero";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";

const Home = () => {
  const { products, categoryOptions = [] } = useContext(ShopContext);
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const names =
      categoryOptions.length > 0
        ? categoryOptions
        : [...new Set(products.map((p) => p.category).filter(Boolean))];

    return names.map((name) => {
      const product = products.find((p) => p.category === name);
      const image =
        product?.images?.[0] ||
        product?.image?.[0] ||
        product?.image ||
        "";

      return { name, image };
    });
  }, [categoryOptions, products]);

  const goToCategory = (category) => {
    navigate(`/collection?category=${encodeURIComponent(category)}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f4]">
      <div className="px-3 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]">
        <div className="mb-4">
          <Hero />
        </div>

        <section className="py-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
                Saint Clothing
              </p>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-black sm:text-5xl">
                Shop by Category
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/latest")}
                className="rounded-full border border-black bg-black px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white"
              >
                Latest
              </button>

              <button
                onClick={() => navigate("/best-sellers")}
                className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black"
              >
                Best Sellers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => goToCategory(cat.name)}
                className="group relative h-[420px] overflow-hidden bg-[#ebe7de] text-left"
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#ebe7de]">
                    <p className="text-6xl font-black uppercase tracking-tight text-black/5">
                      SAINT
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
                    Category
                  </p>
                  <h2 className="mt-1 text-3xl font-black uppercase text-white">
                    {cat.name}
                  </h2>
                  <p className="mt-3 inline-flex bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black">
                    Shop Now
                  </p>
                </div>
              </button>
            ))}
          </div>
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