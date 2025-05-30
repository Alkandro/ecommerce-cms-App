// src/services/termsConditionsService.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; // Asegúrate de que esta ruta sea correcta

const TERMS_DOC_ID = "currentTerms";
const SETTINGS_COLLECTION = "appSettings";

export const termsConditionsService = {
  getTermsAndConditions: async () => {
    try {
      const termsRef = doc(db, SETTINGS_COLLECTION, TERMS_DOC_ID);
      const docSnap = await getDoc(termsRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          content: data.content || null,
          lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : null, // ¡Asegúrate de este .toDate()!
        };
      } else {
        console.log("No se encontraron términos y condiciones en Firestore.");
        return { content: null, lastUpdated: null };
      }
    } catch (error) {
      console.error("Error al obtener los términos y condiciones:", error);
      throw error;
    }
  },
};