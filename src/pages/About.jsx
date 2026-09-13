import React from "react";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";

const About = () => {
  return (
    <div className="bg-[#f5f4f0] text-[#0A0D17]">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-black/10">
        {/* Background typography */}
        <div className="pointer-events-none absolute -left-[3vw] top-[8vh] select-none text-[25vw] font-black uppercase leading-[0.72] tracking-[-0.12em] text-black/[0.035]">
          SAINT
        </div>

        {/* Technical lines */}
        <div className="pointer-events-none absolute left-[8vw] top-0 hidden h-full w-px bg-black/[0.06] lg:block" />
        <div className="pointer-events-none absolute left-0 right-0 top-[42%] h-px bg-black/[0.06]" />

        <div className="relative mx-auto max-w-[1600px] px-5 pb-16 pt-10 sm:px-8 sm:pb-20 md:px-[7vw] md:pt-16 lg:px-[8vw] lg:pb-28">
          {/* Top metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-black" />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/70">
                Saint Clothing
              </p>
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/35">
              About / 01
            </p>
          </div>

          {/* Main hero */}
          <div className="mt-16 grid items-end gap-10 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
            {/* Heading */}
            <div>
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.35em] text-black/40">
                Modern Streetwear Identity
              </p>

              <h1 className="max-w-5xl text-[clamp(4.5rem,11vw,11rem)] font-black uppercase leading-[0.75] tracking-[-0.095em]">
                Wear
                <br />
                The
                <br />
                Identity.
              </h1>

              <div className="mt-10 flex max-w-xl items-start gap-5">
                <span className="mt-2 h-px w-12 shrink-0 bg-black" />

                <p className="text-sm font-medium leading-7 text-black/55 md:text-base">
                  Saint Clothing is built around a simple idea:
                  <span className="font-black text-black">
                    {" "}
                    clothing should define presence without demanding attention.
                  </span>
                </p>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative">
              <div className="absolute -right-3 -top-3 h-10 w-10 border-r border-t border-black/30" />
              <div className="absolute -bottom-3 -left-3 h-10 w-10 border-b border-l border-black/30" />

              <div className="relative aspect-[4/5] overflow-hidden bg-[#dedbd3]">
                <img
                  src={assets.about_img}
                  alt="Saint Clothing"
                  className="h-full w-full object-cover grayscale-[15%] transition duration-1000 hover:scale-[1.04]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/75">
                    Saint / Studio
                  </p>

                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/60">
                    01—26
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MANIFESTO
      ========================================================= */}
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 md:px-[7vw] md:py-28 lg:px-[8vw] lg:py-36">
          <div className="grid gap-12 lg:grid-cols-[0.25fr_1fr] lg:gap-20">
            {/* Number */}
            <div className="flex items-start gap-4">
              <span className="text-[11px] font-black tracking-[0.3em] text-black/35">
                01
              </span>

              <div className="mt-1 h-px w-10 bg-black/30" />
            </div>

            {/* Statement */}
            <div>
              <p className="max-w-6xl text-[clamp(2.4rem,6vw,6.5rem)] font-black uppercase leading-[0.86] tracking-[-0.07em]">
                Less noise.
                <br />
                More form.
                <br />
                <span className="text-black/25">More identity.</span>
              </p>

              <div className="mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
                <p className="text-sm leading-7 text-black/55 md:text-base">
                  Saint was created around the idea of a modern uniform.
                  Clothing that feels considered without becoming complicated.
                  Strong silhouettes, restrained details, and pieces designed
                  to work beyond a single season.
                </p>

                <p className="text-sm leading-7 text-black/55 md:text-base">
                  We believe the strongest pieces don't need to shout.
                  They become part of the person wearing them — adapting to
                  everyday life while maintaining a clear visual identity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PHILOSOPHY
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#0A0D17] text-white">
        {/* Giant number */}
        <div className="pointer-events-none absolute -right-[3vw] top-[-5vw] select-none text-[28vw] font-black leading-none tracking-[-0.12em] text-white/[0.035]">
          02
        </div>

        <div className="relative mx-auto max-w-[1600px] px-5 py-20 sm:px-8 md:px-[7vw] md:py-28 lg:px-[8vw] lg:py-36">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
            {/* Left */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-white" />

                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
                  Philosophy
                </p>
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                Saint / 02
              </p>
            </div>

            {/* Right */}
            <div>
              <h2 className="max-w-5xl text-[clamp(3rem,7vw,7rem)] font-black uppercase leading-[0.82] tracking-[-0.08em]">
                Built for
                <br />
                <span className="text-white/25">real life.</span>
              </h2>

              <p className="mt-10 max-w-2xl text-sm leading-7 text-white/50 md:text-base md:leading-8">
                Premium fashion attitude meets everyday street utility.
                Every decision is made with purpose — from silhouette and
                fabric to the smallest visual detail.
              </p>

              <div className="mt-14 border-t border-white/10">
                <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
                  {/* Pillar 01 */}
                  <div className="py-7 md:px-7 md:first:pl-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                      01 / Fabric
                    </p>

                    <h3 className="mt-4 text-xl font-black uppercase tracking-[-0.03em]">
                      Material
                    </h3>

                    <p className="mt-3 text-xs leading-6 text-white/40">
                      Chosen for comfort, durability, texture, and structure.
                    </p>
                  </div>

                  {/* Pillar 02 */}
                  <div className="py-7 md:px-7">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                      02 / Form
                    </p>

                    <h3 className="mt-4 text-xl font-black uppercase tracking-[-0.03em]">
                      Silhouette
                    </h3>

                    <p className="mt-3 text-xs leading-6 text-white/40">
                      Clean proportions designed to create a confident shape.
                    </p>
                  </div>

                  {/* Pillar 03 */}
                  <div className="py-7 md:px-7 md:pr-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                      03 / People
                    </p>

                    <h3 className="mt-4 text-xl font-black uppercase tracking-[-0.03em]">
                      Collective
                    </h3>

                    <p className="mt-3 text-xs leading-6 text-white/40">
                      Made for creators, thinkers, and everyday wearers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CLOSING STATEMENT
      ========================================================= */}
      <section className="border-b border-black/10 bg-[#f5f4f0]">
        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 md:px-[7vw] md:py-28 lg:px-[8vw] lg:py-36">
          <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-6 text-[9px] font-black uppercase tracking-[0.4em] text-black/35">
                The Saint Direction
              </p>

              <h2 className="max-w-5xl text-[clamp(3rem,8vw,8rem)] font-black uppercase leading-[0.8] tracking-[-0.085em]">
                Don't follow
                <br />
                the uniform.
                <br />
                <span className="text-black/20">Define it.</span>
              </h2>
            </div>

            <div className="max-w-xs md:pb-2">
              <p className="text-[10px] font-black uppercase leading-6 tracking-[0.22em] text-black/40">
                Saint Clothing
                <br />
                Modern Streetwear
                <br />
                Since 2026
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          NEWSLETTER
      ========================================================= */}
      <div className="mb-16 mt-10 px-5 pb-4 md:mb-1 0 md:mt-14 md:px-[7vw] lg:px-[10vw]">
        <NewsletterBox />
      </div>
    </div>  
  );
};

export default About;