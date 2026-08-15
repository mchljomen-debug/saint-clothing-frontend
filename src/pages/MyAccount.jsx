import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import {
  MdCameraAlt,
  MdOutlineFingerprint,
  MdArrowBack,
  MdLockOutline,
  MdPersonOutline,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdVerified,
  MdShield,
  MdCheckCircle,
  MdClose,
  MdEdit,
  MdSave,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ShippingAddressFields from "../components/ShippingAddressFields";

const emptyAddress = {
  houseUnit: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  region: "",
  zipcode: "",
  country: "Philippines",
  latitude: "",
  longitude: "",
  psgcRegionCode: "",
  psgcProvinceCode: "",
  psgcMunicipalityCode: "",
  psgcBarangayCode: "",
};

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

export default function MyAccount() {
  const { user, setUser, token, backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();

  const privacyScrollRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState(getFirstName(user));
  const [lastName, setLastName] = useState(getLastName(user));
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(
    String(user?.phone || "").replace(/\D/g, "")
  );

  const [address, setAddress] = useState({
    ...emptyAddress,
    ...(user?.address || {}),
  });

  const [avatarFile, setAvatarFile] = useState(null);

  const [privacyVersion, setPrivacyVersion] = useState("");
  const [privacyTitle, setPrivacyTitle] = useState("Privacy Policy");
  const [privacyContent, setPrivacyContent] = useState([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyScrolledToBottom, setPrivacyScrolledToBottom] =
    useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!user || isEditing) return;

    setFirstName(getFirstName(user));
    setLastName(getLastName(user));
    setEmail(user.email || "");
    setPhone(String(user.phone || "").replace(/\D/g, ""));

    setAddress({
      ...emptyAddress,
      ...(user.address || {}),
    });
  }, [user, isEditing]);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/policy/privacy`);

        if (res.data.success) {
          setPrivacyVersion(res.data.version || "");
          setPrivacyTitle(res.data.title || "Privacy Policy");

          setPrivacyContent(
            Array.isArray(res.data.content) ? res.data.content : []
          );
        }
      } catch (error) {
        console.log("GET PRIVACY POLICY ERROR:", error);
      }
    };

    fetchPrivacyPolicy();
  }, [backendUrl]);

  const openPrivacyModal = () => {
    setShowPrivacyModal(true);
    setPrivacyScrolledToBottom(false);

    setTimeout(() => {
      const el = privacyScrollRef.current;

      if (el) {
        el.scrollTop = 0;

        const hasNoScroll = el.scrollHeight <= el.clientHeight + 12;

        if (hasNoScroll) {
          setPrivacyScrolledToBottom(true);
        }
      }
    }, 100);
  };

  const handlePrivacyScroll = (e) => {
    const target = e.target;

    const reachedBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 12;

    if (reachedBottom) {
      setPrivacyScrolledToBottom(true);
    }
  };

  const acceptPrivacyFromModal = () => {
    setAcceptedPrivacy(true);
    setShowPrivacyModal(false);
  };

  const handlePhoneChange = (value) => {
    setPhone(value.replace(/\D/g, ""));
  };

  const handleSave = async () => {
    if (!user?._id || !token) {
      toast.error("Authentication required");
      return;
    }

    if (!acceptedPrivacy) {
      return toast.error(
        "Please read and accept the Data Privacy Consent first"
      );
    }

    if (!firstName.trim()) {
      return toast.error("First name is required");
    }

    if (!lastName.trim()) {
      return toast.error("Last name is required");
    }

    if (!email.trim()) {
      return toast.error("Email is required");
    }

    if (!phone.trim()) {
      return toast.error("Contact number is required");
    }

    if (!/^\d+$/.test(phone)) {
      return toast.error("Contact number must contain numbers only");
    }

    const cleanAddress = {
      ...emptyAddress,
      ...address,

      houseUnit: String(address.houseUnit || "").trim(),
      street: String(address.street || "").trim(),
      barangay: String(address.barangay || "").trim(),
      city: String(address.city || "").trim(),
      province: String(address.province || "").trim(),
      region: String(address.region || "").trim(),
      zipcode: String(address.zipcode || "").trim(),
      country: String(address.country || "Philippines").trim(),

      psgcRegionCode: String(address.psgcRegionCode || "").trim(),
      psgcProvinceCode: String(address.psgcProvinceCode || "").trim(),
      psgcMunicipalityCode: String(
        address.psgcMunicipalityCode || ""
      ).trim(),
      psgcBarangayCode: String(address.psgcBarangayCode || "").trim(),
    };

    setLoading(true);

    const formData = new FormData();

    formData.append("firstName", firstName.trim());
    formData.append("lastName", lastName.trim());
    formData.append("email", email.trim().toLowerCase());
    formData.append("phone", phone.trim());
    formData.append("address", JSON.stringify(cleanAddress));
    formData.append("privacyAccepted", "true");
    formData.append("privacyVersion", privacyVersion || "");

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const res = await axios.post(
        `${backendUrl}/api/user/update-profile/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            token,
          },
        }
      );

      if (res.data.success) {
        const updatedUser = {
          ...res.data.user,

          firstName: res.data.user?.firstName || firstName.trim(),

          lastName: res.data.user?.lastName || lastName.trim(),

          name:
            res.data.user?.name ||
            `${firstName.trim()} ${lastName.trim()}`.trim(),

          phone: res.data.user?.phone || phone.trim(),

          address: {
            ...emptyAddress,
            ...(res.data.user?.address || cleanAddress),
          },
        };

        setUser(updatedUser);

        localStorage.setItem("user", JSON.stringify(updatedUser));

        setAddress(updatedUser.address);
        setAvatarFile(null);
        setIsEditing(false);
        setAcceptedPrivacy(false);

        toast.success("Profile updated");
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      console.log(
        "PROFILE SAVE ERROR:",
        err.response?.data || err.message
      );

      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill in all password fields");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await axios.post(
        `${backendUrl}/api/user/change-password`,
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            token,
          },
        }
      );

      if (res.data.success) {
        toast.success("Password changed successfully");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.data.message || "Password update failed");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Password update failed"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAcceptedPrivacy(false);
    setShowPrivacyModal(false);

    setFirstName(getFirstName(user));
    setLastName(getLastName(user));
    setEmail(user?.email || "");
    setPhone(String(user?.phone || "").replace(/\D/g, ""));

    setAddress({
      ...emptyAddress,
      ...(user?.address || {}),
    });
  };

  const formatAddressPreview = () => {
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

    return parts.length ? parts.join(", ") : "No main address saved";
  };

  const displayName =
    `${getFirstName(user)} ${getLastName(user)}`.trim() ||
    user?.name ||
    "Guest";

  const avatarSrc = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    if (user?.avatar) {
      return user.avatar.startsWith("http")
        ? user.avatar
        : `${backendUrl}${
            user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`
          }`;
    }

    return "/profile_icon.png";
  }, [avatarFile, user?.avatar, backendUrl]);

  return (
    <div className="min-h-screen bg-transparent font-['Outfit'] pb-20 pt-8 md:pt-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        {/* BACK */}
        <button
          onClick={() => navigate("/profile")}
          className="group mb-7 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-gray-500 transition hover:text-black"
        >
          <MdArrowBack className="text-sm transition-transform group-hover:-translate-x-1" />
          Back to Profile
        </button>

        {/* PAGE HEADER */}
        <div className="mb-7">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-gray-400">
            Saint Clothing
          </p>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tight text-[#0A0D17] md:text-4xl">
                My Account
              </h1>

              <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-gray-500">
                Manage your personal information, delivery address, profile
                photo, and account security.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
              <MdVerified className="text-base text-black" />
              Secure Account
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* PROFILE SIDEBAR */}
          <aside className="h-fit rounded-[24px] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur-md lg:sticky lg:top-6">
            <div className="flex flex-col items-center text-center">
              {/* AVATAR */}
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full border border-black/10 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>

                {isEditing && (
                  <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:scale-105 hover:opacity-90">
                    <MdCameraAlt className="text-lg" />

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                )}
              </div>

              {/* ACCOUNT STATUS */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-black" />

                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Verified Account
                </span>
              </div>

              {/* NAME */}
              <h2 className="mt-5 break-words text-xl font-black uppercase tracking-tight text-[#0A0D17]">
                {displayName}
              </h2>

              {/* EMAIL */}
              <p className="mt-2 max-w-full break-all text-[11px] font-semibold text-gray-500">
                {email || user?.email || "No email"}
              </p>

              {/* REFERENCE */}
              <div className="mt-5 w-full border-t border-black/10 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                    Account ID
                  </span>

                  <span className="font-mono text-[9px] font-bold text-gray-500">
                    {user?._id?.slice(-8).toUpperCase() || "N/A"}
                  </span>
                </div>
              </div>

              {/* EDIT BUTTON */}
              {!isEditing && (
                <button
                  onClick={() => {
                    setAcceptedPrivacy(false);
                    setIsEditing(true);
                  }}
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90"
                >
                  <MdEdit className="text-base" />
                  Edit Profile
                </button>
              )}

              {isEditing && (
                <div className="mt-5 flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3">
                  <MdCameraAlt className="text-lg text-gray-500" />

                  <p className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">
                    Click the camera to change your photo
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* CONTENT */}
          <main className="min-w-0 space-y-5">
            {/* PERSONAL INFORMATION */}
            <section className="rounded-[24px] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur-md md:p-7">
              <SectionHeader
                icon={<MdPersonOutline />}
                eyebrow="Account"
                title="Personal Information"
                description="Your basic information used for account and order communication."
              />

              <div className="mt-8 space-y-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoField
                    icon={<MdPersonOutline />}
                    label="First Name"
                    value={firstName}
                    onChange={setFirstName}
                    isEditing={isEditing}
                  />

                  <InfoField
                    icon={<MdPersonOutline />}
                    label="Last Name"
                    value={lastName}
                    onChange={setLastName}
                    isEditing={isEditing}
                  />
                </div>

                <InfoField
                  icon={<MdEmail />}
                  label="Email Address"
                  value={email}
                  onChange={setEmail}
                  isEditing={isEditing}
                  type="email"
                />

                <InfoField
                  icon={<MdPhone />}
                  label="Contact Number"
                  value={phone}
                  onChange={handlePhoneChange}
                  isEditing={isEditing}
                  inputMode="numeric"
                  maxLength={11}
                />
              </div>
            </section>

            {/* SHIPPING ADDRESS */}
            <section className="rounded-[24px] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur-md md:p-7">
              <SectionHeader
                icon={<MdLocationOn />}
                eyebrow="Delivery"
                title="Main Shipping Address"
                description="This address can be used as your primary delivery location during checkout."
              />

              <div className="mt-7 rounded-2xl border border-black/10 bg-white p-5">
                {!isEditing ? (
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black">
                      <MdLocationOn className="text-xl" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Saved Address
                      </p>

                      <p className="mt-2 text-sm font-bold leading-6 text-[#0A0D17]">
                        {formatAddressPreview()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ShippingAddressFields
                    formData={address}
                    setFormData={setAddress}
                    backendUrl={backendUrl}
                  />
                )}
              </div>
            </section>

            {/* PRIVACY */}
            {isEditing && (
              <section className="rounded-[24px] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur-md md:p-7">
                <SectionHeader
                  icon={<MdShield />}
                  eyebrow="Privacy"
                  title="Data Privacy Consent"
                  description="Review the current privacy policy before saving changes to your account."
                />

                <div className="mt-7 rounded-2xl border border-black/10 bg-white p-5">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      readOnly
                      className="mt-1 h-4 w-4 accent-black"
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-6 text-gray-600">
                        I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={openPrivacyModal}
                          className="font-black text-[#0A0D17] underline underline-offset-2 transition hover:opacity-60"
                        >
                          Data Privacy Consent
                        </button>
                        .
                      </p>

                      {privacyVersion && (
                        <p className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
                          Current Version: {privacyVersion}
                        </p>
                      )}
                    </div>
                  </div>

                  {!acceptedPrivacy && (
                    <div className="mt-4 rounded-xl bg-[#FAFAF8] px-4 py-3">
                      <p className="text-[10px] font-semibold leading-5 text-gray-500">
                        Open the privacy consent, read the full document, then
                        accept it before saving your profile changes.
                      </p>
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={resetForm}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-6 text-[10px] font-black uppercase tracking-[0.18em] text-gray-600 transition hover:border-black hover:text-black"
                  >
                    <MdClose className="text-base" />
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={loading || !acceptedPrivacy}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-7 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MdSave className="text-base" />

                    {loading
                      ? "Saving..."
                      : !acceptedPrivacy
                      ? "Accept Privacy First"
                      : "Save Changes"}
                  </button>
                </div>
              </section>
            )}

            {/* SECURITY */}
            <section className="rounded-[24px] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur-md md:p-7">
              <SectionHeader
                icon={<MdLockOutline />}
                eyebrow="Security"
                title="Change Password"
                description="Keep your Saint Clothing account protected with a strong password."
              />

              <div className="mt-8 space-y-6">
                <InfoField
                  icon={<MdLockOutline />}
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  isEditing={true}
                  type="password"
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <InfoField
                    icon={<MdLockOutline />}
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    isEditing={true}
                    type="password"
                  />

                  <InfoField
                    icon={<MdLockOutline />}
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    isEditing={true}
                    type="password"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5">
                    <MdShield className="text-lg text-black" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0A0D17]">
                      Account Security
                    </p>

                    <p className="mt-1 text-[10px] font-semibold leading-5 text-gray-500">
                      Your password should be kept private and never shared.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="h-11 shrink-0 rounded-xl bg-black px-6 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordLoading
                    ? "Updating..."
                    : "Change Password"}
                </button>
              </div>
            </section>

            {/* FOOTER STATUS */}
            <div className="flex flex-col items-center justify-between gap-2 border-t border-black/10 px-1 pt-5 sm:flex-row">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                Saint Clothing Account Center
              </p>

              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                <MdCheckCircle className="text-sm" />
                Secure Session
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* PRIVACY MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-[3px]">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-5 border-b border-black/10 px-6 py-5 md:px-7">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Saint Clothing
                </p>

                <h3 className="mt-2 text-2xl font-black italic uppercase tracking-tight text-[#0A0D17]">
                  {privacyTitle}
                </h3>

                {privacyVersion && (
                  <p className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
                    Version {privacyVersion}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-gray-500 transition hover:border-black hover:text-black"
              >
                <MdClose className="text-lg" />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div
              ref={privacyScrollRef}
              onScroll={handlePrivacyScroll}
              className="min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-7"
            >
              <div className="space-y-4">
                {privacyContent.length > 0 ? (
                  privacyContent.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-black/10 bg-[#FAFAF8] p-5"
                    >
                      <div className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black text-[9px] font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#0A0D17]">
                            {item.title || "Untitled"}
                          </p>

                          <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
                            {item.text || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-black/10 bg-[#FAFAF8] p-5">
                    <p className="text-sm font-semibold leading-6 text-gray-600">
                      Privacy Policy is currently unavailable. Please try
                      again later.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="border-t border-black/10 bg-white px-6 py-5 md:px-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      privacyScrolledToBottom
                        ? "bg-black"
                        : "bg-gray-300"
                    }`}
                  />

                  <p className="text-[10px] font-semibold leading-5 text-gray-500">
                    {privacyScrolledToBottom
                      ? "You can now accept this Privacy Policy."
                      : "Scroll to the bottom to enable acceptance."}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(false)}
                    className="rounded-xl border border-black/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#0A0D17] transition hover:border-black"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={acceptPrivacyFromModal}
                    disabled={
                      !privacyScrolledToBottom ||
                      privacyContent.length === 0
                    }
                    className="rounded-xl bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Accept Privacy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION HEADER                                                             */
