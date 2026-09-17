import React,{useContext}from"react";
import{ShopContext}from"../context/ShopContext";
import{useNavigate}from"react-router-dom";
import{
  MdLockOutline,
  MdAccountCircle,
  MdTune,
  MdLocalShipping,
  MdHelp,
  MdFlag,
  MdOutlineArrowOutward,
  MdPlace
}from"react-icons/md";
import{
  FiUser,
  FiShoppingBag,
  FiSettings,
  FiMapPin,
  FiShield,
  FiTrash2,
  FiLogOut,
  FiChevronRight,
  FiMail,
  FiEdit3
}from"react-icons/fi";

const getFirstName=(user)=>{
  if(user?.firstName?.trim())return user.firstName.trim();
  if(user?.name?.trim())return user.name.trim().split(" ")[0]||"";
  return"";
};

const getLastName=(user)=>{
  if(user?.lastName?.trim())return user.lastName.trim();
  if(user?.name?.trim())return user.name.trim().split(" ").slice(1).join(" ");
  return"";
};

export default function Profile(){
  const navigate=useNavigate();
  const{token,setToken,user,setUser,setCartItems,loading,backendUrl}=useContext(ShopContext);

  const handleDeleteAccount=()=>{
    if(window.confirm("Confirm account deletion? This action is permanent and all data will be removed.")){
      console.log("Account deleted");
    }
  };

  const handleLogout=()=>{
    setToken(null);
    setUser(null);
    setCartItems({});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatMainAddress=()=>{
    const address=user?.address||{};
    const parts=[
      address.houseUnit,
      address.street,
      address.barangay,
      address.city,
      address.province,
      address.region,
      address.zipcode,
      address.country
    ].filter(Boolean);

    return parts.length?parts.join(", "):"No main address saved yet";
  };

  const displayName=`${getFirstName(user)} ${getLastName(user)}`.trim()||user?.name||"Guest";

  const avatarSrc=user?.avatar
    ?user.avatar.startsWith("http")
      ?user.avatar
      :`${backendUrl}${user.avatar.startsWith("/")?user.avatar:`/${user.avatar}`}`
    :"/profile_icon.png";

  const initials=`${getFirstName(user)?.[0]||""}${getLastName(user)?.[0]||""}`.toUpperCase()||"S";

  const ServiceRow=({icon:Icon,label,subtext,onClick,isDestructive=false})=>{
    return(
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-center gap-4 border-b border-black/10 px-5 py-5 text-left transition last:border-b-0 ${
          isDestructive?"hover:bg-red-50/50":"hover:bg-black/[0.025]"
        }`}
      >
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition ${
            isDestructive
              ?"bg-red-50 text-red-600 group-hover:bg-red-100"
              :"bg-black/5 text-[#0A0D17] group-hover:bg-black group-hover:text-white"
          }`}
        >
          <Icon className="text-xl"/>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.18em] ${
              isDestructive?"text-red-600":"text-[#0A0D17]"
            }`}
          >
            {label}
          </p>

          <p className="mt-1 text-[11px] font-medium leading-5 text-gray-500">
            {subtext}
          </p>
        </div>

        <FiChevronRight
          className={`flex-shrink-0 text-lg text-gray-300 transition ${
            isDestructive
              ?"group-hover:text-red-500"
              :"group-hover:translate-x-1 group-hover:text-black"
          }`}
        />
      </button>
    );
  };

  const QuickAction=({icon:Icon,label,onClick})=>{
    return(
      <button
        type="button"
        onClick={onClick}
        className="group flex min-h-[120px] flex-col justify-between rounded-2xl border border-black/10 bg-white p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-black/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-[#0A0D17] transition group-hover:bg-black group-hover:text-white">
            <Icon className="text-lg"/>
          </div>

          <MdOutlineArrowOutward className="text-lg text-gray-300 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-black"/>
        </div>

        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#0A0D17]">
          {label}
        </p>
      </button>
    );
  };

  if(loading){
    return(
      <div className="min-h-screen bg-[#F5F4F0] px-4 pt-6 font-['Outfit'] text-[#0A0D17]">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse rounded-[28px] border border-black/10 bg-white p-6">
            <div className="h-8 w-40 rounded bg-black/5"/>

            <div className="mt-6 flex items-center gap-5">
              <div className="h-24 w-24 rounded-full bg-black/5"/>

              <div className="space-y-3">
                <div className="h-5 w-48 rounded bg-black/5"/>
                <div className="h-3 w-64 rounded bg-black/5"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if(!token){
    return(
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F5F4F0] px-5 font-['Outfit'] text-[#0A0D17]">
        <div className="w-full max-w-md rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
            <MdLockOutline className="text-3xl text-[#0A0D17]"/>
          </div>

          <p className="mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
            Saint Account
          </p>

          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#0A0D17]">
            Access Restricted
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-[11px] font-medium leading-6 text-gray-500">
            Sign in to access your orders, account details, preferences, and saved delivery information.
          </p>

          <button
            type="button"
            onClick={()=>navigate("/login")}
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#222]"
          >
            <FiUser/>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-[#F5F4F0] pb-20 pt-4 font-['Outfit'] text-[#0A0D17]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
            <span>Account</span>
            <span>/</span>
            <span className="text-black">Overview</span>
          </div>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-[#0A0D17] sm:text-5xl">
            My Account
          </h1>

          <p className="mt-2 text-sm font-medium text-gray-500">
            Manage your Saint account, orders, preferences, and security.
          </p>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_12px_50px_rgba(0,0,0,0.04)]">
          <div className="relative overflow-hidden bg-[#0A0D17] px-5 py-7 text-white sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10"/>
            <div className="pointer-events-none absolute -right-5 -top-10 h-40 w-40 rounded-full border border-white/5"/>

            <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-xl sm:h-28 sm:w-28">
                    {user?.avatar?(
                      <img
                        src={avatarSrc}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e)=>{
                          e.currentTarget.onerror=null;
                          e.currentTarget.style.display="none";
                        }}
                      />
                    ):(
                      <span className="text-3xl font-black">
                        {initials}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={()=>navigate("/myaccount")}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A0D17] bg-white text-black shadow-lg transition hover:bg-gray-100"
                    aria-label="Edit profile"
                  >
                    <FiEdit3 className="text-xs"/>
                  </button>
                </div>

                <div className="text-center sm:text-left">
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/40">
                    Saint Member
                  </p>

                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl">
                    {displayName}
                  </h2>

                  <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium text-white/60 sm:justify-start">
                    <FiMail/>

                    <span className="truncate">
                      {user?.email||"No email available"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
              >
                <FiLogOut/>
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-black/10 bg-[#FAF9F6] p-4 sm:grid-cols-4 sm:p-5">
            <QuickAction
              icon={FiUser}
              label="My Details"
              onClick={()=>navigate("/myaccount")}
            />

            <QuickAction
              icon={FiShoppingBag}
              label="My Orders"
              onClick={()=>navigate("/orders")}
            />

            <QuickAction
              icon={FiSettings}
              label="Preferences"
              onClick={()=>navigate("/preferences")}
            />

            <QuickAction
              icon={FiMapPin}
              label="Address"
              onClick={()=>navigate("/myaccount")}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0 bg-white p-5 sm:p-7 lg:p-8">
              <section className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Delivery
                    </p>

                    <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-[#0A0D17]">
                      Main Address
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={()=>navigate("/myaccount")}
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 transition hover:text-black"
                  >
                    Edit
                    <FiChevronRight/>
                  </button>
                </div>

                <div className="rounded-2xl border border-black/10 bg-[#F7F6F2] p-5">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-black text-white">
                      <MdPlace className="text-xl"/>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
                        Primary Delivery Location
                      </p>

                      <p className="mt-2 text-sm font-semibold leading-6 text-[#0A0D17]">
                        {formatMainAddress()}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Account
                    </p>

                    <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-[#0A0D17]">
                      Management
                    </h3>
                  </div>

                  <div className="h-px flex-1 bg-black/10"/>
                </div>

                <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                  <ServiceRow
                    icon={MdAccountCircle}
                    label="My Account"
                    subtext="Edit your personal details, avatar, address, and password."
                    onClick={()=>navigate("/myaccount")}
                  />

                  <ServiceRow
                    icon={MdLocalShipping}
                    label="Orders"
                    subtext="Track purchases, delivery progress, payments, and reviews."
                    onClick={()=>navigate("/orders")}
                  />

                  <ServiceRow
                    icon={MdTune}
                    label="Preferences"
                    subtext="Manage your preferred size, categories, colors, and notifications."
                    onClick={()=>navigate("/preferences")}
                  />
                </div>
              </section>
            </div>

            <aside className="border-t border-black/10 bg-[#F7F6F2] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
              <div className="mb-8 rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Account Status
                  </p>

                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>
                    Active
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-500">
                      Email
                    </span>

                    <span className="text-[10px] font-black text-gray-700">
                      Verified
                    </span>
                  </div>

                  <div className="h-px bg-black/5"/>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-500">
                      Session
                    </span>

                    <span className="text-[10px] font-black text-emerald-600">
                      Secure
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Help
                    </p>

                    <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-[#0A0D17]">
                      Assistance
                    </h3>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                  <ServiceRow
                    icon={MdHelp}
                    label="Support"
                    subtext="Get help, view FAQs, or contact customer care."
                    onClick={()=>navigate("/support")}
                  />

                  <ServiceRow
                    icon={MdFlag}
                    label="Policies"
                    subtext="Review privacy, shipping, returns, and terms."
                    onClick={()=>navigate("/policies")}
                  />

                  <ServiceRow
                    icon={MdLockOutline}
                    label="Security"
                    subtext="Manage your password and account security."
                    onClick={()=>navigate("/myaccount")}
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4 text-left transition hover:border-red-200 hover:bg-red-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <FiTrash2/>
                  </div>

                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-600">
                      Delete Account
                    </p>

                    <p className="mt-1 text-[10px] font-medium leading-4 text-red-600/60">
                      Permanently remove your account and data.
                    </p>
                  </div>

                  <FiChevronRight className="text-red-300 transition group-hover:translate-x-1 group-hover:text-red-600"/>
                </button>
              </div>
            </aside>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-black/10 bg-white px-5 py-5 sm:flex-row sm:px-8">
            <div className="flex items-center gap-2">
              <FiShield className="text-xs text-gray-400"/>

              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-gray-400">
                Secure Account Session
              </p>
            </div>

            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-gray-300">
              Saint Clothing
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}