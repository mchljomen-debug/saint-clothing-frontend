import React, {
    useContext,
} from "react";

import {
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Collection from "./pages/Collection";
import LatestCollection from "./components/LatestCollection";
import BestSeller from "./components/BestSeller";

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

import { ShopContext } from "./context/ShopContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* =========================================================
   BACKEND URL
========================================================= */

export const backendUrl =
    import.meta.env.VITE_BACKEND_URL?.trim() ||
    "http://localhost:4000";

export const currency = "₱";

/* =========================================================
   PROTECTED ROUTE
========================================================= */

const ProtectedRoute = ({
    children,
}) => {
    const {
        token,
        authReady,
    } = useContext(ShopContext);

    /*
     * Wait until ShopContext finishes
     * checking localStorage/backend.
     */
    if (!authReady) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center bg-white">
                <div className="text-sm text-gray-500">
                    Loading...
                </div>
            </div>
        );
    }

    /*
     * No token = send user to login.
     */
    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    /*
     * Logged in = allow page.
     */
    return children;
};

/* =========================================================
   APP
========================================================= */

const App = () => {
    return (
        <div className="w-full overflow-x-hidden pt-[72px] md:pt-[55px]">
            <ToastContainer />

            <ScrollToTop />

            <Navbar />

            <SearchBar />

            <Routes>
                {/* =========================================
                    PUBLIC ROUTES
                ========================================= */}

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/collection"
                    element={<Collection />}
                />

                <Route
                    path="/latest"
                    element={
                        <LatestCollection />
                    }
                />

                <Route
                    path="/best-sellers"
                    element={
                        <BestSeller />
                    }
                />

                <Route
                    path="/style-builder"
                    element={
                        <StyleBuilder />
                    }
                />

                <Route
                    path="/about"
                    element={<About />}
                />

                <Route
                    path="/contact"
                    element={<Contact />}
                />

                <Route
                    path="/product/:productId"
                    element={<Product />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/verify"
                    element={<Verify />}
                />

                <Route
                    path="/policies"
                    element={<Policies />}
                />

                {/* =========================================
                    PROTECTED CART

                    Not logged in:
                    /cart -> /login

                    Logged in:
                    /cart -> Cart page
                ========================================= */}

                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute>
                            <Cart />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    PROTECTED PLACE ORDER
                ========================================= */}

                <Route
                    path="/place-order"
                    element={
                        <ProtectedRoute>
                            <PlaceOrder />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    PROTECTED ORDERS
                ========================================= */}

                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    PROTECTED PROFILE
                ========================================= */}

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    PROTECTED MY ACCOUNT
                ========================================= */}

                <Route
                    path="/myaccount"
                    element={
                        <ProtectedRoute>
                            <MyAccount />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    PROTECTED PREFERENCES
                ========================================= */}

                <Route
                    path="/preferences"
                    element={
                        <ProtectedRoute>
                            <Preferences />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    PROTECTED SUPPORT
                ========================================= */}

                <Route
                    path="/support"
                    element={
                        <ProtectedRoute>
                            <Support />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    PROTECTED MANUAL PAYMENT
                ========================================= */}

                <Route
                    path="/manual-payment/:orderId"
                    element={
                        <ProtectedRoute>
                            <ManualPayment />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    PROTECTED PAYMENT SUBMITTED
                ========================================= */}

                <Route
                    path="/payment-submitted"
                    element={
                        <ProtectedRoute>
                            <PaymentSubmitted />
                        </ProtectedRoute>
                    }
                />

                {/* =========================================
                    FALLBACK
                ========================================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />
            </Routes>

            <Footer />
        </div>
    );
};

export default App;