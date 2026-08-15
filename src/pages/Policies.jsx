import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdGavel,
  MdChevronRight,
  MdOutlineLocalShipping,
  MdOutlineReplay,
  MdOutlinePrivacyTip,
  MdOutlineDescription,
  MdOutlinePayments,
  MdInfoOutline,
  MdRefresh,
} from "react-icons/md";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

/* -------------------------------------------------------------------------- */
/* FALLBACK CONTENT                                                           */
/* -------------------------------------------------------------------------- */

const FALLBACK_POLICIES = [
  {
    key: "privacy-policy",
    title: "Privacy Policy",
    icon: MdOutlinePrivacyTip,
    content: [
      {
        title: "Information We Collect",
        text: "We collect information required to process orders, provide customer support, and maintain your account.",
      },
      {
        title: "Account Security",
        text: "Customers are responsible for keeping their account credentials secure and should not share them with unauthorized individuals.",
      },
      {
        title: "Payment Information",
        text: "Payment information is handled through supported payment providers when applicable.",
      },
    ],
  },
  {
    key: "terms-and-conditions",
    title: "Terms and Conditions",
    icon: MdOutlineDescription,
    content: [
      {
        title: "Acceptance",
        text: "By using the Saint Clothing website, you agree to follow the applicable store rules and conditions.",
      },
      {
        title: "Product Information",
        text: "Product availability, prices, promotions, and delivery estimates may change without prior notice.",
      },
      {
        title: "Customer Information",
        text: "Customers are responsible for providing accurate account and delivery information.",
      },
    ],
  },
  {
    key: "shipping-policy",
    title: "Shipping Policy",
    icon: MdOutlineLocalShipping,
    content: [
      {
        title: "Order Processing",
        text: "Orders are processed after payment or order confirmation.",
      },
      {
        title: "Delivery",
        text: "Delivery times depend on your location, courier availability, and order volume.",
      },
      {
        title: "Tracking",
        text: "Customers may track eligible shipments through the Orders page once a tracking number has been assigned.",
      },
      {
        title: "Pre-orders",
        text: "Pre-order items may have a separate estimated shipping date displayed on the order.",
      },
    ],
  },
  {
    key: "return-refund-policy",
    title: "Return and Refund Policy",
    icon: MdOutlineReplay,
    content: [
      {
        title: "Eligibility",
        text: "Returns and exchanges are subject to store review and approval.",
      },
      {
        title: "Item Condition",
        text: "Items must remain in acceptable condition and proof of purchase may be required.",
      },
      {
        title: "Excluded Items",
        text: "Items that have been used, damaged, altered, or washed may not qualify for return or exchange.",
      },
      {
        title: "Customer Support",
        text: "Please contact customer support if you believe your order has an issue.",
      },
    ],
  },
  {
    key: "payment-policy",
    title: "Payment Policy",
    icon: MdOutlinePayments,
    content: [
      {
        title: "Payment Methods",
        text: "Available payment methods are displayed during checkout.",
      },
      {
        title: "Online Payments",
        text: "Online payments may require verification before order processing begins.",
      },
      {
        title: "Cash on Delivery",
        text: "Cash on Delivery orders remain payable upon delivery unless the order status indicates that payment has already been collected.",
      },
      {
        title: "Payment Verification",
        text: "Orders with unsuccessful or unverified payments may be placed on hold until payment is confirmed.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const getPolicyIcon = (key = "") => {
  const normalized = String(key).toLowerCase();

  if (normalized.includes("ship")) {
    return MdOutlineLocalShipping;
  }

  if (
    normalized.includes("return") ||
    normalized.includes("refund") ||
    normalized.includes("exchange")
  ) {
    return MdOutlineReplay;
  }

  if (
    normalized.includes("privacy") ||
    normalized.includes("data")
  ) {
    return MdOutlinePrivacyTip;
  }

  if (
    normalized.includes("payment") ||
    normalized.includes("pay")
  ) {
    return MdOutlinePayments;
  }

  if (
    normalized.includes("term") ||
    normalized.includes("condition")
  ) {
    return MdOutlineDescription;
  }

  return MdGavel;
};

const normalizePolicyContent = (content) => {
  if (!Array.isArray(content)) {
    return [];
  }

  return content
    .map((item) => {
      /* Backend format:
         {
           title: "...",
           text: "..."
         }
      */
      if (typeof item === "object" && item !== null) {
        return {
          title: String(item.title || "").trim(),
          text: String(item.text || "").trim(),
        };
      }

      /* Backward compatibility with string content */
      if (typeof item === "string") {
        return {
          title: "",
          text: item.trim(),
        };
      }

      return {
        title: "",
        text: "",
      };
    })
    .filter((item) => item.title || item.text);
};

const normalizePolicies = (policies) => {
  if (!Array.isArray(policies)) {
    return [];
  }

  return policies
    .filter((policy) => policy?.isActive !== false)
    .sort(
      (a, b) =>
        Number(a?.sortOrder || 0) -
        Number(b?.sortOrder || 0)
    )
    .map((policy, index) => {
      const key =
        String(
          policy?.key ||
            policy?.slug ||
            `policy-${index + 1}`
        )
          .trim()
          .toLowerCase();

      return {
        key,
        title:
          String(
            policy?.title ||
              policy?.name ||
              `Policy ${index + 1}`
          ).trim(),
        requiredOnRegister: !!policy?.requiredOnRegister,
        sortOrder:
          Number(policy?.sortOrder) || index + 1,
        icon: getPolicyIcon(
          policy?.key ||
            policy?.slug ||
            policy?.title
        ),
        content: normalizePolicyContent(
          policy?.content
        ),
      };
    })
    .filter((policy) => policy.content.length > 0);
};

/* -------------------------------------------------------------------------- */
/* POLICY CARD                                                                */
/* -------------------------------------------------------------------------- */

const PolicyCard = ({ policy, index }) => {
  const Icon = policy.icon || MdGavel;

  return (
    <article
      id={`policy-${policy.key}`}
      className="scroll-mt-28 rounded-[24px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)] transition duration-300 hover:border-black/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:p-6 md:p-7"
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#0A0D17] text-white">
          <Icon className="text-xl" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">
              Section {String(index + 1).padStart(2, "0")}
            </span>

            {policy.requiredOnRegister && (
              <span className="rounded-full bg-black px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white">
                Required
              </span>
            )}
          </div>

          <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-[#0A0D17]">
            {policy.title}
          </h2>

          <div className="mt-6 space-y-5">
            {policy.content.map((section, sectionIndex) => (
              <div
                key={`${policy.key}-${sectionIndex}`}
                className="border-b border-black/[0.06] pb-5 last:border-0 last:pb-0"
              >
                {section.title && (
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0A0D17]">
                    {section.title}
                  </p>
                )}

                {section.text && (
                  <p
                    className={`text-[13px] font-medium leading-7 text-gray-600 ${
                      section.title ? "mt-2" : ""
                    }`}
                  >
                    {section.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

/* -------------------------------------------------------------------------- */
/* POLICY NAVIGATION                                                          */
/* -------------------------------------------------------------------------- */

const PolicyNavigation = ({ policies }) => {
  const scrollToPolicy = (key) => {
    const element = document.getElementById(
      `policy-${key}`
    );

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (!policies.length) {
    return null;
  }

  return (
    <aside className="h-fit lg:sticky lg:top-24">
      <div className="rounded-[22px] border border-black/[0.08] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.035)]">
        <div className="px-3 pb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-400">
            Policy Index
          </p>
        </div>

        <div className="space-y-1">
          {policies.map((policy) => {
            const Icon = policy.icon || MdGavel;

            return (
              <button
                key={policy.key}
                type="button"
                onClick={() =>
                  scrollToPolicy(policy.key)
                }
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#F7F7F5]"
              >
                <Icon className="shrink-0 text-lg text-gray-400 transition group-hover:text-black" />

                <span className="min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 transition group-hover:text-black">
                  {policy.title}
                </span>

                <MdChevronRight className="shrink-0 text-base text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-black" />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

/* -------------------------------------------------------------------------- */
/* LOADING SKELETON                                                           */
/* -------------------------------------------------------------------------- */

const PolicySkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[24px] border border-black/[0.08] bg-white p-6"
        >
          <div className="flex gap-5">
            <div className="h-11 w-11 shrink-0 rounded-[14px] bg-gray-200" />

            <div className="flex-1">
              <div className="h-3 w-24 rounded bg-gray-200" />

              <div className="mt-3 h-5 w-52 rounded bg-gray-200" />

              <div className="mt-7 space-y-3">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-11/12 rounded bg-gray-100" />
                <div className="h-3 w-9/12 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function Policies() {
  const navigate = useNavigate();

  const { backendUrl } = useContext(ShopContext);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const [policySet, setPolicySet] = useState({
    title: "Saint Clothing Policies",
    description:
      "Store rules, terms, privacy, shipping, returns, and payment policies.",
    version: "",
    policies: [],
  });

  const fetchPolicies = async () => {
    if (!backendUrl) {
      setApiError(true);
      setLoading(false);

      setPolicySet((previous) => ({
        ...previous,
        policies: FALLBACK_POLICIES,
      }));

      return;
    }

    try {
      setLoading(true);
      setApiError(false);

      const response = await axios.get(
        `${backendUrl}/api/policy`,
        {
          timeout: 10000,
        }
      );

      const data = response?.data;

      if (
        !data?.success ||
        !data?.policySet
      ) {
        throw new Error(
          "Invalid policy response"
        );
      }

      const incoming = data.policySet;

      const normalizedPolicies =
        normalizePolicies(
          incoming.policies
        );

      setPolicySet({
        title:
          incoming.title ||
          "Saint Clothing Policies",

        description:
          incoming.description ||
          "Store rules, terms, privacy, shipping, returns, and payment policies.",

        version:
          incoming.version || "",

        policies:
          normalizedPolicies.length
            ? normalizedPolicies
            : FALLBACK_POLICIES,
      });
    } catch (error) {
      console.error(
        "GET POLICIES ERROR:",
        error
      );

      setApiError(true);

      setPolicySet((previous) => ({
        ...previous,
        policies: FALLBACK_POLICIES,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [backendUrl]);

  const policies = useMemo(() => {
    return policySet.policies?.length
      ? policySet.policies
      : FALLBACK_POLICIES;
  }, [policySet.policies]);

  return (
    <div className="min-h-screen bg-transparent pb-20 font-['Outfit']">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 md:pt-8 lg:px-8">

        {/* ---------------------------------------------------------------- */}
        {/* BACK BUTTON                                                       */}
        {/* ---------------------------------------------------------------- */}

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="group mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 backdrop-blur-md transition hover:border-black hover:text-black"
        >
          <MdArrowBack className="text-sm transition group-hover:-translate-x-0.5" />
          Back to Profile
        </button>

        {/* ---------------------------------------------------------------- */}
        {/* HERO                                                              */}
        {/* ---------------------------------------------------------------- */}

        <section className="relative overflow-hidden rounded-[28px] bg-[#0A0D17] text-white shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/[0.05]" />

          <div className="pointer-events-none absolute -right-4 -top-8 h-40 w-40 rounded-full border border-white/[0.05]" />

          <div className="relative px-6 py-9 sm:px-8 sm:py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10">
                    <MdGavel className="text-xl" />
                  </div>

                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/45">
                    Saint Clothing
                  </p>
                </div>

                <h1 className="mt-6 text-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-5xl md:text-6xl">
                  {policySet.title}
                </h1>

                <p className="mt-5 max-w-xl text-[12px] font-medium leading-6 text-white/55 sm:text-[13px]">
                  {policySet.description}
                </p>
              </div>

              <div className="shrink-0">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/35">
                    Policy Version
                  </p>

                  <p className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-white">
                    {policySet.version ||
                      "Current"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* API WARNING                                                       */}
        {/* ---------------------------------------------------------------- */}

        {apiError && !loading && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <MdInfoOutline className="mt-0.5 shrink-0 text-lg text-amber-600" />

            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                Unable to Load Latest Policies
              </p>

              <p className="mt-1 text-[11px] font-medium leading-5 text-amber-700/80">
                General policy information is being
                displayed while the server policy
                information is unavailable.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPolicies}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700 transition hover:bg-amber-100"
            >
              <MdRefresh className="text-sm" />
              Retry
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CONTENT                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">

          {!loading && (
            <PolicyNavigation
              policies={policies}
            />
          )}

          <main className="min-w-0">
            {loading ? (
              <PolicySkeleton />
            ) : policies.length > 0 ? (
              <div className="space-y-4">
                {policies.map(
                  (policy, index) => (
                    <PolicyCard
                      key={`${policy.key}-${index}`}
                      policy={policy}
                      index={index}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="rounded-[24px] border border-black/10 bg-white p-12 text-center">
                <MdGavel className="mx-auto text-4xl text-gray-300" />

                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.25em] text-gray-500">
                  No Policies Available
                </p>

                <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-gray-400">
                  Policy information is currently
                  unavailable. Please try again
                  later or contact customer support.
                </p>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* SUPPORT CTA                                                   */}
            {/* ------------------------------------------------------------ */}

            {!loading && (
              <div className="mt-6 rounded-[22px] border border-black/[0.08] bg-white/60 px-5 py-5 backdrop-blur-md sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-gray-400">
                      Need Help?
                    </p>

                    <p className="mt-1 text-[12px] font-semibold leading-5 text-gray-600">
                      Have questions about a policy?
                      Contact Saint Clothing support.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/support")
                    }
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#222]"
                  >
                    Contact Support
                    <MdChevronRight className="text-base" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* FOOTER                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-black/10 pt-5 text-center sm:flex-row sm:text-left">
          <p className="text-[8px] font-black uppercase italic tracking-[0.3em] text-gray-400">
            Saint Clothing
          </p>

          <p className="text-[8px] font-black uppercase tracking-[0.25em] text-gray-400">
            Policy & Information Center
          </p>
        </div>
      </div>
    </div>
  );
}