// src/services/userService.js
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; // Asegúrate de que esta ruta sea correcta

export const userService = {
  /**
   * Actualiza los campos de un documento de perfil de usuario.
   * @param {string} userId - El UID del usuario.
   * @param {object} dataToUpdate - Un objeto con los campos a actualizar (ej. { termsAcceptedAt: new Date() }).
   */
  updateUserProfile: async (userId, dataToUpdate) => {
    try {
      if (!userId) {
        throw new Error("El ID de usuario es requerido para actualizar el perfil.");
      }
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, dataToUpdate);
      console.log(`Perfil del usuario ${userId} actualizado con éxito.`);
    } catch (error) {
      console.error(`Error al actualizar el perfil del usuario ${userId}:`, error);
      throw error;
    }
  },

  // Puedes añadir aquí otras funciones relacionadas con usuarios si las necesitas
};