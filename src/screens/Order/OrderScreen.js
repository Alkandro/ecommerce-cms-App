// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   Button,
//   Alert,
//   ActivityIndicator,
//   Platform,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { DateTime } from "luxon";
// import { useAuth } from "../../context/AuthContext";
// import { useCart } from "../../context/CartContext";
// import { addressService } from "../../services/addressService";
// import { orderService } from "../../services/orderService";
// import { termsConditionsService } from "../../services/termsConditionsService";
// import { Ionicons } from "@expo/vector-icons";
// import { doc, onSnapshot, getDoc } from "firebase/firestore";
// import { db } from "../../firebase/firebaseConfig";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useNavigation } from "@react-navigation/native";
// import {
//   initPaymentSheet,
//   presentPaymentSheet,
// } from "@stripe/stripe-react-native";

// const LAST_ORDER_ID_KEY = "@lastOrderId";

// export default function OrderScreen() {
//   const { user, userProfile } = useAuth();
//   const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
//   const navigation = useNavigation();

//   const [addresses, setAddresses] = useState([]);
//   const [selectedAddress, setSelectedAddress] = useState(null);
//   const [currentOrderId, setCurrentOrderId] = useState(null);
//   const [orderStatusFromDb, setOrderStatusFromDb] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [addressLoading, setAddressLoading] = useState(true);
//   const [latestTermsLastUpdated, setLatestTermsLastUpdated] = useState(null);

//   // 1) Carga inicial de direcciones y último pedido
//   useEffect(() => {
//     const loadInitialData = async () => {
//       setAddressLoading(true);
//       if (user?.uid) {
//         try {
//           const list = await addressService.getUserAddresses(user.uid);
//           setAddresses(list);
//           setSelectedAddress(list.find((a) => a.isDefault) || list[0] || null);
//         } catch (err) {
//           console.error(err);
//           Alert.alert("Error", "No se pudieron cargar tus direcciones.");
//         }
//       }
//       setAddressLoading(false);

//       try {
//         const storedId = await AsyncStorage.getItem(LAST_ORDER_ID_KEY);
//         if (storedId) setCurrentOrderId(storedId);
//       } catch (err) {
//         console.error("Error leyendo último pedido:", err);
//       }
//     };
//     loadInitialData();
//   }, [user?.uid]);

//   // 2) Escucha de estado del pedido
//   useEffect(() => {
//     if (!currentOrderId || !user?.uid) return;

//     const orderRef = doc(db, "orders", currentOrderId);
//     let unsubscribe;

//     (async () => {
//       try {
//         const snap = await getDoc(orderRef);
//         if (!snap.exists()) {
//           setCurrentOrderId(null);
//           await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
//           return;
//         }
//         unsubscribe = onSnapshot(
//           orderRef,
//           (docSnap) => {
//             const data = docSnap.data();
//             setOrderStatusFromDb(data.status);
//             if (["accepted", "rejected"].includes(data.status)) {
//               setCurrentOrderId(null);
//               setOrderStatusFromDb(null);
//               AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
//             }
//           },
//           (err) => {
//             console.error(err);
//             setOrderStatusFromDb("error");
//           },
//         );
//       } catch (e) {
//         console.error(e);
//         setOrderStatusFromDb("error");
//         setCurrentOrderId(null);
//         await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
//       }
//     })();

//     return () => unsubscribe && unsubscribe();
//   }, [currentOrderId, user?.uid]);

//   // 3) Fecha de T&C
//   useEffect(() => {
//     termsConditionsService
//       .getTermsAndConditions()
//       .then(({ lastUpdated }) => setLatestTermsLastUpdated(lastUpdated))
//       .catch(console.error);
//   }, []);

//   // Helpers de Stripe
//   const fetchPaymentSheetParams = async () => {
//     try {
//       const res = await fetch(
//         "https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ amount: Math.round(total * 100) }),
//         },
//       );
//       return await res.json();
//     } catch (e) {
//       console.error(e);
//       Alert.alert("Error", "No se pudo iniciar el pago.");
//       return null;
//     }
//   };

//   const startStripePayment = async (itemsForOrder) => {
//     setLoading(true);
//     const params = await fetchPaymentSheetParams();
//     if (!params) {
//       setLoading(false);
//       return;
//     }

