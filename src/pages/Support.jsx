import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdSupportAgent,
  MdEmail,
  MdPhone,
  MdAccessTime,
  MdLocalShipping,
  MdPayment,
  MdReplay,
  MdHelpOutline,
  MdChevronRight,
} from "react-icons/md";

export default function Support() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent font-['Outfit'] pt-8 pb-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="group mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500 transition-all duration-200 hover:text-black"
        >
          <MdArrowBack className="text-base transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Profile
        </button>

        {/* Main Container */}
        <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white/50 shadow-[0_20px_60px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-black/10 bg-[#0A0D17] px-6 py-10 text-white md:px-10 md:py-12">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/[0.04]" />
            <div className="absolute -bottom-32 right-20 h-72 w-72 rounded-full bg-white/[0.03]" />

            <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
                  <MdSupportAgent className="text-base text-white" />

                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/70">
                    Customer Care
                  </span>
                </div>

                <h1 className="text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">
                  How Can We
                  <br />
                  <span className="italic text-white/60">Help?</span>
                </h1>

                <p className="mt-5 max-w-xl text-sm font-medium leading-6 text-white/60">
                  Need help with your order, payment, delivery, or account?
                  Our customer support team is here to assist you.
                </p>
              </div>

              <div className="hidden md:block">
                <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-5 py-4 text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40">
                    Saint Clothing
                  </p>

                  <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
                    Support Center
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-7 md:px-8 md:py-10 lg:px-10">
            {/* Contact Section */}
            <section>
              <div className="mb-6 flex items-center gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-400">
                    Get In Touch
                  </p>

                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#0A0D17]">
                    Contact Support
                  </h2>
                </div>

                <div className="h-px flex-1 bg-black/10" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SupportCard
                  icon={<MdEmail />}
                  title="Email Support"
                  text="support@saintclothing.com"
                  description="Send us your questions anytime."
                />

                <SupportCard
                  icon={<MdPhone />}
                  title="Customer Care"
                  text="+63 912 345 6789"
                  description="Talk directly with our support team."
                />

                <SupportCard
                  icon={<MdAccessTime />}
                  title="Support Hours"
                  text="Mon – Sat"
                  description="9:00 AM – 6:00 PM"
                />
              </div>
            </section>

            {/* Quick Help */}
            <section className="mt-10">
              <div className="mb-6 flex items-center gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-400">
                    Quick Help
                  </p>

                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#0A0D17]">
                    Common Topics
                  </h2>
                </div>

                <div className="h-px flex-1 bg-black/10" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <QuickHelpCard
                  icon={<MdLocalShipping />}
                  title="Orders & Delivery"
                  text="Track parcels and understand delivery updates."
                  onClick={() => navigate("/orders")}
                />

                <QuickHelpCard
                  icon={<MdPayment />}
                  title="Payments"
                  text="Learn about payment confirmation and issues."
                />

                <QuickHelpCard
                  icon={<MdReplay />}
                  title="Returns & Exchanges"
                  text="Learn about return and exchange requirements."
                />
              </div>
            </section>

            {/* FAQ */}
            <section className="mt-10">
              <div className="mb-6 flex items-center gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-400">
                    Need Answers?
                  </p>

                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#0A0D17]">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="h-px flex-1 bg-black/10" />
              </div>

              <div className="overflow-hidden rounded-[18px] border border-black/10 bg-white">
                <FaqItem
                  number="01"
                  question="How long does shipping take?"
                  answer="Shipping time depends on your location and courier schedule. Orders are processed after payment or order confirmation and are dispatched once ready."
                />

                <FaqItem
                  number="02"
                  question="What payment methods are accepted?"
                  answer="Available payment methods may include Cash on Delivery, GCash, Maya, GoTyme, and other approved payment options displayed during checkout."
                />

                <FaqItem
                  number="03"
                  question="How do I track my order?"
                  answer="Open your Orders page after logging in. Once a tracking number is available, you can use the provided tracking option to follow your parcel."
                  action={
                    <button
                      type="button"
                      onClick={() => navigate("/orders")}
                      className="mt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-black transition hover:opacity-60"
                    >
                      View My Orders
                      <MdChevronRight className="text-sm" />
                    </button>
                  }
                />

                <FaqItem
                  number="04"
                  question="Can I return or exchange an item?"
                  answer="Returns and exchanges are subject to item condition, proof of purchase, eligibility requirements, and store review. Please review the store policies for complete details."
                />

                <FaqItem
                  number="05"
                  question="What should I do if my payment is still pending?"
                  answer="If your payment is still being verified, please allow time for confirmation. Your order status will be updated once the payment has been reviewed."
                />
              </div>
            </section>

            {/* Support CTA */}
            <section className="mt-10">
              <div className="overflow-hidden rounded-[20px] bg-[#F4F4F2]">
                <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                      <MdHelpOutline className="text-xl" />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                        Still Need Help?
                      </p>

                      <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-[#0A0D17]">
                        Our team is ready to assist.
                      </h3>

                      <p className="mt-2 max-w-xl text-xs font-semibold leading-5 text-gray-500">
                        Contact us through email or customer care and provide
                        your order reference when applicable so we can assist
                        you faster.
                      </p>
                    </div>
                  </div>

                  <a
                    href="mailto:support@saintclothing.com"
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#222]"
                  >
                    <MdEmail className="text-base" />
                    Contact Support
                  </a>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-black/10 pt-5 text-center md:flex-row md:text-left">
              <p className="text-[9px] font-black uppercase italic tracking-[0.3em] text-gray-400">
                Saint Clothing Support Center
              </p>

              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                We're Here To Help
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUPPORT CARD
========================================================= */

const SupportCard = ({ icon, title, text, description }) => {
  return (
    <div className="group rounded-[18px] border border-black/10 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F4F2] text-[#0A0D17] transition-colors duration-300 group-hover:bg-black group-hover:text-white">
          <span className="text-xl">{icon}</span>
        </div>

        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-300">
          Support
        </span>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {title}
        </p>

        <p className="mt-2 break-words text-sm font-black text-[#0A0D17]">
          {text}
        </p>

        <p className="mt-2 text-[11px] font-semibold leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   QUICK HELP CARD
========================================================= */

const QuickHelpCard = ({ icon, title, text, onClick }) => {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F4F2] text-[#0A0D17]">
          <span className="text-xl">{icon}</span>
        </div>

        <MdChevronRight className="text-lg text-gray-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-black" />
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0A0D17]">
          {title}
        </p>

        <p className="mt-2 text-[11px] font-semibold leading-5 text-gray-500">
          {text}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group rounded-[18px] border border-black/10 bg-white p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="group rounded-[18px] border border-black/10 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
      {content}
    </div>
  );
};

/* =========================================================
   FAQ ITEM
========================================================= */

const FaqItem = ({ number, question, answer, action }) => {
  return (
    <div className="group border-b border-black/10 p-5 last:border-b-0 md:p-6">
      <div className="flex gap-4">
        <div className="hidden shrink-0 pt-0.5 sm:block">
          <span className="text-[9px] font-black tracking-[0.16em] text-gray-300">
            {number}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />

            <p className="text-sm font-black leading-5 text-[#0A0D17]">
              {question}
            </p>
          </div>

          <p className="mt-3 pl-4 text-xs font-semibold leading-6 text-gray-500">
            {answer}
          </p>

          {action && <div className="pl-4">{action}</div>}
        </div>
      </div>
    </div>
  );
};