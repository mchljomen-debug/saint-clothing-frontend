import React,{lazy,Suspense,useContext}from"react";
import{Routes,Route,Navigate}from"react-router-dom";
import{ShopContext}from"./context/ShopContext";
import Navbar from"./components/Navbar";
import Footer from"./components/Footer";
import SearchBar from"./components/SearchBar";
import ScrollToTop from"./components/ScrollToTop";
import{ToastContainer}from"react-toastify";
import"react-toastify/dist/ReactToastify.css";

const Home=lazy(()=>import("./pages/Home"));
const Collection=lazy(()=>import("./pages/Collection"));
const LatestCollection=lazy(()=>import("./components/LatestCollection"));
const BestSeller=lazy(()=>import("./components/BestSeller"));
const About=lazy(()=>import("./pages/About"));
const Contact=lazy(()=>import("./pages/Contact"));
const Product=lazy(()=>import("./pages/Product"));
const Cart=lazy(()=>import("./pages/Cart"));
const Login=lazy(()=>import("./pages/Login"));
const PlaceOrder=lazy(()=>import("./pages/PlaceOrder"));
const Orders=lazy(()=>import("./pages/Orders"));
const Profile=lazy(()=>import("./pages/Profile"));
const MyAccount=lazy(()=>import("./pages/MyAccount"));
const Preferences=lazy(()=>import("./pages/Preferences"));
const Support=lazy(()=>import("./pages/Support"));
const Policies=lazy(()=>import("./pages/Policies"));
const Verify=lazy(()=>import("./pages/Verify"));
const ManualPayment=lazy(()=>import("./pages/ManualPayment"));
const PaymentSubmitted=lazy(()=>import("./pages/PaymentSubmitted"));
const StyleBuilder=lazy(()=>import("./pages/StyleBuilder"));

export const backendUrl=import.meta.env.VITE_BACKEND_URL?.trim()||"http://localhost:4000";
export const currency="₱";

const PageLoader=()=>(
  <div className="flex min-h-[50vh] items-center justify-center bg-white">
    <div className="text-sm text-gray-500">
      Loading...
    </div>
  </div>
);

const ProtectedRoute=({children})=>{
  const{token,authReady}=useContext(ShopContext);

  if(!authReady){
    return <PageLoader/>;
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
        <Suspense fallback={<PageLoader/>}>
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
        </Suspense>
      </main>

      <Footer/>
    </div>
  );
};

export default App;