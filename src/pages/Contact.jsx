import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";

const Contact = () => {
  return (
    <div className="bg-[#F7F7F5] text-[#0A0D17]">
      <div className="mx-auto max-w-[1440px] px-4 pb-14 pt-8 sm:px-6 md:px-10 md:pb-16 lg:px-16 lg:pt-10">

        {/* ================= HEADER ================= */}
        <div className="relative mb-8 border-b border-black/10 pb-6">
          <div className="absolute right-0 top-0 hidden text-right md:block">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-gray-400">
              CONTACT / 01
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Saint Clothing
            </p>
          </div>

          <Title text1={"CONTACT"} text2={"SAINT"} />

          <div className="mt-3 flex items-center gap-3">
            <span className="h-px w-8 bg-black" />
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-gray-500 md:text-[11px]">
              Open line to Saint Clothing
            </p>
          </div>
        </div>

        {/* ================= INTRO ================= */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <h1 className="max-w-5xl text-[12vw] font-black uppercase leading-[0.75] tracking-[-0.08em] text-black sm:text-[10vw] md:text-[8vw] lg:text-[7rem]">
              Let's
              <br />
              <span className="italic">Talk.</span>
            </h1>
          </div>

          <div className="border-l border-black/15 pl-5 lg:pb-2">
            <p className="text-[12px] font-semibold uppercase leading-6 tracking-[0.08em] text-gray-500">
              Questions, collaborations, wholesale inquiries or just want to
              say hello?
            </p>

            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-black">
              We are listening.
            </p>
          </div>
        </div>

        {/* ================= MAIN GRID ================= */}
        <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">

          {/* IMAGE PANEL */}
          <div className="group relative min-h-[430px] overflow-hidden bg-black md:min-h-[560px]">
            <img
              src={assets.contact_img}
              alt="Saint Clothing"
              className="absolute inset-0 h-full w-full object-cover grayscale-[15%] transition duration-1000 ease-out group-hover:scale-105 group-hover:grayscale-0"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

            <div className="absolute left-5 top-5">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-white" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">
                  Saint Studio
                </span>
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">
                Available For
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {["Support", "Collabs", "Wholesale", "General"].map(
                  (item) => (
                    <span
                      key={item}
                      className="border border-white/25 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* CONTACT INFORMATION */}
          <div className="flex flex-col border border-black/10 bg-white">

            {/* EMAIL */}
            <a
              href="mailto:mchljmn@gmail.com"
              className="group border-b border-black/10 p-6 transition-colors duration-300 hover:bg-black hover:text-white md:p-8"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-gray-500">
                    01 / Email
                  </p>

                  <h2 className="mt-5 text-2xl font-black uppercase tracking-tight md:text-3xl">
                    Client Services
                  </h2>

                  <p className="mt-2 break-all text-sm font-medium text-gray-500 group-hover:text-gray-400">
                    mchljmn@gmail.com
                  </p>
                </div>

                <span className="text-2xl font-light transition-transform duration-300 group-hover:translate-x-1">
                  ↗
                </span>
              </div>
            </a>

            {/* PHONE */}
            <a
              href="tel:+639753336199"
              className="group border-b border-black/10 p-6 transition-colors duration-300 hover:bg-black hover:text-white md:p-8"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-gray-500">
                    02 / Phone
                  </p>

                  <h2 className="mt-5 text-2xl font-black uppercase tracking-tight md:text-3xl">
                    Direct Line
                  </h2>

                  <p className="mt-2 text-sm font-medium text-gray-500 group-hover:text-gray-400">
                    (+63) 975 333 6199
                  </p>
                </div>

                <span className="text-2xl font-light transition-transform duration-300 group-hover:translate-x-1">
                  ↗
                </span>
              </div>
            </a>

            {/* LOCATION */}
            <div className="flex-1 bg-black p-6 text-white md:p-8">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                      03 / Location
                    </p>

                    <h2 className="mt-5 text-2xl font-black uppercase tracking-tight md:text-3xl">
                      Saint Clothing
                    </h2>

                    <p className="mt-3 text-sm font-medium leading-6 text-white/50">
                      Pasig City, Metro Manila,
                      <br />
                      Philippines, 1600
                    </p>
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">
                    PH / 1600
                  </span>
                </div>

                <div className="mt-10 border-t border-white/10 pt-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/40">
                    Response Time
                  </p>

                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-white">
                    Usually within 24–48 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CAREERS ================= */}
        <div className="mt-5 grid overflow-hidden border border-black bg-black text-white md:grid-cols-[1fr_auto] md:items-center">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-white/50" />

              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">
                Work With Us
              </p>
            </div>

            <h2 className="mt-4 text-3xl font-black uppercase italic tracking-[-0.03em] md:text-4xl">
              Build the next chapter.
            </h2>

            <p className="mt-3 max-w-xl text-[12px] leading-6 text-white/45">
              We are open to passionate creatives, developers and designers
              who want to help shape the future of Saint Clothing.
            </p>
          </div>

          <div className="border-t border-white/10 p-5 md:border-l md:border-t-0 md:p-8">
            <button className="group flex w-full items-center justify-between gap-8 border border-white/20 px-6 py-4 text-[9px] font-black uppercase tracking-[0.25em] transition-all duration-300 hover:bg-white hover:text-black md:w-auto">
              <span>View Positions</span>
              <span className="text-base transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>

        {/* ================= NEWSLETTER ================= */}
        <div className="mt-10 px-4 pb-4 sm:px-6 md:mt-12 md:px-10">
          <NewsletterBox />
        </div>

      </div>
    </div>
  );
};

export default Contact;
