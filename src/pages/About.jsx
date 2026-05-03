import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";

const About = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F7F7F4] pt-4">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 md:px-8 lg:px-10">
        {/* HEADER */}
        <div className="border border-black/10 bg-white px-4 py-6 text-center shadow-sm rounded-[5px] md:px-6 md:py-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
            Saint Clothing
          </p>

          <Title text1={"ABOUT"} text2={"SAINT"} />

          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.38em] text-gray-500 md:text-[11px]">
            Modern Streetwear Identity
          </p>
        </div>

        {/* HERO */}
        <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          {/* IMAGE */}
          <div className="overflow-hidden border border-black/10 bg-white shadow-sm rounded-[5px]">
            <div className="relative h-full min-h-[340px] w-full overflow-hidden md:min-h-[520px]">
              <img
                src={assets.about_img}
                alt="Saint Clothing Studio"
                className="absolute inset-0 h-full w-full object-cover grayscale-[20%] transition duration-700 hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />

              <div className="absolute left-4 top-4">
                <span className="inline-flex items-center rounded-[5px] bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                  Saint Clothing
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="max-w-[340px] border border-black/10 bg-white/92 p-4 shadow-sm backdrop-blur-md rounded-[5px]">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                    Studio Note
                  </p>
                  <p className="text-sm font-bold leading-6 text-[#0A0D17]">
                    Built for everyday wear with a sharper silhouette and
                    cleaner identity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TEXT */}
          <div className="flex flex-col justify-between border border-black/10 bg-white p-5 shadow-sm rounded-[5px] md:p-7 lg:p-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                The Identity
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase italic leading-none tracking-tight text-[#0A0D17] md:text-4xl lg:text-5xl">
                Architectural
                <br />
                Streetwear.
              </h2>

              <div className="mt-5 h-[2px] w-12 bg-black" />

              <p className="mt-5 text-[14px] leading-7 text-gray-600 md:text-[15px]">
                <span className="font-black text-black">Saint Clothing</span>{" "}
                was built around the idea of a modern uniform. We move away
                from visual noise and focus on shape, texture, structure, and
                purpose.
              </p>

              <p className="mt-4 text-[14px] leading-7 text-gray-600 md:text-[15px]">
                Our pieces are designed to feel sharp, wearable, and confident
                in everyday life. Clean silhouettes, strong fabrics, and minimal
                detailing define the Saint identity.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="border border-black/10 bg-[#F8F8F6] p-4 rounded-[5px]">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">
                  Focus
                </p>
                <p className="text-sm font-bold leading-6 text-[#0A0D17]">
                  Clean form, premium feel, daily function.
                </p>
              </div>

              <div className="border border-black bg-black p-4 rounded-[5px]">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">
                  Ver. 2026.04
                </p>
                <p className="text-sm font-semibold leading-6 text-white">
                  Minimal direction with a bold streetwear edge.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PHILOSOPHY */}
        <div className="mt-5 overflow-hidden border border-black bg-black shadow-sm rounded-[5px]">
          <div className="grid md:grid-cols-[220px_1fr]">
            <div className="border-b border-white/10 p-5 md:border-b-0 md:border-r md:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-gray-400">
                Philosophy
              </p>
            </div>

            <div className="p-5 md:p-6">
              <p className="text-sm leading-7 text-gray-300 md:text-[15px]">
                We create a refined wardrobe that bridges premium fashion
                attitude and real-world street utility — pieces that feel
                elevated without being loud.
              </p>
            </div>
          </div>
        </div>

        {/* CORE PILLARS */}
        <div className="mt-10 border border-black/10 bg-white px-4 py-6 text-center shadow-sm rounded-[5px] md:mt-12">
          <Title text1={"CORE"} text2={"PILLARS"} />
          <div className="mx-auto mt-3 h-[2px] w-12 bg-black" />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="border border-black/10 bg-white p-5 shadow-sm rounded-[5px] md:p-6">
            <span className="text-[10px] font-black uppercase tracking-[0.32em] text-gray-500">
              01 / Fabric
            </span>
            <h3 className="mt-4 text-xl font-black uppercase tracking-tight text-black">
              Premium Curation
            </h3>
            <p className="mt-3 text-[13px] font-medium leading-6 text-gray-500">
              Materials selected for durability, comfort, and structure.
            </p>
          </div>

          <div className="border border-black bg-black p-5 shadow-sm rounded-[5px] md:p-6">
            <span className="text-[10px] font-black uppercase tracking-[0.32em] text-gray-400">
              02 / Vision
            </span>
            <h3 className="mt-4 text-xl font-black uppercase tracking-tight text-white">
              Minimal Precision
            </h3>
            <p className="mt-3 text-[13px] font-medium leading-6 text-gray-400">
              Clean design, strong silhouette, intentional identity.
            </p>
          </div>

          <div className="border border-black/10 bg-white p-5 shadow-sm rounded-[5px] md:p-6">
            <span className="text-[10px] font-black uppercase tracking-[0.32em] text-gray-500">
              03 / Community
            </span>
            <h3 className="mt-4 text-xl font-black uppercase tracking-tight text-black">
              The Collective
            </h3>
            <p className="mt-3 text-[13px] font-medium leading-6 text-gray-500">
              Built for creators, thinkers, and everyday wearers.
            </p>
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="mb-12 mt-10 md:mb-16 md:mt-12">
          <NewsletterBox />
        </div>
      </div>
    </div>
  );
};

export default About;