//     const { error: initError } = await initPaymentSheet({
//       merchantDisplayName: "Mi Tienda de Prueba",
//       customerId: params.customer,
//       customerEphemeralKeySecret: params.ephemeralKey,
//       paymentIntentClientSecret: params.paymentIntent,
//       allowsDelayedPaymentMethods: true,
//     });
//     if (initError) {
//       Alert.alert("Error", "No se pudo inicializar el pago.");
//       setLoading(false);
//       return;
//     }

//     const { error: presentError } = await presentPaymentSheet();
//     if (presentError) {
//       Alert.alert("Pago fallido", presentError.message);
//     } else {
//       Alert.alert("✅ Pago exitoso", "Gracias por tu compra!");
//       try {
//         const ref = await orderService.createOrder({
//           userId: user.uid,
//           userName: user.displayName || user.email,
//           userEmail: user.email,
//           items: itemsForOrder,
//           address: selectedAddress,
//           paymentMethod: "Stripe",
//           totalAmount: total,
//           status: "paid",
//           createdAt: new Date(),
//           paymentIntentId: params.paymentIntent,
//         });
//         setCurrentOrderId(ref.id);
//         setOrderStatusFromDb("paid");
//         await AsyncStorage.setItem(LAST_ORDER_ID_KEY, ref.id);
//         clearCart();
//       } catch (e) {
//         console.error(e);
//         Alert.alert("Error", "Ocurrió un error guardando tu pedido.");
//       }
//     }
//     setLoading(false);
//   };

//   // Confirmación de pedido
//   const confirmOrder = async () => {
//     const acceptedAt = userProfile?.termsAcceptedAt?.toDate();
//     if (
//       !acceptedAt ||
//       !latestTermsLastUpdated ||
//       acceptedAt.getTime() < latestTermsLastUpdated.getTime()
//     ) {
//       return Alert.alert(
//         "Aviso Importante",
//         "Debes aceptar la última versión de los Términos y Condiciones.",
//         [
//           { text: "Cancelar", style: "cancel" },
//           {
//             text: "Ir a Términos",
//             onPress: () => navigation.navigate("TermsConditions"),
//           },
//         ],
//       );
//     }

//     if (!selectedAddress) {
//       return Alert.alert(
//         "Elige una dirección",
//         "Selecciona una antes de continuar.",
//       );
//     }

//     const itemsForOrder = cart.map((i) => ({
//       id: i.product.id,
//       name: i.product.name,
//       price: i.product.price,
//       quantity: i.quantity,
//       imageUrl: i.product.image,
//     }));

//     await startStripePayment(itemsForOrder);
//   };

//   // const total = cart.reduce((sum, i) => {
//   //   const unitPrice = i.product.discount > 0
//   //     ? i.product.price * (1 - i.product.discount / 100)
//   //     : i.product.price;
//   //   return sum + unitPrice * i.quantity;
//   // }, 0);
//   // const displayStatus = currentOrderId ? orderStatusFromDb : null;

//   // ✅ CORRECCIÓN: Calcula el total sin aplicar descuento de nuevo
//   const total = cart.reduce((sum, i) => {
//     // El precio ya viene con descuento aplicado desde ProductScreen
//     const unitPrice = i.product.price;
//     return sum + unitPrice * i.quantity;
//   }, 0);

//   const displayStatus = currentOrderId ? orderStatusFromDb : null;

//   return (
//     <SafeAreaView style={s.container}>
//       {displayStatus && (
//         <Text
//           style={[
//             s.status,
//             displayStatus === "pending"
//               ? s.pending
//               : displayStatus === "accepted"
//                 ? s.accepted
//                 : s.rejected,
//           ]}
//         >
//           {displayStatus === "pending"
//             ? "⏳ Esperando aceptación"
//             : displayStatus === "accepted"
//               ? "✅ Pedido aceptado"
//               : "❌ Pedido rechazado"}
//         </Text>
//       )}

//       {cart.length > 0 || currentOrderId ? (
//         <FlatList
//           data={cart}
//           keyExtractor={(item) => item.product.id}
//           style={{ marginTop: Platform.OS === "ios" ? 20 : 40 }}
//           renderItem={({ item }) => (
//             <View style={s.itemContainer}>
//               <View style={s.itemRow}>
//                 {/* 1) Imagen a la izquierda */}
//                 <Image source={{ uri: item.product.image }} style={s.img} />

