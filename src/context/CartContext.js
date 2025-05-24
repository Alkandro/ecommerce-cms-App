import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // [{ product, quantity }]

  const addToCart = (product, quantity = 1) => {
    setCart(curr => {
      const idx = curr.findIndex(item => item.product.id === product.id);
      if (idx >= 0) {
        // ya existe → incrementa cantidad
        const updated = [...curr];
        updated[idx].quantity += quantity;
        return updated;
      }
      // nuevo
      return [...curr, { product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(curr => curr.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCart(curr => curr.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
