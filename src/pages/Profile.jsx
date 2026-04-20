import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import {
  MdLockOutline,
  MdAccountCircle,
  MdTune,
  MdLocalShipping,
  MdHelp,
  MdFlag,
  MdDelete,
  MdOutlineArrowOutward,
  MdPlace,
} from "react-icons/md";

const getFirstName = (user) => {
  if (user?.firstName?.trim()) return user.firstName;
  if (user?.name?.trim()) return user.name.trim().split(" ")[0] || "";
  return "";
};

const getLastName = (user) => {
  if (user?.lastName?.trim()) return user.lastName;
  if (user?.name?.trim()) return user.name.trim().split(" ").slice(1).join(" ");
  return "";
};

export default function Profile() {
  const navigate = useNavigate();
  const { token, setToken, user, setUser, setCartItems, loading, backendUrl } =
    useContext(ShopContext);

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Confirm account deletion? This action is permanent and all data will be removed."
      )
    ) {
      console.log("Account deleted");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCartItems({});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatMainAddress = () => {
    const address = user?.address || {};
    const parts = [
      address.houseUnit,
      address.street,
      address.barangay,
      address.city,
      address.province,
      address.region,
      address.zipcode,
      address.country,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "No main address saved yet";
  };

  const displayName =
    `${getFirstName(user)} ${getLastName(user)}`.trim() ||
    user?.name ||
    "Guest";

  const avatarSrc = user?.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `${backendUrl}${user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`}`
    : "/profile_icon.png";

  const ServiceTile = ({
    icon: Icon,
    label,
    subtext,
    onClick,
    isDestructive = false,
  }) => (
    <button
      onClick={onClick}
      className={`group relative flex min-h-[170px] flex-col justify-between items-start rounded-[22px] border p-6 text-left transition-all duration-300 ${
        isDestructive
          ? "border-black/10 bg-white/45 backdrop-blur-md hover:border-red-500/30"
          : "border-black/10 bg-white/45 backdrop-blur-md hover:border-black/30"
      }`}
    >
      <div className="mb-5 flex w-full items-start justify-between">
        <div
          className={`rounded-xl p-3 transition-colors duration-300 ${
            isDestructive
              ? "bg-red-50 text-red-600"
              : "bg-black/5 text-[#0A0D17]"
          }`}
        >
          <Icon className="text-xl" />
        </div>

        <MdOutlineArrowOutward className="text-lg text-gray-300 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-black" />
      </div>

      <div>
        <p
          className={`mb-2 text-[11px] font-black uppercase tracking-[0.24em] ${
            isDestructive ? "text-red-600" : "text-[#0A0D17]"
          }`}
        >
          {label}
        </p>
        <p className="text-[11px] leading-5 text-gray-500 font-semibold">
          {subtext}
        </p>
      </div>
    </button>
  );

  if (loading) return null;

  if (!token) {
    return (
      <div className="min-h-screen bg-transparent px-6 font-['Outfit']">
        <div className="mx-auto max-w-sm rounded-[22px] border border-black/10 bg-white/45 p-10 text-center backdrop-blur-md">
          <MdLockOutline className="mx-auto text-4xl text-[#0A0D17]" />
          <h1 className="mt-6 text-xl font-black uppercase tracking-tight text-[#0A0D17]">
            Access Restricted
          </h1>
          <p className="mt-3 text-[11px] leading-6 text-gray-500 font-semibold uppercase tracking-[0.16em]">
            Authentication is required to access your account dashboard.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-8 w-full rounded-xl bg-black py-4 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:opacity-90"
          >
            Enter Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-['Outfit'] pt-[8px]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16">
        <div className="rounded-[24px] border border-black/10 bg-white/45 backdrop-blur-md overflow-hidden">
          <div className="border-b border-black/10 px-5 py-8 md:px-8 md:py-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col items-center gap-6 md:flex-row">
                <div className="h-28 w-28 overflow-hidden rounded-full border border-black/10 bg-white shadow-sm">
                  <img
                    src={avatarSrc}
                    alt="profile"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">
                    Saint Account
                  </p>
                  <h2 className="mt-2 text-3xl md:text-4xl font-black italic uppercase tracking-tight text-[#0A0D17] leading-none">
                    {displayName}
                  </h2>
                  <p className="mt-3 text-[11px] font-semibold text-gray-500 tracking-[0.08em]">
                    {user?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="h-11 rounded-xl bg-black px-6 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="px-5 py-8 md:px-8 md:py-10">
            <div className="mb-8 rounded-[20px] border border-black/10 bg-white/70 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-black/5 p-3 text-[#0A0D17]">
                  <MdPlace className="text-xl" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">
                    Main Location
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0A0D17] leading-6">
                    {formatMainAddress()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-black/10 pb-10">
              <div className="mb-6 flex items-center gap-4">
                <h3 className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.34em] text-black">
                  Management
                </h3>
                <div className="h-[1px] w-full bg-black/10"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ServiceTile
                  icon={MdAccountCircle}
                  label="My Account"
                  subtext="Edit first name, last name, main address, avatar, and password"
                  onClick={() => navigate("/myaccount")}
                />
                <ServiceTile
                  icon={MdLocalShipping}
                  label="Orders"
                  subtext="Track and review your order archive"
                  onClick={() => navigate("/orders")}
                />
                <ServiceTile
                  icon={MdTune}
                  label="Preferences"
                  subtext="Manage size, color, category, and notification settings"
                  onClick={() => navigate("/preferences")}
                />
              </div>
            </div>

            <div className="pt-10">
              <div className="mb-6 flex items-center gap-4">
                <h3 className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.34em] text-black">
                  Assistance
                </h3>
                <div className="h-[1px] w-full bg-black/10"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ServiceTile
                  icon={MdHelp}
                  label="Support"
                  subtext="Reach out for help, FAQs, and customer care details"
                  onClick={() => navigate("/support")}
                />
                <ServiceTile
                  icon={MdFlag}
                  label="Policies"
                  subtext="Review privacy policy, shipping policy, returns, and terms"
                  onClick={() => navigate("/policies")}
                />
                <ServiceTile
                  icon={MdLockOutline}
                  label="Security"
                  subtext="Manage account password and security settings"
                  onClick={() => navigate("/myaccount")}
                />
                <ServiceTile
                  icon={MdDelete}
                  label="Delete Account"
                  subtext="Permanent deletion of user data"
                  onClick={handleDeleteAccount}
                  isDestructive
                />
              </div>
            </div>

            <div className="mt-10 border-t border-black/10 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 opacity-60">
              <p className="text-[9px] font-black uppercase tracking-[0.34em] italic text-gray-500">
                Saint Account Center
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.34em] italic text-gray-500">
                Secure Session
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}