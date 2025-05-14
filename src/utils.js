// src/utils.js
export const fn = {
    calcPrice: (price, discount) => {
      if (price === undefined || price === null) return 'N/A';
      const finalPrice = price * (1 - (discount || 0) / 100);
      return finalPrice.toFixed(2); // Formatea a 2 decimales
    },
    // ... otras utilidades que puedas tener
  };
  
  // O si exportas la función directamente:
  // export const calcPrice = (price, discount) => { /* ... */ };
  // En ese caso, la importación sería: import { calcPrice } from "../utils";
  // y usarías: {product.price !== undefined ? `${calcPrice(product.price, product.discount)}€` : 'Precio no disponible'}
  // Pero dado el error, parece que esperas un objeto 'fn'.