//                 {/* 2) Detalles: título, precio y controles */}
//                 <View style={s.details}>
//                   {/* Línea 1: Título */}
//                   <Text style={s.title} numberOfLines={2} ellipsizeMode="tail">
//                     {item.product.name}
//                   </Text>

//                   {/* Línea 2: Precio */}
//                   <Text style={s.price}>{item.product.price.toFixed(2)}¥</Text>

//                   {/* Línea 3: controles cantidad a la izquierda, tachito a la derecha */}
//                   <View style={s.quantityRow}>
//                     <View style={s.qtyControls}>
//                       <TouchableOpacity
//                         onPress={() => {
//                           if (item.quantity - 1 <= 0)
//                             removeFromCart(item.product.id);
//                           else
//                             updateQuantity(item.product.id, item.quantity - 1);
//                         }}
//                       >
//                         <Text style={s.qtyBtn}>−</Text>
//                       </TouchableOpacity>
//                       <Text style={s.qtyText}>{item.quantity}</Text>
//                       <TouchableOpacity
//                         onPress={() =>
//                           updateQuantity(item.product.id, item.quantity + 1)
//                         }
//                       >
//                         <Text style={s.qtyBtn}>＋</Text>
//                       </TouchableOpacity>
//                     </View>
//                     <TouchableOpacity
//                       onPress={() => removeFromCart(item.product.id)}
//                       style={s.deleteButton}
//                     >
//                       <Ionicons
//                         name="trash-outline"
//                         size={22}
//                         color="#D32F2F"
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               </View>
//             </View>
//           )}
//           ListEmptyComponent={
//             currentOrderId && (
//               <View style={s.orderInProgressContainer}>
//                 <Text style={s.orderInProgressText}>
//                   Tu pedido está en proceso...
//                 </Text>
//                 <Text style={s.orderInProgressSubtext}>
//                   Puedes salir de esta pantalla; el estado se actualizará.
//                 </Text>
//               </View>
//             )
//           }
//         />
//       ) : (
//         <View style={s.emptyCartContainer}>
//           <Text style={s.emptyCartText}>Tu carrito está vacío.</Text>
//           <Text style={s.emptyCartSubtext}>
//             Agrega algunos productos para hacer un pedido.
//           </Text>
//         </View>
//       )}

//       {/* Dirección */}
//       <View style={s.section}>
//         <Text style={s.label}>Dirección envío:</Text>
//         {addressLoading ? (
//           <ActivityIndicator color="#007bff" />
//         ) : selectedAddress ? (
//           <View style={s.selectedAddressDetails}>
//             <Text style={s.addressDetailText}>{selectedAddress.fullName}</Text>
//             <Text style={s.addressDetailText}>
//               {selectedAddress.street}
//               {selectedAddress.number ? `, ${selectedAddress.number}` : ""}
//             </Text>
//             <Text style={s.addressDetailText}>
//               {selectedAddress.city}, {selectedAddress.state}{" "}
//               {selectedAddress.zipCode}
//             </Text>
//           </View>
//         ) : (
//           <Text style={s.noAddressText}>No hay direcciones disponibles.</Text>
//         )}
//       </View>

//       {/* Cliente/Fecha */}
//       <View style={s.section}>
//         <Text style={s.label}>Cliente:</Text>
//         <Text>{userProfile?.displayName || user?.email}</Text>
//         <Text style={s.label}>Fecha:</Text>
//         <Text>{DateTime.local().toFormat("dd/MM/yyyy")}</Text>
//       </View>

//       {/* Pago */}
//       <View style={s.section}>
//         <Text style={s.label}>Pago:</Text>
//         <Text>Tarjeta ****1234</Text>
//       </View>

