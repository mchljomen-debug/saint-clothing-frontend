import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { MdArrowBack, MdTune } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const defaultPreferences = {
  favoriteCategories: [],
  preferredSize: "",
  notifyOrders: true,
  notifyDrops: true,
  defaultAddressId: "",
};

const categoryOptions = [
  "Tshirt",
  "Long Sleeve",
  "Jorts",
  "Mesh Shorts",
  "Crop Jersey",
];

const sizeOptions = ["S", "M", "L", "XL", "2XL", "3XL"];

export default function Preferences() {
  const { token, user, setUser, backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${backendUrl}/api/user/preferences`, {
          headers: {
            Authorization: `Bearer ${token}`,
            token,
          },
        });

        if (res.data.success) {
          setPreferences({
            favoriteCategories: res.data.preferences?.favoriteCategories || [],
            preferredSize: res.data.preferences?.preferredSize || "",
            notifyOrders: res.data.preferences?.notifyOrders ?? true,
            notifyDrops: res.data.preferences?.notifyDrops ?? true,
            defaultAddressId: res.data.preferences?.defaultAddressId || "",
          });
        } else {
          toast.error(res.data.message || "Failed to load preferences");
        }
      } catch (err) {
        console.log("PREFERENCES LOAD ERROR:", err.response?.data || err.message);
        toast.error("Failed to load preferences");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [token, backendUrl]);

  const toggleCategory = (category) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteCategories: prev.favoriteCategories.includes(category)
        ? prev.favoriteCategories.filter((item) => item !== category)
        : [...prev.favoriteCategories, category],
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);

      const payload = {
        favoriteCategories: preferences.favoriteCategories,
        preferredSize: preferences.preferredSize,
        notifyOrders: preferences.notifyOrders,
        notifyDrops: preferences.notifyDrops,
        defaultAddressId: preferences.defaultAddressId,
      };

      const res = await axios.put(
        `${backendUrl}/api/user/preferences`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            token,
          },
        }
      );

      if (res.data.success) {
        toast.success("Preferences saved");

        if (setUser) {
          const updatedUser = {
            ...(user || {}),
            preferences: {
              ...(user?.preferences || {}),
              ...payload,
            },
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } else {
        toast.error(res.data.message || "Failed to save preferences");
      }
    } catch (err) {
      console.log("PREFERENCES SAVE ERROR:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-12 font-['Outfit']">
        <div className="mx-auto max-w-md rounded-[22px] border border-black/10 bg-white/45 p-10 text-center backdrop-blur-md">
          <h1 className="text-xl font-black uppercase text-[#0A0D17]">
            Login Required
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Please log in to manage your preferences.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-8 w-full rounded-xl bg-black py-4 text-[11px] font-black uppercase tracking-[0.22em] text-white"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-black/5 p-3 text-[#0A0D17]">
                <MdTune className="text-xl" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0A0D17]">
                  Preferences
                </h3>
                <p className="mt-2 text-[11px] font-semibold text-gray-500">
                  Personalize your shopping experience
                </p>
              </div>
            </div>

            <button
              onClick={savePreferences}
              disabled={saving || loading}
              className="h-10 rounded-xl bg-black px-5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>

          <div className="space-y-7">
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                Favorite Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => {
                  const active = preferences.favoriteCategories.includes(category);

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-gray-600 hover:border-black"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                Preferred Size
              </p>
              <select
                value={preferences.preferredSize}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    preferredSize: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#0A0D17] outline-none transition focus:border-black"
              >
                <option value="">Select size</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-4">
                <span className="text-sm font-bold text-[#0A0D17]">
                  Order update notifications
                </span>
                <input
                  type="checkbox"
                  checked={preferences.notifyOrders}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      notifyOrders: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-4">
                <span className="text-sm font-bold text-[#0A0D17]">
                  New drop notifications
                </span>
                <input
                  type="checkbox"
                  checked={preferences.notifyDrops}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      notifyDrops: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>
            </div>

            {loading && (
              <p className="text-xs font-semibold text-gray-400">
                Loading preferences...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}