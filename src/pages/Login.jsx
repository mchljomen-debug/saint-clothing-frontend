import React, { useState, useContext, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const OTP_SECONDS = 60;
const FORGOT_OTP_SECONDS = 300;

const Login = () => {
  const {
    backendUrl,
    token,
    setToken,
    setUser,
    navigate,
    fetchUserCart,
    setCartTotal,
  } = useContext(ShopContext);

  const [currentState, setCurrentState] = useState("Login");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsVersion, setTermsVersion] = useState("");
  const [termsTitle, setTermsTitle] = useState("Terms & Conditions");
  const [termsContent, setTermsContent] = useState([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);

  const termsScrollRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [emailExists, setEmailExists] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotTimer, setForgotTimer] = useState(0);
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/policy/terms`);

        if (res.data.success) {
          setTermsVersion(res.data.version || "");
          setTermsTitle(res.data.title || "Terms & Conditions");
          setTermsContent(Array.isArray(res.data.content) ? res.data.content : []);
        }
      } catch (error) {
        console.log("GET TERMS ERROR:", error);
      }
    };

    fetchTerms();
  }, [backendUrl]);

  useEffect(() => {
    let timer;

    if (otpTimer > 0) {
      timer = setTimeout(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [otpTimer]);

  useEffect(() => {
    let timer;

    if (forgotTimer > 0) {
      timer = setTimeout(() => {
        setForgotTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [forgotTimer]);

  useEffect(() => {
    if (token) navigate("/");
  }, [token, navigate]);

  const checkPasswordStrength = (password) => {
    if (!password) return "";

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return "weak";
    if (strength <= 3) return "medium";
    if (strength === 4) return "strong";
    return "";
  };

  const resetAllStates = () => {
    setErrors({});
    setConfirmTouched(false);
    setOtp("");
    setOtpSent(false);
    setEmailVerified(false);
    setOtpVerified(false);
    setOtpTimer(0);
    setForgotMode(false);
    setForgotOtpSent(false);
    setForgotOtp("");
    setForgotTimer(0);
    setPasswordStrength("");
    setAcceptedTerms(false);
    setShowTermsModal(false);
    setTermsScrolledToBottom(false);
    setEmailExists(false);

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    let newErrors = { ...errors };

    if (name === "email") {
      setEmailVerified(false);
      setOtpVerified(false);
      setOtpSent(false);
      setOtp("");
      setOtpTimer(0);

      if (!/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = "Invalid email format";
        setEmailExists(false);
      } else {
        delete newErrors.email;

        try {
          const res = await axios.post(`${backendUrl}/api/user/check-email`, {
            email: value,
          });

          setEmailExists(res.data.exists);
        } catch (error) {
          console.log("Email check error:", error);
        }
      }
    }

    if (name === "password" && currentState === "Sign Up") {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);

      if (strength !== "strong") {
        newErrors.password = "Security level too low";
      } else {
        delete newErrors.password;
      }

      if (updatedFormData.confirmPassword.length > 0) {
        setConfirmTouched(true);

        if (updatedFormData.confirmPassword !== value) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
      }
    }

    if (name === "confirmPassword") {
      setConfirmTouched(true);

      if (value.length > 0 && value !== updatedFormData.password) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        delete newErrors.confirmPassword;
      }
    }

    if (name === "firstName" && currentState === "Sign Up") {
      if (value.trim().length < 2) {
        newErrors.firstName = "Min 2 characters required";
      } else {
        delete newErrors.firstName;
      }
    }

    if (name === "lastName" && currentState === "Sign Up") {
      if (value.trim().length < 2) {
        newErrors.lastName = "Min 2 characters required";
      } else {
        delete newErrors.lastName;
      }
    }

    setErrors(newErrors);
  };

  const sendOtp = async () => {
    if (!acceptedTerms) {
      return toast.error("Please read and accept the Terms & Conditions first");
    }

    if (otpTimer > 0) {
      return toast.error(`Please wait ${otpTimer}s before resending OTP`);
    }

    if (!formData.email || errors.email) {
      return toast.error("Please enter a valid email first");
    }

    if (!formData.firstName.trim()) {
      return toast.error("First name is required");
    }

    if (!formData.lastName.trim()) {
      return toast.error("Last name is required");
    }

    if (emailExists) {
      return toast.error("Account already exists");
    }

    try {
      const response = await axios.post(`${backendUrl}/api/user/send-otp`, {
        email: formData.email,
      });

      if (response.data.success) {
        toast.success("Verification code sent");
        setOtpSent(true);
        setOtpTimer(OTP_SECONDS);
        setEmailVerified(false);
        setOtpVerified(false);
        setOtp("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send verification code");
    }
  };

  const verifyOtp = async () => {
    if (otpVerified) return;

    if (!otp) {
      return toast.error("Enter the OTP first");
    }

    if (otp.length < 6) {
      return toast.error("OTP must be 6 digits");
    }

    if (otpTimer <= 0) {
      return toast.error("OTP expired. Please resend OTP.");
    }

    try {
      const response = await axios.post(`${backendUrl}/api/user/verify-otp`, {
        email: formData.email,
        otp,
      });

      if (response.data.success) {
        toast.success("Email verified");
        setEmailVerified(true);
        setOtpVerified(true);
        setOtp("");
        setOtpTimer(0);
      } else {
        toast.error(response.data.message || "Verification failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    }
  };

  const sendForgotPasswordOtp = async () => {
    if (!forgotPasswordData.email) {
      return toast.error("Enter your email first");
    }

    if (forgotTimer > 0) {
      return toast.error(`Please wait ${forgotTimer}s before resending code`);
    }

    try {
      const response = await axios.post(`${backendUrl}/api/user/forgot-password`, {
        email: forgotPasswordData.email,
      });

      if (response.data.success) {
        toast.success("Reset code sent");
        setForgotOtpSent(true);
        setForgotTimer(FORGOT_OTP_SECONDS);
        setForgotOtp("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset code");
    }
  };

  const submitForgotPassword = async (e) => {
    e.preventDefault();

    if (forgotTimer <= 0) {
      return toast.error("Reset code expired. Please resend code.");
    }

    if (!forgotOtp || forgotOtp.length < 6) {
      return toast.error("Enter the 6-digit reset code");
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const response = await axios.post(`${backendUrl}/api/user/reset-password`, {
        email: forgotPasswordData.email,
        otp: forgotOtp,
        newPassword: forgotPasswordData.newPassword,
        confirmPassword: forgotPasswordData.confirmPassword,
      });

      if (response.data.success) {
        toast.success("Password reset successfully");
        setForgotMode(false);
        setForgotOtpSent(false);
        setForgotOtp("");
        setForgotTimer(0);
        setForgotPasswordData({
          email: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Password reset failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (currentState === "Sign Up") {
        if (!acceptedTerms) {
          return toast.error("You must agree to the Terms & Conditions");
        }

        if (!emailVerified) {
          return toast.error("Please verify your email first");
        }

        if (errors.confirmPassword || formData.password !== formData.confirmPassword) {
          setConfirmTouched(true);
          return toast.error("Passwords do not match");
        }

        if (passwordStrength !== "strong") {
          return toast.error("Password must be strong");
        }

        const response = await axios.post(`${backendUrl}/api/user/register`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          acceptedTerms: true,
        });

        if (response.data.success) {
          setToken(response.data.token);
          setUser(response.data.user);
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          toast.success("Welcome to Saint Clothing");
          navigate("/");
        } else {
          toast.error(response.data.message);
        }
      } else {
        const response = await axios.post(`${backendUrl}/api/user/login`, {
          email: formData.email,
          password: formData.password,
        });

        if (response.data.success) {
          setToken(response.data.token);
          setUser(response.data.user);
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          toast.success("Login successful");

          if (fetchUserCart) {
            const cart = await fetchUserCart(response.data.token);

            if (cart && setCartTotal) {
              setCartTotal(cart.reduce((acc, item) => acc + item.quantity, 0));
            }
          }

          navigate("/");
        } else {
          toast.error(response.data.message || "Login failed");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred. Please try again.");
    }
  };

  const getBorderColor = (field) => {
    if (field === "confirmPassword") {
      if (formData.confirmPassword === "") return "border-black/10";
      if (confirmTouched && errors.confirmPassword) return "border-rose-500";
      return "border-black";
    }

    if (formData[field] === "") return "border-black/10";
    if (errors[field]) return "border-rose-500";

    if (field === "password" && currentState === "Sign Up") {
      if (passwordStrength === "weak") return "border-rose-500";
      if (passwordStrength === "medium") return "border-amber-500";
      if (passwordStrength === "strong") return "border-emerald-500";
    }

    return "border-black";
  };

  const getReqColor = (met) => (met ? "text-emerald-600" : "text-gray-400");

  const openTermsModal = () => {
    setShowTermsModal(true);
    setTermsScrolledToBottom(false);

    setTimeout(() => {
      if (termsScrollRef.current) {
        termsScrollRef.current.scrollTop = 0;
      }
    }, 0);
  };

  const handleTermsScroll = (e) => {
    const target = e.target;
    const reachedBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 12;

    if (reachedBottom) {
      setTermsScrolledToBottom(true);
    }
  };

  const acceptTermsFromModal = () => {
    setAcceptedTerms(true);
    setErrors((prev) => ({ ...prev, terms: "" }));
    setShowTermsModal(false);
  };

  return (
    <>
      <div className="min-h-screen bg-transparent overflow-hidden font-['Outfit'] pt-[88px] pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid md:grid-cols-[1fr_460px] gap-10 items-start">
            <div className="pt-6 md:pt-12">
              <p className="text-[10px] font-black tracking-[0.32em] uppercase text-gray-500">
                Saint Clothing
              </p>

              <h1 className="mt-4 text-5xl md:text-7xl font-black italic uppercase tracking-tight text-[#0A0D17] leading-[0.9]">
                Modern
                <br />
                Identity.
              </h1>

              <p className="mt-6 max-w-md text-[15px] leading-7 text-gray-500 font-medium">
                Access your Saint account, manage your profile, and continue your
                experience with a cleaner, more refined wardrobe system.
              </p>
            </div>

            <div className="bg-white/45 backdrop-blur-md border border-black/10 rounded-[26px] p-6 md:p-8 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
              {!forgotMode ? (
                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-[#0A0D17]">
                      {currentState === "Login" ? "Login" : "Create Account"}
                    </h2>
                    <p className="mt-2 text-[10px] font-black text-gray-500 tracking-[0.22em] uppercase">
                      {currentState === "Login" ? "Member Access" : "Register New Account"}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {currentState === "Sign Up" && (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="First Name"
                          required
                          className={`w-full rounded-xl border bg-white/70 px-4 py-3.5 outline-none font-semibold text-[#0A0D17] placeholder:text-gray-400 transition ${getBorderColor(
                            "firstName"
                          )}`}
                        />

                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Last Name"
                          required
                          className={`w-full rounded-xl border bg-white/70 px-4 py-3.5 outline-none font-semibold text-[#0A0D17] placeholder:text-gray-400 transition ${getBorderColor(
                            "lastName"
                          )}`}
                        />
                      </div>
                    )}

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      required
                      className={`w-full rounded-xl border bg-white/70 px-4 py-3.5 outline-none font-semibold text-[#0A0D17] placeholder:text-gray-400 transition ${getBorderColor(
                        "email"
                      )}`}
                    />

                    <div className="space-y-3">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        required
                        className={`w-full rounded-xl border bg-white/70 px-4 py-3.5 outline-none font-semibold text-[#0A0D17] placeholder:text-gray-400 transition ${getBorderColor(
                          "password"
                        )}`}
                      />

                      {currentState === "Sign Up" && (
                        <div className="grid grid-cols-2 gap-2 px-1">
                          <p
                            className={`text-[10px] font-black uppercase ${getReqColor(
                              formData.password.length >= 8
                            )}`}
                          >
                            8+ Characters
                          </p>
                          <p
                            className={`text-[10px] font-black uppercase ${getReqColor(
                              /[A-Z]/.test(formData.password)
                            )}`}
                          >
                            Uppercase
                          </p>
                          <p
                            className={`text-[10px] font-black uppercase ${getReqColor(
                              /[0-9]/.test(formData.password)
                            )}`}
                          >
                            Number
                          </p>
                          <p
                            className={`text-[10px] font-black uppercase ${getReqColor(
                              /[^A-Za-z0-9]/.test(formData.password)
                            )}`}
                          >
                            Symbol
                          </p>
                        </div>
                      )}
                    </div>

                    {currentState === "Login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(true);
                          setForgotPasswordData((prev) => ({
                            ...prev,
                            email: formData.email || "",
                          }));
                        }}
                        className="self-end text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 transition hover:text-black"
                      >
                        Forgot Password?
                      </button>
                    )}

                    {currentState === "Sign Up" && (
                      <>
                        <div className="space-y-2">
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={() => setConfirmTouched(true)}
                            placeholder="Confirm Password"
                            required
                            className={`w-full rounded-xl border bg-white/70 px-4 py-3.5 outline-none font-semibold text-[#0A0D17] placeholder:text-gray-400 transition ${getBorderColor(
                              "confirmPassword"
                            )}`}
                          />

                          {confirmTouched &&
                            formData.confirmPassword.length > 0 &&
                            errors.confirmPassword && (
                              <p className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-rose-500">
                                {errors.confirmPassword}
                              </p>
                            )}
                        </div>

                        <div className="mt-1 rounded-xl border border-black/10 bg-white/60 px-4 py-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={acceptedTerms}
                              readOnly
                              className="mt-1 h-4 w-4 accent-black"
                            />

                            <span className="text-[11px] font-semibold leading-5 text-gray-600">
                              I agree to the{" "}
                              <button
                                type="button"
                                onClick={openTermsModal}
                                className="font-black text-[#0A0D17] underline"
                              >
                                Terms & Conditions
                              </button>
                              {termsVersion ? (
                                <span className="ml-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                                  Version {termsVersion}
                                </span>
                              ) : null}
                            </span>
                          </div>

                          {!acceptedTerms && (
                            <p className="mt-2 pl-7 text-[10px] font-semibold text-gray-500">
                              Open the terms, scroll to the bottom, then accept before sending OTP.
                            </p>
                          )}
                        </div>

                        <div className="mt-1">
                          {otpSent && !emailVerified ? (
                            <div className="space-y-3 rounded-2xl border border-black/10 bg-white/60 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                                  OTP Verification
                                </p>

                                <span
                                  className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                                    otpTimer > 0
                                      ? "bg-black text-white"
                                      : "bg-rose-50 text-rose-600"
                                  }`}
                                >
                                  {otpTimer > 0 ? `${otpTimer}s left` : "Expired"}
                                </span>
                              </div>

                              <input
                                type="text"
                                value={otp}
                                onChange={(e) =>
                                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                placeholder="Enter OTP"
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-center font-black tracking-[0.35em] text-[#0A0D17] outline-none transition focus:border-black"
                              />

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={verifyOtp}
                                  disabled={!otp || otp.length < 6 || otpTimer <= 0 || otpVerified}
                                  className="rounded-xl bg-black py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Verify
                                </button>

                                <button
                                  type="button"
                                  onClick={sendOtp}
                                  disabled={otpTimer > 0}
                                  className="rounded-xl border border-black bg-white py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Resend OTP
                                </button>
                              </div>

                              <div className="rounded-xl bg-gray-100 px-4 py-3 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                                  {otpTimer > 0
                                    ? `OTP will expire in ${otpTimer} seconds`
                                    : "OTP expired. Click resend OTP to get a new code."}
                                </p>
                              </div>
                            </div>
                          ) : !otpSent ? (
                            <button
                              type="button"
                              onClick={sendOtp}
                              disabled={
                                !!errors.email ||
                                !formData.email ||
                                emailExists ||
                                !formData.firstName.trim() ||
                                !formData.lastName.trim() ||
                                !acceptedTerms ||
                                otpTimer > 0
                              }
                              className="w-full rounded-xl border border-black/10 bg-white/70 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {emailExists
                                ? "Account Already Exists"
                                : !acceptedTerms
                                ? "Accept Terms First"
                                : "Send OTP"}
                            </button>
                          ) : (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-center">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                Email Verified
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      className="mt-3 h-11 w-full rounded-xl bg-black text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90"
                    >
                      {currentState === "Login" ? "Login" : "Create Account"}
                    </button>
                  </form>

                  <div className="mt-8 border-t border-black/10 pt-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                      {currentState === "Login" ? "No account?" : "Already have an account?"}
                      <span
                        className="ml-2 cursor-pointer text-black transition hover:text-gray-600"
                        onClick={() => {
                          setCurrentState(currentState === "Login" ? "Sign Up" : "Login");
                          resetAllStates();
                        }}
                      >
                        {currentState === "Login" ? "Sign Up" : "Log In"}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-[#0A0D17]">
                      Forgot Password
                    </h2>
                    <p className="mt-2 text-[10px] font-black text-gray-500 tracking-[0.22em] uppercase">
                      Reset Account Access
                    </p>
                  </div>

                  <form onSubmit={submitForgotPassword} className="flex flex-col gap-4">
                    <input
                      type="email"
                      value={forgotPasswordData.email}
                      onChange={(e) =>
                        setForgotPasswordData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Email Address"
                      required
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3.5 outline-none font-semibold text-[#0A0D17] placeholder:text-gray-400 transition focus:border-black"
                    />

                    {!forgotOtpSent ? (
                      <button
                        type="button"
                        onClick={sendForgotPasswordOtp}
                        className="w-full rounded-xl border border-black/10 bg-white/70 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:border-black"
                      >
                        Send Reset Code
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={forgotOtp}
                          onChange={(e) =>
                            setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="Reset Code"
                          required
                          className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3.5 outline-none text-center font-black tracking-[0.35em] text-[#0A0D17] placeholder:text-gray-400 transition focus:border-black"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled
                            className="rounded-xl border border-black/10 bg-gray-100 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500"
                          >
                            {forgotTimer > 0 ? `${forgotTimer}s Left` : "Expired"}
                          </button>

                          <button
                            type="button"
                            onClick={sendForgotPasswordOtp}
                            disabled={forgotTimer > 0}
                            className="rounded-xl border border-black bg-white py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Resend Code
                          </button>
                        </div>

                        <input
                          type="password"
                          value={forgotPasswordData.newPassword}
                          onChange={(e) =>
                            setForgotPasswordData((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          placeholder="New Password"
                          required
                          className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3.5 outline-none font-semibold text-[#0A0D17] placeholder:text-gray-400 transition focus:border-black"
                        />

                        <input
                          type="password"
                          value={forgotPasswordData.confirmPassword}
                          onChange={(e) =>
                            setForgotPasswordData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="Confirm New Password"
                          required
                          className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3.5 outline-none font-semibold text-[#0A0D17] placeholder:text-gray-400 transition focus:border-black"
                        />

                        <button
                          type="submit"
                          className="h-11 w-full rounded-xl bg-black text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90"
                        >
                          Reset Password
                        </button>
                      </>
                    )}
                  </form>

                  <div className="mt-8 border-t border-black/10 pt-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(false);
                        setForgotOtpSent(false);
                        setForgotOtp("");
                        setForgotTimer(0);
                      }}
                      className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 transition hover:text-black"
                    >
                      Back to Login
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="border-b border-black/10 px-6 py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                Saint Clothing
              </p>

              <h3 className="mt-2 text-2xl font-black italic uppercase tracking-tight text-[#0A0D17]">
                {termsTitle}
              </h3>

              {termsVersion ? (
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                  Version {termsVersion}
                </p>
              ) : null}
            </div>

            <div
              ref={termsScrollRef}
              onScroll={handleTermsScroll}
              className="max-h-[420px] overflow-y-auto px-6 py-5"
            >
              <div className="space-y-4">
                {termsContent.length > 0 ? (
                  termsContent.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-black/10 bg-[#FAFAF8] p-4"
                    >
                      <p className="text-sm font-black text-[#0A0D17]">
                        {index + 1}. {item.title || "Untitled"}
                      </p>

                      <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
                        {item.text || ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-black/10 bg-[#FAFAF8] p-4">
                    <p className="text-sm font-semibold leading-6 text-gray-600">
                      Terms and Conditions are currently unavailable. Please try again later.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-black/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <p className="text-[11px] font-semibold text-gray-500">
                {termsScrolledToBottom
                  ? "You can now accept these terms."
                  : "Scroll to the bottom to enable acceptance."}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="rounded-xl border border-black/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#0A0D17]"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={acceptTermsFromModal}
                  disabled={!termsScrolledToBottom || termsContent.length === 0}
                  className="rounded-xl bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Accept Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;