// src/services/addressService.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; // Asegúrate de que esta ruta sea correcta

export const addressService = {
  /**
   * Obtiene todas las direcciones de un usuario específico.
   * @param {string} userId - El UID del usuario.
   * @returns {Promise<Array<Object>>} - Una promesa que resuelve con una lista de objetos de dirección.
   */
  getUserAddresses: async (userId) => {
    if (!userId) {
      console.warn("getUserAddresses: userId es nulo o indefinido.");
      return [];
    }
    try {
      const addressesRef = collection(db, "userAddresses");
      const q = query(addressesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const addressList = [];
      querySnapshot.forEach((doc) => {
        addressList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      return addressList;
    } catch (error) {
      console.error("Error al cargar direcciones en addressService:", error);
      throw new Error("No se pudieron cargar las direcciones del usuario.");
    }
  },

  // Puedes añadir más funciones aquí si las necesitas, como addAddress, updateAddress, deleteAddress
};