import React,{useContext}from"react";
import{Routes,Route,Navigate}from"react-router-dom";

import Home from"./pages/Home";
import Collection from"./pages/Collection";
import LatestCollection from"./components/LatestCollection";
import BestSeller from"./components/BestSeller";

import About from"./pages/About";
import Contact from"./pages/Contact";
import Product from"./pages/Product";
import Cart from"./pages/Cart";
import Login from"./pages/Login";
import PlaceOrder from"./pages/PlaceOrder";
import Orders from"./pages/Orders";
import Profile from"./pages/Profile";
import MyAccount from"./pages/MyAccount";
import Preferences from"./pages/Preferences";
import Support from"./pages/Support";
import Policies from"./pages/Policies";
import Verify from"./pages/Verify";
import ManualPayment from"./pages/ManualPayment";
import PaymentSubmitted from"./pages/PaymentSubmitted";
import StyleBuilder from"./pages/StyleBuilder";

import Navbar from"./components/Navbar";
import Footer from"./components/Footer";
import SearchBar from"./components/SearchBar";
import ScrollToTop from"./components/ScrollToTop";

import{ShopContext}from"./context/ShopContext";

import{ToastContainer}from"react-toastify";
import"react-toastify/dist/ReactToastify.css";

export const backendUrl=import.meta.env.VITE_BACKEND_URL?.trim()||"http://localhost:4000";
export const currency="₱";

const ProtectedRoute=({children})=>{
  const{token,authReady}=useContext(ShopContext);

  if(!authReady){
    return(
      <div className="flex min-h-[50vh] items-center justify-center bg-white">
        <div className="text-sm text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if(!token){
    return <Navigate to="/login" replace/>;
  }

  return children;
};

const App=()=>{
  return(
    <div className="w-full overflow-x-hidden pt-[72px] md:pt-[55px]">
      <ToastContainer/>

      <ScrollToTop/>

      <Navbar/>

      <SearchBar/>

      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home/>}/>

          <Route path="/collection" element={<Collection/>}/>

          <Route path="/latest" element={<LatestCollection/>}/>

          <Route path="/best-sellers" element={<BestSeller/>}/>

          <Route path="/style-builder" element={<StyleBuilder/>}/>

          <Route path="/about" element={<About/>}/>

          <Route path="/contact" element={<Contact/>}/>

          <Route path="/product/:productId" element={<Product/>}/>

          <Route path="/login" element={<Login/>}/>

          <Route path="/verify" element={<Verify/>}/>

          <Route path="/policies" element={<Policies/>}/>

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/place-order"
            element={
              <ProtectedRoute>
                <PlaceOrder/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/myaccount"
            element={
              <ProtectedRoute>
                <MyAccount/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <Preferences/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/manual-payment/:orderId"
            element={
              <ProtectedRoute>
                <ManualPayment/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment-submitted"
            element={
              <ProtectedRoute>
                <PaymentSubmitted/>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </main>

      <Footer/>
    </div>
  );
};

export default App;