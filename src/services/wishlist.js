import { db } from "../firebase/firebaseConfig"; // Ajusta la ruta a tu archivo config
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";

const wishlistService = {
  // Función para añadir un producto a la wishlist
  // Recibe el ID del usuario y el ID del producto
  addProductToWishlist: async (userId, productId) => {
    if (!userId || !productId) {
      throw new Error("User ID and Product ID are required.");
    }
    // Crea una referencia al documento del producto en la subcolección 'wishlist' del usuario
    const wishlistProductRef = doc(db, "users", userId, "wishlist", productId);
    
    // Puedes guardar un objeto vacío o solo el ID del producto si solo necesitas saber si está en la wishlist
    // Si quieres guardar más detalles del producto (ej. para mostrarlos directamente en la wishlist sin otra consulta),
    // primero obtén los datos del producto y guárdalos aquí.
    try {
      await setDoc(wishlistProductRef, { addedAt: new Date() }); // Añadir un timestamp es útil
      console.log(`Producto ${productId} añadido a la wishlist del usuario ${userId}`);
    } catch (error) {
      console.error("Error al añadir producto a la wishlist:", error);
      throw error;
    }
  },

  // Función para eliminar un producto de la wishlist
  // Recibe el ID del usuario y el ID del producto
  removeProductFromWishlist: async (userId, productId) => {
    if (!userId || !productId) {
      throw new Error("User ID and Product ID are required.");
    }
    const wishlistProductRef = doc(db, "users", userId, "wishlist", productId);
    try {
      await deleteDoc(wishlistProductRef);
      console.log(`Producto ${productId} eliminado de la wishlist del usuario ${userId}`);
    } catch (error) {
      console.error("Error al eliminar producto de la wishlist:", error);
      throw error;
    }
  },

  // Función para verificar si un producto está en la wishlist de un usuario
  isProductInWishlist: async (userId, productId) => {
    if (!userId || !productId) {
      return false;
    }
    const wishlistProductRef = doc(db, "users", userId, "wishlist", productId);
    try {
      const docSnap = await getDoc(wishlistProductRef);
      return docSnap.exists(); // Retorna true si existe, false si no
    } catch (error) {
      console.error("Error al verificar producto en wishlist:", error);
      return false;
    }
  },

  // Función para obtener todos los productos de la wishlist de un usuario
  getAllWishlistProducts: async (userId) => {
    if (!userId) {
      throw new Error("User ID is required.");
    }
    const wishlistCollectionRef = collection(db, "users", userId, "wishlist");
    try {
      const querySnapshot = await getDocs(wishlistCollectionRef);
      const wishlistProductIds = querySnapshot.docs.map(doc => doc.id); // Obtiene solo los IDs de los productos

      // Ahora, para obtener los detalles completos de cada producto, necesitas consultarlos de la colección 'products'
      const productDetails = [];
      if (wishlistProductIds.length > 0) {
        // Firestore solo permite 10 consultas 'in' a la vez. Si tienes más de 10, necesitarás paginar.
        // Por simplicidad, aquí asumimos menos de 100 productos en wishlist.
        // Si hay muchos, considera usar 'where(documentId(), 'in', batchOfIds)' en lotes o guardar los detalles en la wishlist.
        for (const productId of wishlistProductIds) {
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            productDetails.push({ id: productSnap.id, ...productSnap.data() });
          }
        }
      }
      return productDetails;
    } catch (error) {
      console.error("Error al obtener la wishlist:", error);
      throw error;
    }
  },
};

export { wishlistService };