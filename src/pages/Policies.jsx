import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdGavel } from "react-icons/md";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

export default function Policies() {
  const navigate = useNavigate();
  const { backendUrl } = useContext(ShopContext);

  const [loading, setLoading] = useState(true);
  const [policySet, setPolicySet] = useState({
    title: "Policies",
    description: "Store rules and policy information",
    version: "",
    policies: [],
  });

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/policy`);

        if (res.data.success) {
          setPolicySet({
            title: res.data.policySet.title || "Policies",
            description:
              res.data.policySet.description ||
              "Store rules and policy information",
            version: res.data.policySet.version || "",
            policies: res.data.policySet.policies || [],
          });
        }
      } catch (error) {
        console.log("GET POLICIES ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [backendUrl]);

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
              <MdGavel className="text-xl" />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0A0D17]">
                {policySet.title}
              </h3>
              <p className="mt-2 text-[11px] font-semibold text-gray-500">
                {policySet.description}
              </p>
              {policySet.version ? (
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Version {policySet.version}
                </p>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-black/10 bg-white p-4 text-sm font-semibold text-gray-500">
              Loading policies...
            </div>
          ) : (
            <div className="grid gap-4">
              {policySet.policies.map((item, index) => (
                <PolicyCard
                  key={`${item.key}-${index}`}
                  title={item.title}
                  text={item.content}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PolicyCard = ({ title, text }) => (
  <div className="rounded-xl border border-black/10 bg-white p-4">
    <p className="text-sm font-black text-[#0A0D17]">{title}</p>

    <div className="mt-2 space-y-2">
      {(Array.isArray(text) ? text : [text]).map((line, index) => (
        <p
          key={index}
          className="text-sm font-semibold text-gray-600 leading-6"
        >
          {line}
        </p>
      ))}
    </div>
  </div>
);  