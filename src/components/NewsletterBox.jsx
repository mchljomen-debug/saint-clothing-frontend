import React from "react";

const NewsletterBox = () => {
const onSubmitHandler = (event) => {
event.preventDefault();
};

return ( <section className="relative overflow-hidden border border-black bg-[#f5f5f2]">
{/* Background typography */} <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"> <span className="text-[18vw] font-black uppercase leading-none tracking-[-0.12em] text-black/[0.025]">
SAINT </span> </div>

  {/* Technical lines */}
  <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-black/[0.06]" />
  <div className="pointer-events-none absolute bottom-0 left-[10%] top-0 w-px bg-black/[0.04]" />
  <div className="pointer-events-none absolute bottom-0 right-[10%] top-0 w-px bg-black/[0.04]" />

  <div className="relative z-10 px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12">

    {/* Header */}
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-7 bg-black" />

          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-black/40">
            Saint / Inner Circle
          </p>
        </div>

        <h2 className="text-4xl font-black uppercase leading-[0.85] tracking-[-0.07em] text-black sm:text-5xl md:text-6xl">
          Stay
          <br />
          Connected.
        </h2>
      </div>

      <p className="max-w-sm text-[10px] font-medium uppercase leading-5 tracking-[0.12em] text-black/40 md:text-right">
        New drops. Exclusive releases.
        <br />
        Saint updates.
      </p>
    </div>

    {/* Form */}
    <form
      onSubmit={onSubmitHandler}
      className="mt-8 flex flex-col border border-black bg-white sm:flex-row"
    >
      <input
        className="min-w-0 flex-1 bg-transparent px-4 py-4 text-xs font-medium outline-none placeholder:text-black/30 sm:px-5"
        type="email"
        placeholder="ENTER YOUR EMAIL ADDRESS"
        required
      />

      <button
        type="submit"
        className="group flex items-center justify-between gap-8 bg-black px-5 py-4 text-white transition hover:bg-[#222]"
      >
        <span className="text-[8px] font-black uppercase tracking-[0.28em]">
          Subscribe
        </span>

        <span className="text-base transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </button>
    </form>

    {/* Bottom information */}
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[8px] font-black uppercase tracking-[0.25em] text-black/30">
        10% off your first order
      </p>

      <p className="text-[8px] font-black uppercase tracking-[0.25em] text-black/30">
        No spam / Unsubscribe anytime
      </p>
    </div>
  </div>
</section>


);
};

export default NewsletterBox;
