import React from "react";
import { assets } from "../assets/assets";

const OurPolicy = () => {
  const policies = [
    {
      number: "01",
      title: "Easy Exchange",
      description: "Seamless product swaps",
      icon: assets.exchange_icon,
    },
    {
      number: "02",
      title: "7 Days Return",
      description: "Simple refund process",
      icon: assets.quality_icon,
    },
    {
      number: "03",
      title: "Elite Support",
      description: "Dedicated assistance",
      icon: assets.support_img,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-black py-8 sm:py-10">
      {/* Giant background typography */}
      <div className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 select-none text-[15rem] font-black leading-none tracking-[-0.14em] text-white/[0.025] lg:block">
        CARE
      </div>

      {/* Technical horizontal line */}
      <div className="pointer-events-none absolute left-0 right-0 top-[52px] h-px bg-white/[0.08]" />

      <div className="relative mx-auto max-w-[1500px] px-3 sm:px-5 md:px-[2.5vw] lg:px-[3.5vw]">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-white" />

            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/45">
              Saint / Service
            </span>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/25">
              Customer Experience
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Main service panel */}
        <div className="grid overflow-hidden border border-white/10 lg:grid-cols-[0.55fr_1.45fr]">
          {/* Intro */}
          <div className="relative overflow-hidden border-b border-white/10 bg-[#0b0b0b] p-6 sm:p-7 lg:border-b-0 lg:border-r">
            <span className="absolute -bottom-7 -left-3 select-none text-[8rem] font-black leading-none tracking-[-0.12em] text-white/[0.035]">
              00
            </span>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.35em] text-white/30">
                  The Saint Standard
                </p>

                <h2 className="mt-3 max-w-[230px] text-3xl font-black uppercase leading-[0.85] tracking-[-0.06em] text-white sm:text-4xl">
                  Made
                  <br />
                  Simple.
                </h2>
              </div>

              <div className="mt-8">
                <div className="mb-3 h-px w-8 bg-white/30" />

                <p className="max-w-[220px] text-[9px] font-bold uppercase leading-5 tracking-[0.16em] text-white/35">
                  Everything you need after your order, without the unnecessary
                  steps.
                </p>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="grid bg-[#050505] sm:grid-cols-3">
            {policies.map((policy, index) => (
              <div
                key={policy.number}
                className={`group relative min-h-[190px] overflow-hidden p-6 transition-colors duration-500 hover:bg-white sm:min-h-[210px] sm:p-7 ${
                  index !== 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""
                }`}
              >
                {/* Giant number */}
                <span className="pointer-events-none absolute -right-1 -top-4 select-none text-[8rem] font-black leading-none tracking-[-0.13em] text-white/[0.035] transition-all duration-500 group-hover:translate-x-2 group-hover:text-black/[0.045]">
                  {policy.number}
                </span>

                {/* Top label */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 transition-colors duration-500 group-hover:text-black/35">
                    Service
                  </span>

                  <span className="text-[8px] font-black tracking-[0.2em] text-white/20 transition-colors duration-500 group-hover:text-black/25">
                    {policy.number}
                  </span>
                </div>

                {/* Icon */}
                <div className="relative z-10 mt-7 flex h-9 w-9 items-center justify-center border border-white/15 transition-all duration-500 group-hover:border-black/15">
                  <img
                    src={policy.icon}
                    alt={policy.title}
                    className="h-5 w-5 object-contain grayscale brightness-0 invert transition-all duration-500 group-hover:brightness-100 group-hover:invert-0"
                  />
                </div>

                {/* Text */}
                <div className="relative z-10 mt-5">
                  <h3 className="text-sm font-black uppercase tracking-[-0.025em] text-white transition-colors duration-500 group-hover:text-black sm:text-base">
                    {policy.title}
                  </h3>

                  <p className="mt-1 max-w-[170px] text-[8px] font-bold uppercase leading-4 tracking-[0.13em] text-white/30 transition-colors duration-500 group-hover:text-black/40">
                    {policy.description}
                  </p>
                </div>

                {/* Corner mark */}
                <span className="absolute bottom-4 right-4 h-3 w-3 border-b border-r border-white/15 transition-colors duration-500 group-hover:border-black/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom information */}
        <div className="flex flex-col justify-between gap-2 border-b border-white/10 py-3 sm:flex-row sm:items-center">
          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/25">
            Saint Clothing / Customer Care
          </p>

          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">
            Simple service — Better experience
          </p>
        </div>
      </div>
    </section>
  );
};

export default OurPolicy;
