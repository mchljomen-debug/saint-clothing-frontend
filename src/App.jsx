import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Collection from "./pages/Collection";
import LatestPage from "./pages/LatestPage";
import BestSellersPage from "./pages/BestSellersPage";

import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import MyAccount from "./pages/MyAccount";
import Preferences from "./pages/Preferences";
import Support from "./pages/Support";
import Policies from "./pages/Policies";
import Verify from "./pages/Verify";
import ManualPayment from "./pages/ManualPayment";
import PaymentSubmitted from "./pages/PaymentSubmitted";
import StyleBuilder from "./pages/StyleBuilder";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import ScrollToTop from "./components/ScrollToTop";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const backendUrl = "http://localhost:4000";
export const currency = "₱";

const App = () => {
  return (
    <div className="w-full overflow-x-hidden pt-[72px] md:pt-[80px]">
      <ToastContainer />
      <ScrollToTop />
      <Navbar />
      <SearchBar />

      <Routes>
        {/* MAIN */}
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/latest" element={<LatestPage />} />
        <Route path="/best-sellers" element={<BestSellersPage />} />
        <Route path="/style-builder" element={<StyleBuilder />} />

        {/* OTHER PAGES */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/myaccount" element={<MyAccount />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/support" element={<Support />} />
        <Route path="/policies" element={<Policies />} />

        {/* PAYMENT */}
        <Route path="/manual-payment/:orderId" element={<ManualPayment />} />
        <Route path="/payment-submitted" element={<PaymentSubmitted />} />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;