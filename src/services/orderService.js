// src/services/orderService.js
import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    serverTimestamp 
  } from "firebase/firestore";
  import { db } from "../firebase/firebaseConfig";
  
  export const orderService = {
    // Crea un nuevo pedido
    createOrder: async ({ userId, items, address, paymentMethod }) => {
      const orderData = {
        userId,
        items,           // array de { slug, name, price, quantity, ... }
        address,         // objeto con dirección seleccionada
        paymentMethod,   // e.g. "Tarjeta ****1234"
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "orders"), orderData);
      return ref;
    },
    // Actualiza el estado de un pedido existente
    updateOrderStatus: async (orderId, status) => {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status });
    },
  };
  