import React from 'react'
import { assets } from '../assets/assets'

const OurPolicy = () => {
  return (
    /* Clean, professional background without the industrial gradients */
    <div className='bg-white pt-22 pb-10 px-4 border-y border-gray-50'>
      <div className='max-w-6xl mx-auto flex flex-col sm:flex-row justify-around gap-10 sm:gap-6 text-center'>
        
        {/* Policy Item 1: Exchange */}
        <div className='group relative flex-1 p-10 bg-white transition-all duration-500 overflow-hidden rounded-sm border border-transparent hover:border-gray-100 hover:shadow-sm'>
          {/* Hover Glow Effect: Subtle gray wash */}
          <div className='absolute inset-0 bg-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
          
          <img 
            src={assets.exchange_icon} 
            className='w-12 m-auto mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 relative z-10' 
            alt="Exchange" 
          />
          <p className='font- text-black uppercase tracking-widest text-lg relative z-10'>
            Easy Exchange
          </p>
          <p className='text-gray-400 font-semibold text-[10px] uppercase tracking-[0.25em] mt-3 relative z-10'>
            Seamless product swaps
          </p>
        </div>

        {/* Policy Item 2: Returns */}
        <div className='group relative flex-1 p-10 bg-white transition-all duration-500 overflow-hidden rounded-sm border border-transparent hover:border-gray-100 hover:shadow-sm'>
          <div className='absolute inset-0 bg-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
          
          <img 
            src={assets.quality_icon} 
            className='w-12 m-auto mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 relative z-10' 
            alt="Return" 
          />
          <p className='font- text-black uppercase tracking-widest text-lg relative z-10'>
            7 Days Return
          </p>
          <p className='text-gray-400 font-semibold text-[10px] uppercase tracking-[0.25em] mt-3 relative z-10'>
            Full refund policy
          </p>
        </div>

        {/* Policy Item 3: Support */}
        <div className='group relative flex-1 p-10 bg-white transition-all duration-500 overflow-hidden rounded-sm border border-transparent hover:border-gray-100 hover:shadow-sm'>
          <div className='absolute inset-0 bg-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
          
          <img 
            src={assets.support_img} 
            className='w-12 m-auto mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 relative z-10' 
            alt="Support" 
          />
          <p className='font- text-black uppercase tracking-widest text-lg relative z-10'>
            Elite Support
          </p>
          <p className='text-gray-400 font-semibold text-[10px] uppercase tracking-[0.25em] mt-3 relative z-10'>
            Dedicated concierge assistance
          </p>
        </div>

      </div>
    </div>
  )
}

export default OurPolicy