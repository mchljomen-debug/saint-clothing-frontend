import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const Contact = () => {
  return (
    <div className='pt-[1px] bg-transparent min-h-screen overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4 md:px-6 lg:px-8'>

        {/* HEADER */}
        <div className='border-t border-black/10 pt-8 md:pt-10 text-center'>
          <Title text1={'CONTACT'} text2={'SAINT'} />
          <p className='mt-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.32em] text-gray-500'>
            Get in touch with Saint Clothing
          </p>
        </div>

        {/* MAIN */}
        <div className='mt-10 md:mt-14 grid lg:grid-cols-[0.95fr_1.05fr] gap-5 md:gap-8 items-stretch'>

          {/* IMAGE */}
          <div className='bg-white/45 backdrop-blur-md border border-white/40 rounded-[22px] overflow-hidden shadow-[0_10px_28px_rgba(0,0,0,0.04)]'>
            <div className='relative w-full h-full min-h-[320px] md:min-h-[560px] overflow-hidden group'>
              <img
                className='absolute inset-0 w-full h-full object-cover grayscale-[10%] transition-all duration-700 ease-out group-hover:scale-105'
                src={assets.contact_img}
                alt='Saint Clothing'
              />

              <div className='absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent'></div>

              <div className='absolute bottom-4 left-4 right-4'>
                <div className='max-w-[340px] bg-white/55 backdrop-blur-md border border-white/50 rounded-2xl p-4'>
                  <p className='text-[10px] font-black uppercase tracking-[0.26em] text-gray-500 mb-2'>
                    Contact Saint
                  </p>
                  <p className='text-sm font-semibold text-[#0A0D17] leading-6'>
                    For support, collaborations, wholesale, and general inquiries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className='bg-white/45 backdrop-blur-md border border-white/40 rounded-[22px] p-5 md:p-7 lg:p-8 shadow-[0_10px_28px_rgba(0,0,0,0.04)] flex flex-col justify-between'>
            <div>
              <p className='text-[10px] font-black uppercase tracking-[0.28em] text-gray-500'>
                Reach Out
              </p>

              <h2 className='mt-2 text-3xl md:text-4xl font-black italic uppercase tracking-tight text-[#0A0D17] leading-none'>
                Let’s
                <br />
                Connect.
              </h2>

              <div className='mt-5 h-[2px] w-12 bg-black'></div>

              <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-4'>

                <div className='rounded-[20px] border border-white/50 bg-white/55 backdrop-blur-md p-5'>
                  <p className='text-[10px] font-black uppercase tracking-[0.26em] text-gray-500 mb-3'>
                    Email
                  </p>
                  <p className='text-lg md:text-xl font-black uppercase tracking-tight text-black'>
                    Client Services
                  </p>
                  <p className='mt-2 text-sm text-gray-600 font-medium break-all'>
                    mchljmn@gmail.com
                  </p>
                </div>

                <div className='rounded-[20px] border border-white/50 bg-white/55 backdrop-blur-md p-5'>
                  <p className='text-[10px] font-black uppercase tracking-[0.26em] text-gray-500 mb-3'>
                    Phone
                  </p>
                  <p className='text-lg md:text-xl font-black uppercase tracking-tight text-black'>
                    Direct Line
                  </p>
                  <p className='mt-2 text-sm text-gray-600 font-medium'>
                    (+63) 975 333 6199
                  </p>
                </div>

                <div className='rounded-[20px] border border-black/10 bg-black/90 p-5 md:col-span-2'>
                  <p className='text-[10px] font-black uppercase tracking-[0.26em] text-gray-400 mb-3'>
                    Address
                  </p>
                  <p className='text-lg md:text-xl font-black uppercase tracking-tight text-white'>
                    Saint Clothing
                  </p>
                  <p className='mt-2 text-sm text-gray-400 font-medium leading-6'>
                    Pasig City, Metro Manila,
                    <br />
                    Philippines, 1600
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className='mt-8 md:mt-10 pt-6 border-t border-black/10 flex flex-col md:flex-row md:items-center justify-between gap-5'>
              <div className='max-w-md'>
                <p className='text-[11px] font-black uppercase tracking-[0.2em] text-black mb-2'>
                  Careers at Saint
                </p>
                <p className='text-[13px] text-gray-500 font-medium leading-6'>
                  We are open to passionate creatives, developers, and designers who want to grow with the brand.
                </p>
              </div>

              <button className='h-11 px-6 rounded-xl bg-black text-white font-black uppercase tracking-[0.16em] transition hover:opacity-90 whitespace-nowrap'>
                View Positions
              </button>
            </div>
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className='mt-14 md:mt-16 mb-16 md:mb-20'>
          <NewsletterBox />
        </div>
      </div>
    </div>
  )
}

export default Contact