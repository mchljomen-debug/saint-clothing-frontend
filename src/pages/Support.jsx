import React from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdSupportAgent, MdEmail, MdPhone, MdAccessTime } from "react-icons/md";

export default function Support() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent font-['Outfit'] pt-[50px] pb-16">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        <button
          onClick={() => navigate("/profile")}
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-gray-500 transition hover:text-black"
        >
          <MdArrowBack className="text-sm" />
          Back to Profile
        </button>

        <div className="rounded-[22px] border border-black/10 bg-white/45 p-6 md:p-7 backdrop-blur-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-black/5 p-3 text-[#0A0D17]">
              <MdSupportAgent className="text-xl" />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0A0D17]">
                Support
              </h3>
              <p className="mt-2 text-[11px] font-semibold text-gray-500">
                Help and contact information
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SupportCard
              icon={<MdEmail className="text-xl" />}
              title="Email Support"
              text="support@saintclothing.com"
            />
            <SupportCard
              icon={<MdPhone className="text-xl" />}
              title="Customer Care"
              text="+63 912 345 6789"
            />
            <SupportCard
              icon={<MdAccessTime className="text-xl" />}
              title="Support Hours"
              text="Monday to Saturday, 9:00 AM to 6:00 PM"
            />
          </div>

          <div className="mt-6 rounded-[18px] border border-black/10 bg-white p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
              Frequently Asked Questions
            </p>

            <div className="mt-4 space-y-4">
              <FaqItem
                question="How long does shipping take?"
                answer="Shipping time depends on your location and courier schedule. Orders are processed after confirmation and dispatch."
              />
              <FaqItem
                question="What payment methods are accepted?"
                answer="Available payment methods may include Cash on Delivery, GCash, Maya, GoTyme, and other approved options shown during checkout."
              />
              <FaqItem
                question="How do I track my order?"
                answer="You can view your order progress inside the Orders page after logging in to your account."
              />
              <FaqItem
                question="Can I return or exchange an item?"
                answer="Returns and exchanges are subject to item condition, proof of purchase, and store review."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SupportCard = ({ icon, title, text }) => (
  <div className="rounded-xl border border-black/10 bg-white p-4">
    <div className="mb-3 text-[#0A0D17]">{icon}</div>
    <p className="text-sm font-black text-[#0A0D17]">{title}</p>
    <p className ="mt-2 text-sm font-semibold text-gray-600 leading-6">{text}</p>
  </div>
);

const FaqItem = ({ question, answer }) => (
  <div className="rounded-xl border border-black/10 bg-[#FAFAF8] p-4">
    <p className="text-sm font-black text-[#0A0D17]">{question}</p>
    <p className="mt-2 text-sm font-semibold text-gray-600 leading-6">{answer}</p>
  </div>
);