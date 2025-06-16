// import { 
//   collection, 
//   addDoc, 
//   doc, 
//   updateDoc, 
//   serverTimestamp,
//   query,
//   orderBy,
//   getDocs,
//   where 
// } from "firebase/firestore";
// import { db } from "../firebase/firebaseConfig";

// export const orderService = {
//   createOrder: async ({
//     userId,
//     userName,
//     userEmail,
//     items,
//     address,
//     paymentMethod,
//     totalAmount,
//     status = "pending",              // 🔹 default si no se pasa
//     paymentIntentId = null           // 🔹 opcional para Stripe
//   }) => {
//     const orderData = {
//       userId,
//       userName,
//       userEmail,
//       items,
//       address,
//       paymentMethod,
//       totalAmount,
//       status,
//       createdAt: serverTimestamp(),
//       acceptedAt: null,
//       rejectedAt: null,
//       notes: "",
//       paymentIntentId               // 🔹 nuevo campo (opcional)
//     };
  
//     const ref = await addDoc(collection(db, "orders"), orderData);
//     return ref;
//   },
  
//   // Actualiza el estado de un pedido existente
//   updateOrderStatus: async (orderId, status) => {
//     const orderRef = doc(db, "orders", orderId);
//     // Cuando el estado cambia a 'accepted', registra la hora
//     const updateData = { status };
//     if (status === 'accepted') {
//       updateData.acceptedAt = serverTimestamp();
//     } else if (status === 'rejected') { // También si es rechazado
//       updateData.rejectedAt = serverTimestamp();
//     }
//     await updateDoc(orderRef, updateData);
//   },
//   // Opcional: Obtener todos los pedidos para el CMS (si lo construyes con React Native Web/Expo)
//   getAllOrders: async () => {
//     const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
//     const querySnapshot = await getDocs(q);
//     return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//   },
//   // Opcional: Obtener pedidos por usuario
//   getUserOrders: async (userId) => {
//     try {
//       const q = query(
//         collection(db, "orders"),
//         where("userId", "==", userId), // Filtra por el ID del usuario
//         orderBy("createdAt", "desc") // Ordena por fecha de creación
//       );
//       const querySnapshot = await getDocs(q);

//       const userOrdersList = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       return userOrdersList;
//     } catch (error) {
//       console.error(`Error al obtener los pedidos del usuario ${userId}: `, error);
//       throw error;
//     }
//   }
// };


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
  // ✅ Crea un nuevo pedido (ahora acepta "status" y "paymentIntentId")
  createOrder: async ({
    userId,
    userName,
    userEmail,
    items,
    address,
    paymentMethod,
    totalAmount,
    status = "pending",              // ← acepta "paid" si viene desde Stripe
    createdAt = serverTimestamp(),   // ← puedes usar new Date() desde frontend si quieres fecha real
    paymentIntentId = null           // ← opcional: guardar ID de Stripe
  }) => {
    const orderData = {
      userId,
      userName,
      userEmail,
      items,              // array de { id, name, price, quantity, imageUrl }
      address,
      paymentMethod,
      totalAmount,
      status,
      createdAt,
      acceptedAt: null,
      rejectedAt: null,
      paymentIntentId,     // nuevo: para trazabilidad
      notes: ""
    };
    const ref = await addDoc(collection(db, "orders"), orderData);
    return ref;
  },

  // ✅ Actualiza el estado del pedido
  updateOrderStatus: async (orderId, status) => {
    const orderRef = doc(db, "orders", orderId);
    const updateData = { status };

    if (status === 'accepted') {
      updateData.acceptedAt = serverTimestamp();
    } else if (status === 'rejected') {
      updateData.rejectedAt = serverTimestamp();
    }

    await updateDoc(orderRef, updateData);
  },

  // ✅ Obtener todos los pedidos (para el CMS)
  getAllOrders: async () => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // ✅ Obtener pedidos por usuario
  getUserOrders: async (userId) => {
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
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
