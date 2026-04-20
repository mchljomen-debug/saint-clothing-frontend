import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const Navbar = () => {
  const [visible, setVisible] = useState(false);

  const {
    setShowSearch,
    cartItems,
    token,
    setToken,
    setCartItems,
    authReady,
    setUser,
  } = useContext(ShopContext);

  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let count = 0;
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        count += cartItems[productId][size];
      }
    }
    setCartCount(count);
  }, [cartItems]);

  useEffect(() => {
    setVisible(false);
  }, [location.pathname]);

  const logout = () => {
    setUser(null);
    setToken("");
    setCartItems({});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    navigate("/");
    setVisible(false);
  };

  const navItems = [
    { label: "HOME", path: "/" },
    { label: "COLLECTION", path: "/collection" },
    { label: "ABOUT", path: "/about" },
    { label: "CONTACT", path: "/contact" },
  ];

  return (
    <>
      <div
        data-navbar="true"
        className="fixed top-0 left-0 w-full z-[100] border-b border-white/10 backdrop-blur-md"
        style={{
          background:
            "linear-gradient(90deg, #0A0A0A 0%, #1A1A1A 50%, #0F0F0F 100%)",
        }}
      >
        <div className="flex items-center justify-between py-4 sm:py-6 px-4 sm:px-5 md:px-8 lg:px-10 max-w-[1440px] mx-auto">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <img
              src={assets.logo}
              alt="Saint Clothing"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain invert brightness-110 contrast-125 transition-transform duration-300 group-hover:scale-110 shrink-0"
            />
            <h1 className="font-black text-[13px] sm:text-lg md:text-xl text-white tracking-[0.14em] sm:tracking-[0.2em] uppercase group-hover:tracking-[0.24em] sm:group-hover:tracking-[0.3em] transition-all duration-300 truncate">
              Saint Clothing
            </h1>
          </Link>

          <ul className="hidden md:flex gap-8 lg:gap-12 text-white mx-auto">
            {navItems.map((item) => (
              <NavLink key={item.label} to={item.path}>
                {({ isActive }) => (
                  <div className="flex flex-col items-center gap-1 group transition-all duration-300">
                    <p
                      className={`text-[12px] lg:text-[13px] tracking-[0.28em] uppercase font-medium ${
                        isActive ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {item.label}
                    </p>

                    <span
                      className={`block h-[1px] bg-white transition-all duration-300 ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    ></span>
                  </div>
                )}
              </NavLink>
            ))}
          </ul>

          <div className="flex items-center gap-3 sm:gap-5 md:gap-6 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowSearch(true);
                navigate("/collection");
              }}
              className="p-1"
            >
              <img
                src={assets.search_icon}
                className="w-4 sm:w-5 cursor-pointer invert opacity-80 hover:opacity-100 transition"
                alt="search"
              />
            </button>

            <div className="group relative hidden md:block">
              <button
                type="button"
                onClick={() => {
                  if (!authReady) return;
                  if (token) navigate("/profile");
                  else navigate("/login");
                }}
                className="p-1"
              >
                <img
                  className="w-4 sm:w-5 cursor-pointer invert opacity-80 hover:opacity-100 transition"
                  src={assets.profile_icon}
                  alt="profile"
                />
              </button>

              {token && (
                <div className="group-hover:block hidden absolute right-0 pt-4 z-50">
                  <div className="flex flex-col gap-2 w-44 py-3 px-5 bg-black border border-white/10 text-white">
                    <p
                      onClick={() => navigate("/profile")}
                      className={`cursor-pointer hover:text-white/70 ${
                        location.pathname === "/profile"
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    >
                      My Profile
                    </p>

                    <p
                      onClick={() => navigate("/orders")}
                      className={`cursor-pointer hover:text-white/70 ${
                        location.pathname === "/orders"
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    >
                      Orders
                    </p>

                    <hr className="border-white/10" />

                    <p onClick={logout} className="cursor-pointer hover:text-white/70">
                      Logout
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Link to="/cart" id="cart-icon-target" className="relative p-1">
              <img
                src={assets.cart_icon}
                className="w-4 sm:w-5 invert opacity-80 hover:opacity-100 transition"
                alt="cart"
              />

              {cartCount > 0 && (
                <p className="absolute right-[-3px] bottom-[-3px] w-4 h-4 flex items-center justify-center bg-white text-black text-[9px] font-bold rounded-full">
                  {cartCount}
                </p>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setVisible(true)}
              className="md:hidden p-1"
              aria-label="Open menu"
            >
              <img
                src={assets.menu_icon}
                className="w-5 sm:w-6 cursor-pointer invert opacity-80 hover:opacity-100 transition"
                alt="menu"
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[120] md:hidden transition-all duration-300 ${
          visible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          onClick={() => setVisible(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute top-0 right-0 h-full w-[84%] max-w-[340px] bg-[#0A0A0A] border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.35)] transition-transform duration-300 ${
            visible ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={assets.logo}
                alt="Saint Clothing"
                className="w-8 h-8 object-contain invert brightness-110 contrast-125 shrink-0"
              />
              <h2 className="text-white text-sm font-black uppercase tracking-[0.18em] truncate">
                Saint Clothing
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setVisible(false)}
              className="text-white text-2xl leading-none px-2"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col h-[calc(100%-73px)] overflow-y-auto">
            <div className="px-5 py-5 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-[0.26em] text-white/35 font-black">
                Navigation
              </p>

              <div className="mt-4 flex flex-col">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setVisible(false);
                    }}
                    className={`w-full text-left py-3 text-sm font-semibold uppercase tracking-[0.16em] border-b border-white/5 ${
                      location.pathname === item.path
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-5 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-[0.26em] text-white/35 font-black">
                Account
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!authReady) return;
                    navigate(token ? "/profile" : "/login");
                    setVisible(false);
                  }}
                  className="w-full text-left text-sm font-semibold text-white"
                >
                  {token ? "My Profile" : "Login"}
                </button>

                {token && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/orders");
                        setVisible(false);
                      }}
                      className="w-full text-left text-sm font-semibold text-white"
                    >
                      Orders
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full text-left text-sm font-semibold text-white"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.26em] text-white/35 font-black">
                Quick Actions
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(true);
                    navigate("/collection");
                    setVisible(false);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
                >
                  Search
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/cart");
                    setVisible(false);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
                >
                  Cart {cartCount > 0 ? `(${cartCount})` : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;