/* -------------------------------------------------------------------------- */

const SectionHeader = ({
  icon,
  eyebrow,
  title,
  description,
}) => (
  <div className="flex items-start gap-4">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/5 text-[#0A0D17]">
      <span className="text-xl">{icon}</span>
    </div>

    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-400">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-[#0A0D17]">
        {title}
      </h3>

      <p className="mt-1 max-w-2xl text-[11px] font-semibold leading-5 text-gray-500">
        {description}
      </p>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* INFO FIELD                                                                 */
/* -------------------------------------------------------------------------- */

const InfoField = ({
  icon,
  label,
  value,
  onChange,
  isEditing,
  type = "text",
  inputMode,
  maxLength,
}) => (
  <div className="relative">
    <div className="mb-3 flex items-center gap-2">
      {icon && <span className="text-base text-gray-400">{icon}</span>}

      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-500">
        {label}
      </p>
    </div>

    {isEditing ? (
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={`Enter ${label.toLowerCase()}...`}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-[#0A0D17] outline-none transition placeholder:text-gray-300 hover:border-black/20 focus:border-black focus:ring-2 focus:ring-black/5"
      />
    ) : (
      <div className="min-h-12 rounded-xl border border-transparent bg-black/[0.025] px-4 py-3">
        <p
          className={`text-sm font-bold ${
            value ? "text-[#0A0D17]" : "italic text-gray-300"
          }`}
        >
          {value || "Not provided"}
        </p>
      </div>
    )}
  </div>
);