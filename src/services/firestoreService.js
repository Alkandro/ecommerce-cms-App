// src/services/firestoreService.js
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createUserProfile, createUserAddress } from "../models/userModel";

// Servicios para gestión de perfil de usuario
export const userProfileService = {
  // Obtener perfil de usuario
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      } else {
        console.log("No se encontró el perfil del usuario");
        return null;
      }
    } catch (error) {
      console.error("Error al obtener perfil de usuario:", error);
      throw error;
    }
  },
  
  // Crear perfil de usuario
  async createUserProfile(userId, userData) {
    try {
      const userProfile = createUserProfile(
        userId,
        userData.email,
        userData.displayName || ""
      );
      
      // Añadir campos adicionales
      if (userData.firstName) userProfile.firstName = userData.firstName;
      if (userData.lastName) userProfile.lastName = userData.lastName;
      if (userData.phoneNumber) userProfile.phoneNumber = userData.phoneNumber;
      if (userData.photoURL) userProfile.photoURL = userData.photoURL;
      
      await setDoc(doc(db, "users", userId), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userProfile;
    } catch (error) {
      console.error("Error al crear perfil de usuario:", error);
      throw error;
    }
  },
  
  // Actualizar perfil de usuario (usa setDoc con merge para crear si no existe)
  async updateUserProfile(userId, userData) {
    try {
      const userRef = doc(db, "users", userId);
      
      // Añadir timestamp de actualización
      userData.updatedAt = serverTimestamp();
      
      // Merge: true crea o actualiza sin sobrescribir todo el documento
      await setDoc(userRef, userData, { merge: true });
      return true;
    } catch (error) {
      console.error("Error al actualizar perfil de usuario:", error);
      throw error;
    }
  }
};

// Servicios para gestión de direcciones
export const addressService = {
  // Obtener todas las direcciones de un usuario
  async getUserAddresses(userId) {
    try {
      const addressesRef = collection(db, "userAddresses");
      const q = query(addressesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const addresses = [];
      querySnapshot.forEach((docSnap) => {
        addresses.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      return addresses;
    } catch (error) {
      console.error("Error al obtener direcciones:", error);
      throw error;
    }
  },
  
  // Obtener una dirección específica
  async getAddress(addressId) {
    try {
      const addressRef = doc(db, "userAddresses", addressId);
      const addressSnap = await getDoc(addressRef);
      
      if (addressSnap.exists()) {
        return { id: addressSnap.id, ...addressSnap.data() };
      } else {
        console.log("No se encontró la dirección");
        return null;
      }
    } catch (error) {
      console.error("Error al obtener dirección:", error);
      throw error;
    }
  },
  
  // Crear nueva dirección
  async createAddress(userId, addressData) {
    try {
      // Si esta dirección es predeterminada, actualizar las demás
      if (addressData.isDefault) {
        await this.resetDefaultAddresses(userId);
      }
      
      const newAddress = createUserAddress(userId, addressData);
      const docRef = await addDoc(collection(db, "userAddresses"), {
        ...newAddress,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { id: docRef.id, ...newAddress };
    } catch (error) {
      console.error("Error al crear dirección:", error);
      throw error;
    }
  },
  
  // Actualizar dirección existente
  async updateAddress(addressId, addressData) {
    try {
      const addressRef = doc(db, "userAddresses", addressId);
      
      // Si esta dirección es predeterminada, actualizar las demás
      if (addressData.isDefault) {
        const addressSnap = await getDoc(addressRef);
        if (addressSnap.exists()) {
          const userId = addressSnap.data().userId;
          await this.resetDefaultAddresses(userId);
        }
      }
      
      // Añadir timestamp de actualización
      addressData.updatedAt = serverTimestamp();
      
      await updateDoc(addressRef, addressData);
      return true;
    } catch (error) {
      console.error("Error al actualizar dirección:", error);
      throw error;
    }
  },
  
  // Eliminar dirección
  async deleteAddress(addressId) {
    try {
      await deleteDoc(doc(db, "userAddresses", addressId));
      return true;
    } catch (error) {
      console.error("Error al eliminar dirección:", error);
      throw error;
    }
  },
  
  // Resetear direcciones predeterminadas
  async resetDefaultAddresses(userId) {
    try {
      const addressesRef = collection(db, "userAddresses");
      const q = query(
        addressesRef,
        where("userId", "==", userId),
        where("isDefault", "==", true)
      );
      const querySnapshot = await getDocs(q);
      
      const batch = [];
      querySnapshot.forEach((docSnap) => {
        const addressRef = doc(db, "userAddresses", docSnap.id);
        batch.push(updateDoc(addressRef, { isDefault: false }));
      });
      
      if (batch.length > 0) {
        await Promise.all(batch);
      }
      
      return true;
    } catch (error) {
      console.error("Error al resetear direcciones predeterminadas:", error);
      throw error;
    }
  }
};

// Servicios para gestión de métodos de pago
export const paymentMethodService = {
  // Implementar según sea necesario
};
  
// Servicios para gestión de notificaciones
export const notificationSettingsService = {
  // Implementar según sea necesario
};
