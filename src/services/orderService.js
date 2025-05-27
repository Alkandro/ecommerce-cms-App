import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  where 
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const orderService = {
  // Crea un nuevo pedido
  // Ahora incluye totalAmount y imageUrl en los items
  createOrder: async ({ userId, userName, userEmail, items, address, paymentMethod, totalAmount }) => {
    const orderData = {
      userId,
      userName, // Añadido
      userEmail, // Añadido
      items,           // array de { id, name, price, quantity, imageUrl }
      address,         // objeto con dirección seleccionada
      paymentMethod,
      totalAmount, // Añadido
      status: "pending",
      createdAt: serverTimestamp(),
      acceptedAt: null, // Inicialmente nulo
      rejectedAt: null, // Inicialmente nulo
      notes: "" // Inicialmente vacío
    };
    const ref = await addDoc(collection(db, "orders"), orderData);
    return ref;
  },
  // Actualiza el estado de un pedido existente
  updateOrderStatus: async (orderId, status) => {
    const orderRef = doc(db, "orders", orderId);
    // Cuando el estado cambia a 'accepted', registra la hora
    const updateData = { status };
    if (status === 'accepted') {
      updateData.acceptedAt = serverTimestamp();
    } else if (status === 'rejected') { // También si es rechazado
      updateData.rejectedAt = serverTimestamp();
    }
    await updateDoc(orderRef, updateData);
  },
  // Opcional: Obtener todos los pedidos para el CMS (si lo construyes con React Native Web/Expo)
  getAllOrders: async () => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  // Opcional: Obtener pedidos por usuario
  getUserOrders: async (userId) => {
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", userId), // Filtra por el ID del usuario
        orderBy("createdAt", "desc") // Ordena por fecha de creación
      );
      const querySnapshot = await getDocs(q);

      const userOrdersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return userOrdersList;
    } catch (error) {
      console.error(`Error al obtener los pedidos del usuario ${userId}: `, error);
      throw error;
    }
  }
};