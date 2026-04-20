import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  return (
    <div className='pt-[1px] bg-transparent min-h-screen overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4 md:px-6 lg:px-8'>

        {/* HEADER */}
        <div className='border-t border-black/10 pt-8 md:pt-10 text-center'>
          <Title text1={'ABOUT'} text2={'SAINT'} />
          <p className='mt-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.38em] text-gray-500'>
            Modern Streetwear Identity
          </p>
        </div>

        {/* HERO */}
        <div className='mt-10 md:mt-14 grid lg:grid-cols-[0.95fr_1.05fr] gap-5 md:gap-8 items-stretch'>
          
          {/* IMAGE */}
          <div className='bg-white border border-black/10 rounded-[22px] overflow-hidden shadow-[0_10px_28px_rgba(0,0,0,0.05)]'>
            <div className='relative w-full h-full min-h-[320px] md:min-h-[520px] overflow-hidden'>
              <img
                src={assets.about_img}
                alt='Saint Clothing Studio'
                className='absolute inset-0 w-full h-full object-cover grayscale-[25%] transition duration-700 hover:scale-105'
              />

              <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent'></div>

              <div className='absolute top-4 left-4'>
                <span className='inline-flex items-center rounded-full bg-black text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]'>
                  Saint Clothing
                </span>
              </div>

              <div className='absolute bottom-4 left-4 right-4'>
                <div className='max-w-[320px] bg-white/90 backdrop-blur-sm border border-black/10 rounded-2xl p-4'>
                  <p className='text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2'>
                    Studio Note
                  </p>
                  <p className='text-sm font-semibold text-[#0A0D17] leading-6'>
                    Built for everyday wear with a sharper silhouette and cleaner identity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TEXT */}
          <div className='bg-white border border-black/10 rounded-[22px] shadow-[0_10px_28px_rgba(0,0,0,0.05)] p-5 md:p-7 lg:p-8 flex flex-col justify-between'>
            <div>
              <p className='text-[10px] font-black uppercase tracking-[0.3em] text-gray-500'>
                The Identity
              </p>

              <h2 className='mt-2 text-3xl md:text-4xl font-black italic uppercase tracking-tight text-[#0A0D17] leading-none'>
                Architectural
                <br />
                Streetwear.
              </h2>

              <div className='mt-5 h-[2px] w-12 bg-black'></div>

              <p className='mt-5 text-[14px] md:text-[15px] leading-7 text-gray-600'>
                <span className='font-black text-black'>Saint Clothing</span> was built around the idea of a modern uniform. We move away from visual noise and focus on shape, texture, structure, and purpose.
              </p>

              <p className='mt-4 text-[14px] md:text-[15px] leading-7 text-gray-600'>
                Our pieces are designed to feel sharp, wearable, and confident in everyday life. Clean silhouettes, strong fabrics, and minimal detailing define the Saint identity.
              </p>
            </div>

            <div className='mt-6 grid sm:grid-cols-2 gap-3'>
              <div className='rounded-2xl border border-black/10 bg-[#F8F8F6] p-4'>
                <p className='text-[10px] font-black uppercase tracking-[0.28em] text-gray-500 mb-2'>
                  Focus
                </p>
                <p className='text-sm font-bold text-[#0A0D17] leading-6'>
                  Clean form, premium feel, daily function.
                </p>
              </div>

              <div className='rounded-2xl border border-black bg-black p-4'>
                <p className='text-[10px] font-black uppercase tracking-[0.28em] text-gray-400 mb-2'>
                  Ver. 2026.04
                </p>
                <p className='text-sm font-semibold text-white leading-6'>
                  Minimal direction with a bold streetwear edge.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PHILOSOPHY */}
        <div className='mt-6 md:mt-8 bg-black rounded-[22px] overflow-hidden border border-black/10 shadow-[0_10px_28px_rgba(0,0,0,0.08)]'>
          <div className='grid md:grid-cols-[220px_1fr]'>
            <div className='border-b md:border-b-0 md:border-r border-white/10 p-5 md:p-6'>
              <p className='text-[10px] font-black uppercase tracking-[0.32em] text-gray-400'>
                Philosophy
              </p>
            </div>

            <div className='p-5 md:p-6'>
              <p className='text-sm md:text-[15px] text-gray-300 leading-7'>
                We create a refined wardrobe that bridges premium fashion attitude and real-world street utility — pieces that feel elevated without being loud.
              </p>
            </div>
          </div>
        </div>

        {/* CORE PILLARS */}
        <div className='mt-14 md:mt-16 text-center'>
          <Title text1={'CORE'} text2={'PILLARS'} />
          <div className='w-12 h-[2px] bg-black mx-auto mt-3'></div>
        </div>

        <div className='mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
          
          <div className='bg-white border border-black/10 rounded-[22px] p-5 md:p-6 shadow-[0_10px_28px_rgba(0,0,0,0.05)]'>
            <span className='text-[10px] font-black tracking-[0.32em] text-gray-500 uppercase'>
              01 / Fabric
            </span>
            <h3 className='mt-4 text-xl font-black uppercase tracking-tight text-black'>
              Premium Curation
            </h3>
            <p className='mt-3 text-[13px] leading-6 text-gray-500 font-medium'>
              Materials selected for durability, comfort, and structure.
            </p>
          </div>

          <div className='bg-black border border-black rounded-[22px] p-5 md:p-6 shadow-[0_10px_28px_rgba(0,0,0,0.08)]'>
            <span className='text-[10px] font-black tracking-[0.32em] text-gray-400 uppercase'>
              02 / Vision
            </span>
            <h3 className='mt-4 text-xl font-black uppercase tracking-tight text-white'>
              Minimal Precision
            </h3>
            <p className='mt-3 text-[13px] leading-6 text-gray-400 font-medium'>
              Clean design, strong silhouette, intentional identity.
            </p>
          </div>

          <div className='bg-white border border-black/10 rounded-[22px] p-5 md:p-6 shadow-[0_10px_28px_rgba(0,0,0,0.05)]'>
            <span className='text-[10px] font-black tracking-[0.32em] text-gray-500 uppercase'>
              03 / Community
            </span>
            <h3 className='mt-4 text-xl font-black uppercase tracking-tight text-black'>
              The Collective
            </h3>
            <p className='mt-3 text-[13px] leading-6 text-gray-500 font-medium'>
              Built for creators, thinkers, and everyday wearers.
            </p>
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

export default About