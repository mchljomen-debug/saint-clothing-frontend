// MyAccount.jsx
import React, { useState, useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import {
  MdCameraAlt,
  MdOutlineFingerprint,
  MdArrowBack,
  MdLockOutline,
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

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState(getFirstName(user));
  const [lastName, setLastName] = useState(getLastName(user));
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(String(user?.phone || "").replace(/\D/g, ""));
  const [address, setAddress] = useState({
    ...emptyAddress,
    ...(user?.address || {}),
  });
  const [avatarFile, setAvatarFile] = useState(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(getFirstName(user));
      setLastName(getLastName(user));
      setEmail(user.email || "");
      setPhone(String(user.phone || "").replace(/\D/g, ""));
      setAddress({
        ...emptyAddress,
        ...(user.address || {}),
      });
    }
  }, [user]);

  const handlePhoneChange = (value) => {
    setPhone(value.replace(/\D/g, ""));
  };

  const handleSave = async () => {
    if (!user?._id || !token) {
      toast.error("Authentication required");
      return;
    }

    if (!firstName.trim()) return toast.error("First name is required");
    if (!lastName.trim()) return toast.error("Last name is required");
    if (!email.trim()) return toast.error("Email is required");
    if (!phone.trim()) return toast.error("Contact number is required");
    if (!/^\d+$/.test(phone)) return toast.error("Contact number must contain numbers only");

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
      psgcMunicipalityCode: String(address.psgcMunicipalityCode || "").trim(),
      psgcBarangayCode: String(address.psgcBarangayCode || "").trim(),
    };

    setLoading(true);

    const formData = new FormData();
    formData.append("firstName", firstName.trim());
    formData.append("lastName", lastName.trim());
    formData.append("email", email.trim().toLowerCase());
    formData.append("phone", phone.trim());
    formData.append("address", JSON.stringify(cleanAddress));

    if (avatarFile) formData.append("avatar", avatarFile);

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
        toast.success("Profile updated");
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      console.log("PROFILE SAVE ERROR:", err.response?.data || err.message);
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
        { currentPassword, newPassword, confirmPassword },
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
      toast.error(err.response?.data?.message || "Password update failed");
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setAvatarFile(null);
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
    `${getFirstName(user)} ${getLastName(user)}`.trim() || user?.name || "Guest";

  const avatarSrc = avatarFile
    ? URL.createObjectURL(avatarFile)
    : user?.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `${backendUrl}${user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`}`
    : "/profile_icon.png";

  return (
    <div className="min-h-screen bg-transparent font-['Outfit'] pt-[50px] pb-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <button
          onClick={() => navigate("/profile")}
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-gray-500 transition hover:text-black"
        >
          <MdArrowBack className="text-sm" />
          Back to Profile
        </button>

        <div className="grid lg:grid-cols-[340px_1fr] gap-5 md:gap-6">
          <div className="rounded-[22px] border border-black/10 bg-white/45 p-6 backdrop-blur-md">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="h-36 w-36 overflow-hidden rounded-full border border-black/10 bg-white shadow-sm">
                  <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
                </div>

                {isEditing && (
                  <label className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-black p-3 text-white shadow-lg transition hover:opacity-90">
                    <MdCameraAlt className="text-lg" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>

              <div className="mt-6">
                <p className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-gray-500">
                  <MdOutlineFingerprint />
                  Verified Account
                </p>
                <h1 className="mt-3 text-2xl md:text-3xl font-black italic uppercase tracking-tight text-[#0A0D17] leading-none">
                  {displayName}
                </h1>
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                  Ref: {user?._id?.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[22px] border border-black/10 bg-white/45 p-6 md:p-7 backdrop-blur-md">
              <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0A0D17]">
                    Identity Details
                  </h3>
                  <p className="mt-2 text-[11px] font-semibold text-gray-500">
                    Manage your profile information and saved main address
                  </p>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="h-10 rounded-xl border border-black/10 bg-white px-5 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="space-y-7">
                <div className="grid grid-cols-2 gap-3">
                  <InfoField label="First Name" value={firstName} onChange={setFirstName} isEditing={isEditing} />
                  <InfoField label="Last Name" value={lastName} onChange={setLastName} isEditing={isEditing} />
                </div>

                <InfoField label="Email Address" value={email} onChange={setEmail} isEditing={isEditing} type="email" />

                <InfoField
                  label="Contact Number"
                  value={phone}
                  onChange={handlePhoneChange}
                  isEditing={isEditing}
                  inputMode="numeric"
                  maxLength={11}
                />

                <div className="relative">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                    Main Shipping Address
                  </p>

                  {!isEditing ? (
                    <p className="py-1 text-sm font-bold text-[#0A0D17] leading-6">
                      {formatAddressPreview()}
                    </p>
                  ) : (
                    <ShippingAddressFields
                      formData={address}
                      setFormData={setAddress}
                      backendUrl={backendUrl}
                    />
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-10 flex flex-col md:flex-row gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl bg-black text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    onClick={resetForm}
                    className="h-11 px-6 rounded-xl border border-black/10 bg-white text-[11px] font-black uppercase tracking-[0.18em] text-gray-600 transition hover:border-black hover:text-black"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-black/10 bg-white/45 p-6 md:p-7 backdrop-blur-md">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-xl bg-black/5 p-3 text-[#0A0D17]">
                  <MdLockOutline className="text-xl" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0A0D17]">
                    Change Password
                  </h3>
                  <p className="mt-2 text-[11px] font-semibold text-gray-500">
                    Update your account security
                  </p>
                </div>
              </div>

              <div className="space-y-7">
                <InfoField label="Current Password" value={currentPassword} onChange={setCurrentPassword} isEditing={true} type="password" />
                <InfoField label="New Password" value={newPassword} onChange={setNewPassword} isEditing={true} type="password" />
                <InfoField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} isEditing={true} type="password" />
              </div>

              <div className="mt-10">
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="h-11 w-full rounded-xl bg-black text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {passwordLoading ? "Updating..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoField = ({
  label,
  value,
  onChange,
  isEditing,
  type = "text",
  inputMode,
  maxLength,
}) => (
  <div className="relative">
    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
      {label}
    </p>

    {isEditing ? (
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={`Enter ${label.toLowerCase()}...`}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#0A0D17] outline-none transition placeholder:text-gray-300 focus:border-black"
      />
    ) : (
      <p className={`py-1 text-sm font-bold ${value ? "text-[#0A0D17]" : "italic text-gray-300"}`}>
        {value || "Not provided"}
      </p>
    )}
  </div>
);