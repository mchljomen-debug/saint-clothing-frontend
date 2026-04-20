import React, { useContext, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';

const CartTotal = ({ items = null }) => {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);

  const getFinalPrice = (item) => {
    const basePrice = Number(item?.price || 0);
    const salePercent = Number(item?.salePercent || 0);

    if (item?.onSale && salePercent > 0) {
      return Math.max(basePrice - (basePrice * salePercent) / 100, 0);
    }

    return basePrice;
  };

  const subtotal = useMemo(() => {
    if (Array.isArray(items)) {
      return items.reduce((sum, item) => {
        const qty = Number(item?.quantity || 0);
        return sum + getFinalPrice(item) * qty;
      }, 0);
    }

    return Number(getCartAmount() || 0);
  }, [items, getCartAmount]);

  const total = subtotal === 0 ? 0 : subtotal + Number(delivery_fee || 0);

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTALS'} />
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between'>
          <p>Subtotal</p>
          <p>{currency} {subtotal.toFixed(2)}</p>
        </div>

        <hr />

        <div className='flex justify-between'>
          <p>Shipping Fee</p>
          <p>{currency} {Number(delivery_fee || 0).toFixed(2)}</p>
        </div>

        <hr />

        <div className='flex justify-between'>
          <b>Total</b>
          <b>{currency} {total.toFixed(2)}</b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;