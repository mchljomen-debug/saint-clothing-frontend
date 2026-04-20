import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets';
import { useLocation } from 'react-router-dom';

const SearchBar = () => {

    const { search, setSearch, showSearch, setShowSearch } = useContext(ShopContext);
    const [visible, setVisible] = useState(false)
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.includes('collection')) {
            setVisible(true);
        } else {
            setVisible(false)
        }
    }, [location])

    return showSearch && visible ? (
        <div className='fixed top-20 left-0 w-full z-50 px-4 animate-fadeIn'>
            <div className='max-w-3xl mx-auto'>
                
                <div className='bg-white shadow-2xl border border-gray-100 flex items-center px-6 py-4 rounded-sm relative'>
                    
                    <div className='absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#1055C9] to-[#ED3500]'></div>

                    <img className='w-4 opacity-40' src={assets.search_icon} alt="search" />
                    
                    <input 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className='flex-1 outline-none bg-transparent text-sm ml-4 font-medium text-gray-700 placeholder:text-gray-400' 
                        type="text" 
                        placeholder='Search the fits...'
                        autoFocus
                    />

                    <button 
                        onClick={() => setShowSearch(false)}
                        className='ml-4 p-2 hover:bg-gray-50 transition-colors rounded-full'
                    >
                        <img className='w-3 opacity-50' src={assets.cross_icon} alt="close" />
                    </button>
                </div>

                <div className='flex justify-end mt-2 pr-2'>
                    <p className='text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]'>System Active // Search Mode</p>
                </div>
            </div>
        </div>
    ) : null
}

export default SearchBar