import React from 'react'

const NewsletterBox = () => {

    const onSubmitHandler = (event) => {
        event.preventDefault();
    }

  return (
    <div className='text-center pt-1 bg-white rounded-sm relative overflow-hidden border-b border-gray-100 mt-10'>
      
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full opacity-[0.03] pointer-events-none select-none'>
        <p className='text-[8rem] md:text-[12rem] font-black tracking-tighter uppercase'>SAINT</p>
      </div>

      <div className='relative z-10 px-4'>
        <h2 className='text-2xl md:text-3xl font-extrabold text-black uppercase tracking-widest'>
          Join the <span className='text-gray-500'>Inner Circle</span>
        </h2>
        
        <p className='text-gray-500 mt-4 text-xs md:text-sm font-semibold uppercase tracking-[0.3em]'>
          Subscribe for exclusive access to new drops & <span className='text-black underline decoration-black underline-offset-8 font-bold'>10% OFF</span> your first order.
        </p>

        <form onSubmit={onSubmitHandler} className='w-full sm:w-[600px] flex flex-col sm:flex-row items-stretch gap-0 mx-auto mt-12 border border-black overflow-hidden shadow-sm'>
          <input 
            className='w-full sm:flex-1 outline-none bg-white py-5 px-6 text-sm font-medium placeholder:text-gray-400 placeholder:uppercase' 
            type="email" 
            placeholder='Enter your email address' 
            required
          />
          <button 
            type='submit' 
            className='bg-black text-white text-[11px] font-bold tracking-[0.3em] px-12 py-5 sm:py-0 hover:bg-gray-800 transition-all duration-300 uppercase'
          >
            Subscribe
          </button>
        </form>
        
        <p className='text-[10px] text-gray-400 mt-8 font-medium uppercase tracking-widest'>
          By subscribing, you agree to receive our latest updates and offers.
        </p>
      </div>
    </div>
  )
}

export default NewsletterBox