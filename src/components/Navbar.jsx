import React, { useContext, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const {
    setShowSearch,
    cartItems,
    token,
    setToken,
    setCartItems,
    setUser,
  } = useContext(ShopContext);

  const navigate = useNavigate();
  const location = useLocation();

  /* =========================================================
     CART COUNT
  ========================================================= */
  useEffect(() => {
    let count = 0;

    for (const productId in cartItems || {}) {
      for (const size in cartItems[productId] || {}) {
        count += cartItems[productId][size] || 0;
      }
    }

    setCartCount(count);
  }, [cartItems]);

  /* =========================================================
     CLOSE MOBILE MENU WHEN ROUTE CHANGES
  ========================================================= */
  useEffect(() => {
    setVisible(false);
  }, [location.pathname]);

  /* =========================================================
     PROFILE NAVIGATION
     
     Logged in     -> /profile
     Not logged in -> /login
  ========================================================= */
  const goToProfile = () => {
    if (token) {
      navigate("/profile");
    } else {
      navigate("/login");
    }

    setVisible(false);
  };

  /* =========================================================
     ORDERS NAVIGATION
     
     Logged in     -> /orders
     Not logged in -> /login
  ========================================================= */
  const goToOrders = () => {
    if (token) {
      navigate("/orders");
    } else {
      navigate("/login");
    }

    setVisible(false);
  };

  /* =========================================================
     CART NAVIGATION
     
     Logged in     -> /cart
     Not logged in -> /login
  ========================================================= */
  const goToCart = () => {
    if (token) {
      navigate("/cart");
    } else {
      navigate("/login");
    }

    setVisible(false);
  };

  /* =========================================================
     LOGOUT
  ========================================================= */
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

  /* =========================================================
     NAVIGATION ITEMS
  ========================================================= */
  const navItems = [
    {
      label: "HOME",
      path: "/",
    },
    {
      label: "COLLECTION",
      path: "/collection",
    },

    ...(token
      ? [
          {
            label: "BUILD FIT",
            path: "/style-builder",
          },
        ]
      : []),

    {
      label: "ABOUT",
      path: "/about",
    },
    {
      label: "CONTACT",
      path: "/contact",
    },
  ];

  return (
    <>
      {/* =====================================================
          MAIN NAVBAR
      ===================================================== */}
      <div
        data-navbar="true"
        className="fixed left-0 top-0 z-[100] w-full border-b border-white/5 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(90deg,#0A0A0A 0%,#141414 50%,#0A0A0A 100%)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 lg:px-10">

          {/* =================================================
              LOGO
          ================================================= */}
          <Link
            to="/"
            className="group flex items-center gap-1"
          >
            <img
              src={assets.logo}
              alt="Saint Clothing"
              className="h-[90px] w-[90px] object-contain invert brightness-110 contrast-125 transition-transform duration-300 group-hover:scale-110"
            />

            <h1 className="truncate text-[20px] font-black uppercase tracking-[0.05em] text-white transition-all duration-300 group-hover:tracking-[0.12em]">
              Saint Clothing
            </h1>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}
          <ul className="mx-auto hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
              >
                {({ isActive }) => (
                  <div className="group relative py-1">
                    <p
                      className={`text-[12px] font-medium uppercase tracking-[0.18em] transition ${
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </p>

                    <span
                      className={`absolute -bottom-1 left-0 h-[1px] bg-white transition-all duration-300 ${
                        isActive
                          ? "w-full"
                          : "w-0 group-hover:w-full"
                      }`}
                    />
                  </div>
                )}
              </NavLink>
            ))}
          </ul>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}
          <div className="flex items-center gap-4">

            {/* =================================================
                SEARCH
            ================================================= */}
            <button
              type="button"
              onClick={() => {
                setShowSearch(true);
                navigate("/collection");
                setVisible(false);
              }}
              className="cursor-pointer p-1"
              aria-label="Search"
            >
              <img
                src={assets.search_icon}
                alt="search"
                className="w-5 invert opacity-80 transition hover:opacity-100"
              />
            </button>

            {/* =================================================
                PROFILE
            ================================================= */}
            <div className="group relative hidden md:block">
              <button
                type="button"
                onClick={goToProfile}
                className="cursor-pointer p-1"
                aria-label="Profile"
              >
                <img
                  src={assets.profile_icon}
                  alt="profile"
                  className="w-5 invert opacity-80 transition hover:opacity-100"
                />
              </button>

              {/* PROFILE DROPDOWN
                  ONLY WHEN LOGGED IN
              */}
              {token && (
                <div className="absolute right-0 hidden pt-3 group-hover:block">
                  <div className="w-48 rounded-md border border-white/10 bg-[#111] py-3 shadow-xl">

                    <button
                      type="button"
                      onClick={goToProfile}
                      className="block w-full cursor-pointer px-5 py-2 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={goToOrders}
                      className="block w-full cursor-pointer px-5 py-2 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      Orders
                    </button>

                    <div className="my-2 border-t border-white/10" />

                    <button
                      type="button"
                      onClick={logout}
                      className="block w-full cursor-pointer px-5 py-2 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      Logout
                    </button>

                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                CART
            ================================================= */}
            <button
              type="button"
              onClick={goToCart}
              className="relative cursor-pointer p-1"
              aria-label="Cart"
            >
              <img
                src={assets.cart_icon}
                alt="cart"
                className="w-5 invert opacity-80 transition hover:opacity-100"
              />

              {token && cartCount > 0 && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </button>

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================= */}
            <button
              type="button"
              onClick={() => setVisible(true)}
              className="cursor-pointer p-1 md:hidden"
              aria-label="Open menu"
            >
              <img
                src={assets.menu_icon}
                alt="menu"
                className="w-6 invert opacity-80 transition hover:opacity-100"
              />
            </button>

          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}
      <div
        className={`fixed inset-0 z-[120] transition-all duration-300 md:hidden ${
          visible
            ? "pointer-events-auto"
            : "pointer-events-none"
        }`}
      >
        {/* BACKDROP */}
        <div
          onClick={() => setVisible(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            visible
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        {/* MENU PANEL */}
        <div
          className={`absolute right-0 top-0 h-full w-[82%] max-w-[320px] border-l border-white/10 bg-[#0A0A0A] transition-transform duration-300 ${
            visible
              ? "translate-x-0"
              : "translate-x-full"
          }`}
        >
          {/* HEADER */}
          <div className="flex h-14 items-center justify-between border-b border-white/10 px-6">
            <h2 className="text-xs font-black uppercase tracking-[0.22em] text-white">
              Saint Clothing
            </h2>

            <button
              type="button"
              onClick={() => setVisible(false)}
              className="cursor-pointer text-2xl text-white"
            >
              ×
            </button>
          </div>

          {/* MOBILE NAV */}
          <div className="px-6 py-5">

            {navItems.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setVisible(false);
                }}
                className="block w-full cursor-pointer border-b border-white/5 py-4 text-left text-sm uppercase tracking-[0.18em] text-white"
              >
                {item.label}
              </button>
            ))}

            {/* PROFILE */}
            <button
              type="button"
              onClick={goToProfile}
              className="block w-full cursor-pointer border-b border-white/5 py-4 text-left text-sm uppercase tracking-[0.18em] text-white"
            >
              PROFILE
            </button>

            {/* CART */}
            <button
              type="button"
              onClick={goToCart}
              className="block w-full cursor-pointer border-b border-white/5 py-4 text-left text-sm uppercase tracking-[0.18em] text-white"
            >
              CART
            </button>

            {/* ORDERS */}
            <button
              type="button"
              onClick={goToOrders}
              className="block w-full cursor-pointer border-b border-white/5 py-4 text-left text-sm uppercase tracking-[0.18em] text-white"
            >
              ORDERS
            </button>

            {/* LOGOUT */}
            {token && (
              <button
                type="button"
                onClick={logout}
                className="block w-full cursor-pointer py-4 text-left text-sm uppercase tracking-[0.18em] text-red-400"
              >
                LOGOUT
              </button>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;