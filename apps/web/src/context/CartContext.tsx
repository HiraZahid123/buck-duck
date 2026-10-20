'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  product_id: number;
  qty: number;
  name: string;
  price_cents: number;
  emoji?: string;
  image_url?: string;
  unit?: string;
  stock: number;
  store_id: number;
  store_name: string;
  store_slug: string;
}

interface CartContextType {
  cart: CartItem[];
  cartQty: (productId: number) => number;
  setQty: (product: any, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  itemsByStore: Record<number, { store_id: number; store_name: string; store_slug: string; items: CartItem[] }>;
}

const CartContext = createContext<CartContextType>({} as any);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bd_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCart(items);
    try {
      localStorage.setItem('bd_cart', JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const cartQty = (productId: number) => {
    const item = cart.find((i) => i.product_id === productId);
    return item ? item.qty : 0;
  };

  const setQty = (product: any, qty: number) => {
    const index = cart.findIndex((i) => i.product_id === product.id);
    let nextCart = [...cart];

    if (qty <= 0) {
      if (index >= 0) {
        nextCart.splice(index, 1);
      }
    } else if (index >= 0) {
      nextCart[index].qty = Math.min(qty, product.stock || 99);
    } else {
      nextCart.push({
        product_id: product.id,
        qty: Math.min(qty, product.stock || 99),
        name: product.name,
        price_cents: product.priceCents || product.price_cents,
        emoji: product.emoji,
        image_url: product.imageUrl || product.image_url,
        unit: product.unit,
        stock: product.stock,
        store_id: product.storeId || product.store_id,
        store_name: product.store?.name || product.store_name,
        store_slug: product.store?.slug || product.store_slug,
      });
    }

    saveCart(nextCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price_cents * item.qty, 0);

  const itemsByStore: Record<number, { store_id: number; store_name: string; store_slug: string; items: CartItem[] }> = {};
  for (const item of cart) {
    if (!itemsByStore[item.store_id]) {
      itemsByStore[item.store_id] = {
        store_id: item.store_id,
        store_name: item.store_name,
        store_slug: item.store_slug,
        items: [],
      };
    }
    itemsByStore[item.store_id].items.push(item);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        cartQty,
        setQty,
        clearCart,
        cartCount,
        cartSubtotal,
        itemsByStore,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