//       {/* Footer */}
//       <View style={s.footer}>
//         <Text style={s.total}>Total: {total.toFixed(2)}¥</Text>
//         <Button
//           title={loading ? "Enviando..." : "Pagar"}
//           onPress={() => {
//             const itemsForOrder = cart.map((i) => ({
//               id: i.product.id,
//               name: i.product.name,
//               price: i.product.price,
//               quantity: i.quantity,
//               imageUrl: i.product.image,
//             }));
//             // Navegamos a PaymentMethodsScreen pasándole items y total
//             navigation.navigate("PaymentMethods", {
//               items: itemsForOrder,
//               total: total,
//               selectedAddress: selectedAddress,
//             });
//           }}
//           disabled={
//             loading ||
//             cart.length === 0 ||
//             !selectedAddress ||
//             currentOrderId !== null
//           }
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 10,
//     paddingTop: 10,
//     backgroundColor: "#fff",
//   },
//   itemRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   details: {
//     flex: 1,
//     marginLeft: 10,
//   },
//   title: {
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   price: {
//     marginBottom: 8,
//   },
//   quantityRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   qtyControls: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   qtyBtn: {
//     fontSize: 18,
//     width: 28,
//     textAlign: "center",
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 4,
//   },
//   qtyText: {
//     marginHorizontal: 8,
//     minWidth: 24,
//     textAlign: "center",
//   },
//   deleteButton: {
//     padding: 6,
//     borderRadius: 4,
//   },

//   status: {
//     textAlign: "center",
//     marginVertical: 8,
//     padding: 8,
//     borderRadius: 4,
//     fontWeight: "bold",
//   },

//   pending: {
//     backgroundColor: "#fdecea",
//     color: "#d32f2f",
//   },
//   accepted: {
//     backgroundColor: "#e8f5e9",
//     color: "#388e3c",
//   },
//   itemContainer: {
//     marginHorizontal: Platform.OS === "ios" ? 10 : 0,
//     backgroundColor: "#f5f5f5", // un gris muy claro
//     borderRadius: 12, // bordes suaves
//     padding: 10, // espacio interior
//     marginBottom: 8, // separación entre ítems
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     flexWrap: "wrap",
//   },
//   img: {
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//     margin: 12,
//   },
//   info: {
//     flex: 1,
//     flexShrink: 1, // <-- puede encogerse si hace falta
//     marginRight: 8,
//     justifyContent: "center",
//   },
//   name: {
//     fontWeight: "bold",
//     marginBottom: 4,
//     flexShrink: 1, // <-- el propio Text puede encogerse
//   },
//   qty: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginHorizontal: 12,
//   },
//   qtyBtn: {
//     fontSize: 18,
//     width: 28,
//     textAlign: "center",
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 4,
//   },
//   qtyText: {
//     marginHorizontal: 8,
//     minWidth: 24,
//     textAlign: "center",
//   },
//   actions: {
//     alignItems: "flex-end",
//     justifyContent: "space-between",
//     height: 80,
//     paddingRight: 10,
//   },
//   acceptButton: {
//     minWidth: 80, // ancho mínimo suficiente para “Aceptado”
//     alignItems: "center", // centra horizontalmente el texto
//   },
//   acceptText: {
//     borderWidth: 1,
//     borderColor: "#1565c0",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 4,
//     color: "#1565c0",
//     textAlign: "center",
//   },
//   acceptedText: {
//     backgroundColor: "#1565c0",
//     color: "#fff",
//   },
//   deleteButton: {
//     padding: 6,
//     borderRadius: 6,
//   },
//   accept: {
//     marginTop: 8,
//     textAlign: "center",
//     borderWidth: 1,
//     borderColor: "#1565c0",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 4,
//     color: "#1565c0",
//   },
//   acceptedBtn: {
//     backgroundColor: "#1565c0",
//     color: "#fff",
//   },
//   section: {
//     margin: 10,
//   },
//   label: {
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   footer: {
//     borderTopWidth: 1,
//     borderColor: "#eee",
//     paddingTop: 12,
//     alignItems: "center",
//   },
//   total: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 8,
//   },
//   emptyCartContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 50,
//   },
//   emptyCartText: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#555",
//     marginBottom: 8,
//   },
//   emptyCartSubtext: {
//     fontSize: 16,
//     color: "#777",
//     textAlign: "center",
//   },
//   noAddressText: {
//     fontSize: 15,
//     color: "#d32f2f",
//     marginTop: 8,
//     textAlign: "center",
//   },
//   selectedAddressDetails: {
//     marginTop: 10,
//     padding: 15,
//     backgroundColor: "#f8f8f8",
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   addressDetailText: {
//     fontSize: 15,
//     color: "#333",
//     lineHeight: 22,
//   },
//   orderInProgressContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 50,
//     backgroundColor: "#e3f2fd",
//     borderRadius: 10,
//     marginTop: 20,
//   },
//   orderInProgressText: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#1565c0",
//     marginBottom: 8,
//   },
//   orderInProgressSubtext: {
//     fontSize: 16,
//     color: "#42a5f5",
//     textAlign: "center",
//   },
// });

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
// ✅ FIX espacio arriba: usamos edges para no duplicar el safe area del header de navegación
import { SafeAreaView } from "react-native-safe-area-context";
import { DateTime } from "luxon";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { addressService } from "../../services/addressService";
import { termsConditionsService } from "../../services/termsConditionsService";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const LAST_ORDER_ID_KEY = "@lastOrderId";

const STATUS_LABELS = {
  pending: {
    text: "⏳ Esperando aceptación",
    sub: "Tu pedido está siendo revisado",
    bg: "#fff8e1",
    color: "#e65100",
  },
  accepted: {
    text: "✅ Pedido aceptado",
    sub: "El negocio confirmó tu pedido",
    bg: "#e8f5e9",
    color: "#2e7d32",
  },
  rejected: {
    text: "❌ Pedido rechazado",
    sub: "Contacta al negocio para más info",
    bg: "#fdecea",
    color: "#c62828",
  },
};

// ─── Precio con descuento ──────────────────────────────────────────────────
// El producto trae: price (precio base) y discount (porcentaje, ej: 20)
function getDiscountedPrice(product) {
  if (!product.discount || product.discount <= 0) return null;
  return product.price * (1 - product.discount / 100);
}

// ─── Tarjeta de producto ───────────────────────────────────────────────────
function CartItem({ item, onRemove, onDecrease, onIncrease }) {
  const { product, quantity } = item;
  const discountedPrice = getDiscountedPrice(product);
  const hasDiscount = discountedPrice !== null;

  return (
    <View style={s.card}>
      <Image source={{ uri: product.image }} style={s.img} />
      <View style={s.cardBody}>
        <Text style={s.itemName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Precio: original tachado + precio con descuento destacado */}
        <View style={s.priceRow}>
          {hasDiscount ? (
            <>
              <Text style={s.originalPrice}>{product.price.toFixed(2)} ¥</Text>
              <View style={s.discountBadge}>
                <Text style={s.discountPct}>-{product.discount}%</Text>
              </View>
              <Text style={s.discountedPrice}>
                {discountedPrice.toFixed(2)} ¥
              </Text>
            </>
          ) : (
            <Text style={s.normalPrice}>{product.price.toFixed(2)} ¥</Text>
          )}
        </View>

        {/* Controles de cantidad */}
        <View style={s.qtyRow}>
          <View style={s.qtyControls}>
            <TouchableOpacity onPress={onDecrease} style={s.qtyBtn}>
              <Text style={s.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.qtyNum}>{quantity}</Text>
            <TouchableOpacity onPress={onIncrease} style={s.qtyBtn}>
              <Text style={s.qtyBtnText}>＋</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onRemove} style={s.trashBtn}>
            <Ionicons name="trash-outline" size={20} color="#c62828" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────
export default function OrderScreen() {
  const { user, userProfile } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigation = useNavigation();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [latestTermsLastUpdated, setLatestTermsLastUpdated] = useState(null);

  // ✅ FIX datos del usuario: useFocusEffect recarga direcciones y perfil
  // cada vez que el usuario vuelve a esta pantalla (ej: después de editar dirección)
  const loadAddresses = useCallback(async () => {
    if (!user?.uid) return;
    setAddressLoading(true);
    try {
      const list = await addressService.getUserAddresses(user.uid);
      // Respetar selección previa si sigue existiendo, si no usar la default
      setSelectedAddress((prev) => {
        const stillExists = prev ? list.find((a) => a.id === prev.id) : null;
        return stillExists || list.find((a) => a.isDefault) || list[0] || null;
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar tus direcciones.");
    } finally {
      setAddressLoading(false);
    }
  }, [user?.uid]);

  // Recarga cuando la pantalla recibe el foco (vuelve de otra pantalla)
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses]),
  );

  // ── Restaurar pedido pendiente al montar ───────────────────────────────
  useEffect(() => {
    const restoreOrder = async () => {
      try {
        const storedId = await AsyncStorage.getItem(LAST_ORDER_ID_KEY);
        if (!storedId) return;
        const snap = await getDoc(doc(db, "orders", storedId));
        if (snap.exists() && snap.data().status === "pending") {
          setCurrentOrderId(storedId);
          setOrderStatus("pending");
        } else {
          await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
        }
      } catch (err) {
        console.error("Error leyendo último pedido:", err);
        await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
      }
    };
    restoreOrder();
  }, []);

  // ── Listener en tiempo real del pedido activo ──────────────────────────
  useEffect(() => {
    if (!currentOrderId || !user?.uid) return;
    const unsubscribe = onSnapshot(
      doc(db, "orders", currentOrderId),
      (docSnap) => {
        if (!docSnap.exists()) {
          clearOrderState();
          return;
        }
        const { status } = docSnap.data();
        if (status === "pending") {
          setOrderStatus("pending");
        } else if (status === "accepted") {
          setOrderStatus("accepted");
          setTimeout(clearOrderState, 3000);
        } else if (status === "rejected") {
          setOrderStatus("rejected");
          setTimeout(clearOrderState, 4000);
        } else {
          clearOrderState();
        }
      },
      (err) => {
        console.error(err);
        clearOrderState();
      },
    );
    return () => unsubscribe();
  }, [currentOrderId, user?.uid]);

  // ── Términos y condiciones ─────────────────────────────────────────────
  useEffect(() => {
    termsConditionsService
      .getTermsAndConditions()
      .then(({ lastUpdated }) => setLatestTermsLastUpdated(lastUpdated))
      .catch(console.error);
  }, []);

  const clearOrderState = useCallback(async () => {
    setCurrentOrderId(null);
    setOrderStatus(null);
    await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
  }, []);

  // ── Total considerando descuentos ──────────────────────────────────────
  const total = cart.reduce((sum, i) => {
    const price = getDiscountedPrice(i.product) ?? i.product.price;
    return sum + price * i.quantity;
  }, 0);

  // ── Ir a pagar ─────────────────────────────────────────────────────────
  const handleGoToPayment = () => {
    const acceptedAt = userProfile?.termsAcceptedAt?.toDate();
    if (
      !acceptedAt ||
      !latestTermsLastUpdated ||
      acceptedAt.getTime() < latestTermsLastUpdated.getTime()
    ) {
      return Alert.alert(
        "Aviso Importante",
        "Debes aceptar la última versión de los Términos y Condiciones.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Ir a Términos",
            onPress: () => navigation.navigate("TermsConditions"),
          },
        ],
      );
    }
    if (!selectedAddress) {
      return Alert.alert(
        "Elige una dirección",
        "Selecciona una antes de continuar.",
      );
    }
    const itemsForOrder = cart.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: getDiscountedPrice(i.product) ?? i.product.price, // precio final con descuento
      quantity: i.quantity,
      imageUrl: i.product.image,
    }));
    navigation.navigate("PaymentMethods", {
      items: itemsForOrder,
      total,
      selectedAddress,
    });
  };

  const payDisabled =
    loading ||
    cart.length === 0 ||
    !selectedAddress ||
    orderStatus === "pending";

  // ── Nombre actualizado del usuario ────────────────────────────────────
  // userProfile viene del contexto Auth y se actualiza en tiempo real
  const displayName =
    userProfile?.displayName ||
    userProfile?.name ||
    user?.displayName ||
    user?.email;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    // ✅ FIX espacio: con headerShown:false el navegador no protege el área
    // superior, por eso necesitamos edges=["top","bottom"] explícitamente
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      {/* ── Banner de estado ── */}
      {orderStatus && STATUS_LABELS[orderStatus] && (
        <View
          style={[
            s.statusBanner,
            { backgroundColor: STATUS_LABELS[orderStatus].bg },
          ]}
        >
          <Text
            style={[s.statusText, { color: STATUS_LABELS[orderStatus].color }]}
          >
            {STATUS_LABELS[orderStatus].text}
          </Text>
          <Text
            style={[s.statusSub, { color: STATUS_LABELS[orderStatus].color }]}
          >
            {STATUS_LABELS[orderStatus].sub}
          </Text>
        </View>
      )}

      {/* ── Carrito vacío ── */}
      {cart.length === 0 && !orderStatus && (
        <View style={s.emptyWrap}>
          <Ionicons name="cart-outline" size={72} color="#ddd" />
          <Text style={s.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={s.emptySub}>Agrega productos para hacer un pedido.</Text>
        </View>
      )}

      {/* ── Lista de productos ── */}
      {cart.length > 0 && (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.product.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <CartItem
              item={item}
              onRemove={() => removeFromCart(item.product.id)}
              onDecrease={() => {
                if (item.quantity - 1 <= 0) removeFromCart(item.product.id);
                else updateQuantity(item.product.id, item.quantity - 1);
              }}
              onIncrease={() =>
                updateQuantity(item.product.id, item.quantity + 1)
              }
            />
          )}
        />
      )}

      {/* ── Panel inferior ── */}
      <View style={s.bottomSheet}>
        {/* Dirección */}
        <View style={s.infoRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color="#1565c0"
            style={{ marginTop: 1 }}
          />
          <View style={s.infoBody}>
            <Text style={s.infoLabel}>Dirección de envío</Text>
            {addressLoading ? (
              <ActivityIndicator
                size="small"
                color="#1565c0"
                style={{ marginTop: 4 }}
              />
            ) : selectedAddress ? (
              <>
                {/* ✅ FIX: muestra el nombre actualizado desde Firestore, no el cacheado */}
                <Text style={s.infoValue} numberOfLines={1}>
                  {selectedAddress.fullName || displayName}
                </Text>
                <Text style={s.infoValue} numberOfLines={1}>
                  {selectedAddress.street}
                  {selectedAddress.number ? `, ${selectedAddress.number}` : ""}
                </Text>
                <Text style={s.infoValue} numberOfLines={1}>
                  {selectedAddress.city}
                  {selectedAddress.state ? `, ${selectedAddress.state}` : ""}
                  {selectedAddress.zipCode ? ` ${selectedAddress.zipCode}` : ""}
                </Text>
              </>
            ) : (
              <Text style={s.noAddress}>Sin dirección seleccionada</Text>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* Cliente y fecha */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Ionicons name="person-outline" size={14} color="#888" />
            <Text style={s.metaText} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <View style={s.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#888" />
            <Text style={s.metaText}>
              {DateTime.local().toFormat("dd/MM/yyyy")}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Total y botón */}
        <View style={s.footer}>
          <View>
            <Text style={s.totalLabel}>Total a pagar</Text>
            <Text style={s.totalAmount}>{total.toFixed(2)} ¥</Text>
          </View>
          <TouchableOpacity
            onPress={handleGoToPayment}
            disabled={payDisabled}
            style={[s.payBtn, payDisabled && s.payBtnDisabled]}
            activeOpacity={0.82}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={
                    orderStatus === "pending" ? "time-outline" : "card-outline"
                  }
                  size={18}
                  color={payDisabled ? "#aaa" : "#fff"}
                />
                <Text
                  style={[s.payBtnText, payDisabled && s.payBtnTextDisabled]}
                >
                  {orderStatus === "pending" ? "En proceso..." : "Ir a pagar"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },

  // Banner
  statusBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  statusText: { fontWeight: "700", fontSize: 14 },
  statusSub: { fontSize: 12, marginTop: 2, opacity: 0.85 },

  // Carrito vacío
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 30,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#444", marginTop: 14 },
  emptySub: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 30,
  },

  // Lista
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },

  // Tarjeta producto
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  img: {
    width: 76,
    height: 76,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  cardBody: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "space-between",
  },
  itemName: {
    fontWeight: "600",
    fontSize: 13,
    color: "#222",
    lineHeight: 18,
  },

  // Precios
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 3,
  },
  normalPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1565c0",
  },
  originalPrice: {
    fontSize: 12,
    color: "#aaa",
    textDecorationLine: "line-through",
  },
  discountedPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#c62828", // rojo destacado para el precio final
  },
  discountBadge: {
    backgroundColor: "#c62828",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  discountPct: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  // Cantidad
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 18, color: "#333", lineHeight: 22 },
  qtyNum: {
    minWidth: 26,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
    color: "#222",
  },
  trashBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#fdecea",
  },

  // Panel inferior
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoBody: {
    flex: 1,
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  noAddress: {
    fontSize: 13,
    color: "#c62828",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
    maxWidth: 160,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: "#aaa",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 1,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#1565c0",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: "#1565c0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  payBtnDisabled: {
    backgroundColor: "#e0e0e0",
    shadowOpacity: 0,
    elevation: 0,
  },
  payBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  payBtnTextDisabled: {
    color: "#aaa",
  },
});
