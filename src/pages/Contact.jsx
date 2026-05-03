import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";

const Contact = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F7F7F4] pt-4">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 md:px-8 lg:px-10">
        {/* HEADER */}
        <div className="rounded-[5px] border border-black/10 bg-white px-4 py-6 text-center shadow-sm md:px-6 md:py-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
            Saint Clothing
          </p>

          <Title text1={"CONTACT"} text2={"SAINT"} />

          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.32em] text-gray-500 md:text-[11px]">
            Get in touch with Saint Clothing
          </p>
        </div>

        {/* MAIN */}
        <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          {/* IMAGE */}
          <div className="overflow-hidden rounded-[5px] border border-black/10 bg-white shadow-sm">
            <div className="group relative h-full min-h-[340px] w-full overflow-hidden md:min-h-[560px]">
              <img
                className="absolute inset-0 h-full w-full object-cover grayscale-[10%] transition-all duration-700 ease-out group-hover:scale-105"
                src={assets.contact_img}
                alt="Saint Clothing"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />

              <div className="absolute left-4 top-4">
                <span className="inline-flex rounded-[5px] bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                  Contact Saint
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="max-w-[340px] rounded-[5px] border border-black/10 bg-white/90 p-4 shadow-sm backdrop-blur-md">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.26em] text-gray-500">
                    Client Support
                  </p>
                  <p className="text-sm font-bold leading-6 text-[#0A0D17]">
                    For support, collaborations, wholesale, and general
                    inquiries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className="flex flex-col justify-between rounded-[5px] border border-black/10 bg-white p-5 shadow-sm md:p-7 lg:p-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">
                Reach Out
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase italic leading-none tracking-tight text-[#0A0D17] md:text-4xl lg:text-5xl">
                Let’s
                <br />
                Connect.
              </h2>

              <div className="mt-5 h-[2px] w-12 bg-black" />

              <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[5px] border border-black/10 bg-[#F8F8F6] p-5">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-gray-500">
                    Email
                  </p>
                  <p className="text-lg font-black uppercase tracking-tight text-black md:text-xl">
                    Client Services
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-gray-600">
                    mchljmn@gmail.com
                  </p>
                </div>

                <div className="rounded-[5px] border border-black/10 bg-[#F8F8F6] p-5">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-gray-500">
                    Phone
                  </p>
                  <p className="text-lg font-black uppercase tracking-tight text-black md:text-xl">
                    Direct Line
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-600">
                    (+63) 975 333 6199
                  </p>
                </div>

                <div className="rounded-[5px] border border-black bg-black p-5 md:col-span-2">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-gray-400">
                    Address
                  </p>
                  <p className="text-lg font-black uppercase tracking-tight text-white md:text-xl">
                    Saint Clothing
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-400">
                    Pasig City, Metro Manila,
                    <br />
                    Philippines, 1600
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col justify-between gap-5 border-t border-black/10 pt-6 md:mt-10 md:flex-row md:items-center">
              <div className="max-w-md">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-black">
                  Careers at Saint
                </p>
                <p className="text-[13px] font-medium leading-6 text-gray-500">
                  We are open to passionate creatives, developers, and designers
                  who want to grow with the brand.
                </p>
              </div>

              <button className="h-11 whitespace-nowrap rounded-[5px] border border-black bg-black px-6 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black">
                View Positions
              </button>
            </div>
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

export default Contact;