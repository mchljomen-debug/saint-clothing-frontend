import React from 'react'
import { assets } from '../assets/assets'
import { Link, useLocation } from 'react-router-dom'

const Footer = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <footer className={`bg-[#050505] text-white ${isLoginPage ? 'mt-0' : 'mt-10'} relative overflow-hidden border-t border-white/5`}>
      
      {/* TOP ACCENT LINE */}
      <div className='h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-70'></div>

      <div className='max-w-[1440px] mx-auto px-6 md:px-16 lg:px-24 py-8 relative z-10'>
        <div className='flex flex-col sm:grid grid-cols-[2.3fr_1fr_1.2fr] gap-6 text-sm'>

          {/* BRAND SECTION */}
          <div className='flex flex-col gap-3 items-center sm:items-start'>
            <Link to='/' className='group flex items-center gap-4 w-fit'>
              <img 
                src={assets.logo} 
                className='w-12 md:w-14 brightness-0 invert opacity-80 group-hover:opacity-100 transition-all duration-500' 
                alt="Saint Clothing Logo" 
              />
              <h1 className='font-["Outfit"] font-black text-3xl md:text-4xl tracking-[0.15em] uppercase italic text-white'>
                SAINT CLOTHING
              </h1>
            </Link>
            
            <div className='w-full flex flex-col items-center sm:items-start text-center sm:text-left'>
              <p className='w-full lg:w-4/5 text-gray-300 leading-relaxed font-medium font-["Outfit"] text-[13px] md:text-[14px] mb-1'>
                Redefining the modern wardrobe with precision-engineered essentials. Experience the intersection of <span className='text-white'>STREETWEAR</span> and <span className='text-white'>PERFORMANCE</span>.
              </p>
            </div>
          </div>

          {/* NAVIGATION SECTION */}
          <div className='pt-1 text-center sm:text-left'>
            <p className='text-[11px] font-black tracking-[0.4em] text-gray-500 mb-3 uppercase'>Menu</p>
            <ul className='flex flex-col gap-2 text-gray-400 font-bold font-["Outfit"]'>
              <Link to='/'><li className='hover:text-white transition-all duration-300 cursor-pointer uppercase text-[10px] tracking-widest'>Home</li></Link>
              <Link to='/collection'><li className='hover:text-white transition-all duration-300 cursor-pointer uppercase text-[10px] tracking-widest'>Collections</li></Link>
              <li className='hover:text-white transition-all duration-300 cursor-pointer uppercase text-[10px] tracking-widest'>Shipping</li>
              <li className='hover:text-white transition-all duration-300 cursor-pointer uppercase text-[10px] tracking-widest'>Privacy</li>
            </ul>
          </div>

          {/* CONTACT & SOCIAL SECTION */}
          <div className='pt-1 text-center sm:text-left'>
            <p className='text-[11px] font-black tracking-[0.4em] text-gray-500 mb-3 uppercase'>Contact</p>
            <ul className='flex flex-col gap-2 text-gray-400 font-bold font-["Outfit"]'>
              <li className='text-[12px] tracking-widest uppercase hover:text-white transition-colors cursor-pointer'>
                <span className='text-white mr-2'>T.</span> +63 975 333 6199
              </li>
              <li className='text-[12px] tracking-widest uppercase hover:text-white transition-colors cursor-pointer break-all sm:break-normal'>
                <span className='text-white mr-2'>E.</span> mchljmn@gmail.com
              </li>
              
              {/* SOCIAL ICONS - UNCHANGED */}
              <li className='mt-3 flex gap-3 justify-center sm:justify-start'>
                {/* FACEBOOK */}
                <a 
                  href="https://web.facebook.com/saintbrandph21" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='w-10 h-10 border border-white/10 flex items-center justify-center transition-all duration-500 rounded-sm hover:bg-[#1877F2] hover:border-transparent group'
                >
                  <svg className='w-5 h-5 fill-current text-white' viewBox="0 0 24 24">
                    <path d="M9 8H7v4h2v9h4v-9h2.73l.41-4H13V6.5c0-.85.45-1.1 1-1.1h2V2h-3c-3 0-4 1.89-4 4v2z"/>
                  </svg>
                </a>

                {/* INSTAGRAM */}
                <a 
                  href="https://www.instagram.com/saintbrandph/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='w-10 h-10 border border-white/10 flex items-center justify-center transition-all duration-500 rounded-sm hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:border-transparent group'
                >
                  <svg className='w-5 h-5 fill-current text-white' viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* TIKTOK */}
                <a 
                  href="https://www.tiktok.com/@saintbrand_official" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='w-10 h-10 border border-white/10 flex items-center justify-center transition-all duration-500 rounded-sm hover:shadow-[2px_2px_0px_#ff0050,-2px_-2px_0px_#00f2ea] hover:border-white/40 group'
                >
                  <svg className='w-5 h-5 fill-current text-white' viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 2.54 3.23 2.11 1.19-.3 2.02-1.47 1.98-2.72-.02-4.11-.02-8.22-.02-12.33z"/>
                  </svg>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className='mt-6 pt-4 mb-[-20px]  border-t border-white/10 flex flex-col md:flex-row justify-between items-center'>
          <p className='text-[10px] font-bold text-gray-500 tracking-[0.4em] uppercase'>
            © 2026 SAINT CLOTHING | EST. 2026
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer