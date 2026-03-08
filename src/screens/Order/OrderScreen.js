// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   Alert,
//   ActivityIndicator,
//   Platform,
// } from "react-native";
// // ✅ FIX espacio arriba: usamos edges para no duplicar el safe area del header de navegación
// import { SafeAreaView } from "react-native-safe-area-context";
// import { DateTime } from "luxon";
// import { useAuth } from "../../context/AuthContext";
// import { useCart } from "../../context/CartContext";
// import { addressService } from "../../services/addressService";
// import { termsConditionsService } from "../../services/termsConditionsService";
// import { Ionicons } from "@expo/vector-icons";
// import { doc, onSnapshot, getDoc } from "firebase/firestore";
// import { db } from "../../firebase/firebaseConfig";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useNavigation, useFocusEffect } from "@react-navigation/native";

// const LAST_ORDER_ID_KEY = "@lastOrderId";

// const STATUS_LABELS = {
//   pending: {
//     text: "⏳ Esperando aceptación",
//     sub: "Tu pedido está siendo revisado",
//     bg: "#fff8e1",
//     color: "#e65100",
//   },
//   accepted: {
//     text: "✅ Pedido aceptado",
//     sub: "El negocio confirmó tu pedido",
//     bg: "#e8f5e9",
//     color: "#2e7d32",
//   },
//   rejected: {
//     text: "❌ Pedido rechazado",
//     sub: "Contacta al negocio para más info",
//     bg: "#fdecea",
//     color: "#c62828",
//   },
// };

// // ─── Precio con descuento ──────────────────────────────────────────────────
// // El producto trae: price (precio base) y discount (porcentaje, ej: 20)
// function getDiscountedPrice(product) {
//   if (!product.discount || product.discount <= 0) return null;
//   return product.price * (1 - product.discount / 100);
// }

// // ─── Tarjeta de producto ───────────────────────────────────────────────────
// function CartItem({ item, onRemove, onDecrease, onIncrease }) {
//   const { product, quantity } = item;
//   const discountedPrice = getDiscountedPrice(product);
//   const hasDiscount = discountedPrice !== null;

//   return (
//     <View style={s.card}>
//       <Image source={{ uri: product.image }} style={s.img} />
//       <View style={s.cardBody}>
//         <Text style={s.itemName} numberOfLines={2}>
//           {product.name}
//         </Text>

//         {/* Precio: original tachado + precio con descuento destacado */}
//         <View style={s.priceRow}>
//           {hasDiscount ? (
//             <>
//               <Text style={s.originalPrice}>{product.price.toFixed(2)} ¥</Text>
//               <View style={s.discountBadge}>
//                 <Text style={s.discountPct}>-{product.discount}%</Text>
//               </View>
//               <Text style={s.discountedPrice}>
//                 {discountedPrice.toFixed(2)} ¥
//               </Text>
//             </>
//           ) : (
//             <Text style={s.normalPrice}>{product.price.toFixed(2)} ¥</Text>
//           )}
//         </View>

//         {/* Controles de cantidad */}
//         <View style={s.qtyRow}>
//           <View style={s.qtyControls}>
//             <TouchableOpacity onPress={onDecrease} style={s.qtyBtn}>
//               <Text style={s.qtyBtnText}>−</Text>
//             </TouchableOpacity>
//             <Text style={s.qtyNum}>{quantity}</Text>
//             <TouchableOpacity onPress={onIncrease} style={s.qtyBtn}>
//               <Text style={s.qtyBtnText}>＋</Text>
//             </TouchableOpacity>
//           </View>
//           <TouchableOpacity onPress={onRemove} style={s.trashBtn}>
//             <Ionicons name="trash-outline" size={20} color="#c62828" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// }

// // ─── Pantalla principal ────────────────────────────────────────────────────
// export default function OrderScreen() {
//   const { user, userProfile } = useAuth();
//   const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
//   const navigation = useNavigation();

//   const [selectedAddress, setSelectedAddress] = useState(null);
//   const [currentOrderId, setCurrentOrderId] = useState(null);
//   const [orderStatus, setOrderStatus] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [addressLoading, setAddressLoading] = useState(true);
//   const [latestTermsLastUpdated, setLatestTermsLastUpdated] = useState(null);

//   // ✅ FIX datos del usuario: useFocusEffect recarga direcciones y perfil
//   // cada vez que el usuario vuelve a esta pantalla (ej: después de editar dirección)
//   const loadAddresses = useCallback(async () => {
//     if (!user?.uid) return;
//     setAddressLoading(true);
//     try {
//       const list = await addressService.getUserAddresses(user.uid);
//       // Respetar selección previa si sigue existiendo, si no usar la default
//       setSelectedAddress((prev) => {
//         const stillExists = prev ? list.find((a) => a.id === prev.id) : null;
//         return stillExists || list.find((a) => a.isDefault) || list[0] || null;
//       });
//     } catch (err) {
//       console.error(err);
//       Alert.alert("Error", "No se pudieron cargar tus direcciones.");
//     } finally {
//       setAddressLoading(false);
//     }
//   }, [user?.uid]);

//   // Recarga cuando la pantalla recibe el foco (vuelve de otra pantalla)
//   useFocusEffect(
//     useCallback(() => {
//       loadAddresses();
//     }, [loadAddresses]),
//   );

//   // ── Restaurar pedido pendiente al montar ───────────────────────────────
//   useEffect(() => {
//     const restoreOrder = async () => {
//       try {
//         const storedId = await AsyncStorage.getItem(LAST_ORDER_ID_KEY);
//         if (!storedId) return;
//         const snap = await getDoc(doc(db, "orders", storedId));
//         if (snap.exists() && snap.data().status === "pending") {
//           setCurrentOrderId(storedId);
//           setOrderStatus("pending");
//         } else {
//           await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
//         }
//       } catch (err) {
//         console.error("Error leyendo último pedido:", err);
//         await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
//       }
//     };
//     restoreOrder();
//   }, []);

//   // ── Listener en tiempo real del pedido activo ──────────────────────────
//   useEffect(() => {
//     if (!currentOrderId || !user?.uid) return;
//     const unsubscribe = onSnapshot(
//       doc(db, "orders", currentOrderId),
//       (docSnap) => {
//         if (!docSnap.exists()) {
//           clearOrderState();
//           return;
//         }
//         const { status } = docSnap.data();
//         if (status === "pending") {
//           setOrderStatus("pending");
//         } else if (status === "accepted") {
//           setOrderStatus("accepted");
//           setTimeout(clearOrderState, 3000);
//         } else if (status === "rejected") {
//           setOrderStatus("rejected");
//           setTimeout(clearOrderState, 4000);
//         } else {
//           clearOrderState();
//         }
//       },
//       (err) => {
//         console.error(err);
//         clearOrderState();
//       },
//     );
//     return () => unsubscribe();
//   }, [currentOrderId, user?.uid]);

//   // ── Términos y condiciones ─────────────────────────────────────────────
//   useEffect(() => {
//     termsConditionsService
//       .getTermsAndConditions()
//       .then(({ lastUpdated }) => setLatestTermsLastUpdated(lastUpdated))
//       .catch(console.error);
//   }, []);

//   const clearOrderState = useCallback(async () => {
//     setCurrentOrderId(null);
//     setOrderStatus(null);
//     await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
//   }, []);

//   // ── Total considerando descuentos ──────────────────────────────────────
//   const total = cart.reduce((sum, i) => {
//     const price = getDiscountedPrice(i.product) ?? i.product.price;
//     return sum + price * i.quantity;
//   }, 0);

//   // ── Ir a pagar ─────────────────────────────────────────────────────────
//   const handleGoToPayment = () => {
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
//       price: getDiscountedPrice(i.product) ?? i.product.price, // precio final con descuento
//       quantity: i.quantity,
//       imageUrl: i.product.image,
//     }));
//     navigation.navigate("PaymentMethods", {
//       items: itemsForOrder,
//       total,
//       selectedAddress,
//     });
//   };

//   const payDisabled =
//     loading ||
//     cart.length === 0 ||
//     !selectedAddress ||
//     orderStatus === "pending";

//   // ── Nombre actualizado del usuario ────────────────────────────────────
//   // userProfile viene del contexto Auth y se actualiza en tiempo real
//   const displayName =
//     userProfile?.displayName ||
//     userProfile?.name ||
//     user?.displayName ||
//     user?.email;

//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     // ✅ FIX espacio: con headerShown:false el navegador no protege el área
//     // superior, por eso necesitamos edges=["top","bottom"] explícitamente
//     <SafeAreaView style={s.container} edges={["top", "bottom"]}>
//       {/* ── Banner de estado ── */}
//       {orderStatus && STATUS_LABELS[orderStatus] && (
//         <View
//           style={[
//             s.statusBanner,
//             { backgroundColor: STATUS_LABELS[orderStatus].bg },
//           ]}
//         >
//           <Text
//             style={[s.statusText, { color: STATUS_LABELS[orderStatus].color }]}
//           >
//             {STATUS_LABELS[orderStatus].text}
//           </Text>
//           <Text
//             style={[s.statusSub, { color: STATUS_LABELS[orderStatus].color }]}
//           >
//             {STATUS_LABELS[orderStatus].sub}
//           </Text>
//         </View>
//       )}

//       {/* ── Carrito vacío ── */}
//       {cart.length === 0 && !orderStatus && (
//         <View style={s.emptyWrap}>
//           <Ionicons name="cart-outline" size={72} color="#ddd" />
//           <Text style={s.emptyTitle}>Tu carrito está vacío</Text>
//           <Text style={s.emptySub}>Agrega productos para hacer un pedido.</Text>
//         </View>
//       )}

//       {/* ── Lista de productos ── */}
//       {cart.length > 0 && (
//         <FlatList
//           data={cart}
//           keyExtractor={(item) => item.product.id}
//           contentContainerStyle={s.listContent}
//           renderItem={({ item }) => (
//             <CartItem
//               item={item}
//               onRemove={() => removeFromCart(item.product.id)}
//               onDecrease={() => {
//                 if (item.quantity - 1 <= 0) removeFromCart(item.product.id);
//                 else updateQuantity(item.product.id, item.quantity - 1);
//               }}
//               onIncrease={() =>
//                 updateQuantity(item.product.id, item.quantity + 1)
//               }
//             />
//           )}
//         />
//       )}

//       {/* ── Panel inferior ── */}
//       <View style={s.bottomSheet}>
//         {/* Dirección */}
//         <View style={s.infoRow}>
//           <Ionicons
//             name="location-outline"
//             size={18}
//             color="#1565c0"
//             style={{ marginTop: 1 }}
//           />
//           <View style={s.infoBody}>
//             <Text style={s.infoLabel}>Dirección de envío</Text>
//             {addressLoading ? (
//               <ActivityIndicator
//                 size="small"
//                 color="#1565c0"
//                 style={{ marginTop: 4 }}
//               />
//             ) : selectedAddress ? (
//               <>
//                 {/* ✅ FIX: muestra el nombre actualizado desde Firestore, no el cacheado */}
//                 <Text style={s.infoValue} numberOfLines={1}>
//                   {selectedAddress.fullName || displayName}
//                 </Text>
//                 <Text style={s.infoValue} numberOfLines={1}>
//                   {selectedAddress.street}
//                   {selectedAddress.number ? `, ${selectedAddress.number}` : ""}
//                 </Text>
//                 <Text style={s.infoValue} numberOfLines={1}>
//                   {selectedAddress.city}
//                   {selectedAddress.state ? `, ${selectedAddress.state}` : ""}
//                   {selectedAddress.zipCode ? ` ${selectedAddress.zipCode}` : ""}
//                 </Text>
//               </>
//             ) : (
//               <Text style={s.noAddress}>Sin dirección seleccionada</Text>
//             )}
//           </View>
//         </View>

//         <View style={s.divider} />

//         {/* Cliente y fecha */}
//         <View style={s.metaRow}>
//           <View style={s.metaItem}>
//             <Ionicons name="person-outline" size={14} color="#888" />
//             <Text style={s.metaText} numberOfLines={1}>
//               {displayName}
//             </Text>
//           </View>
//           <View style={s.metaItem}>
//             <Ionicons name="calendar-outline" size={14} color="#888" />
//             <Text style={s.metaText}>
//               {DateTime.local().toFormat("dd/MM/yyyy")}
//             </Text>
//           </View>
//         </View>

//         <View style={s.divider} />

//         {/* Total y botón */}
//         <View style={s.footer}>
//           <View>
//             <Text style={s.totalLabel}>Total a pagar</Text>
//             <Text style={s.totalAmount}>{total.toFixed(2)} ¥</Text>
//           </View>
//           <TouchableOpacity
//             onPress={handleGoToPayment}
//             disabled={payDisabled}
//             style={[s.payBtn, payDisabled && s.payBtnDisabled]}
//             activeOpacity={0.82}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" size="small" />
//             ) : (
//               <>
//                 <Ionicons
//                   name={
//                     orderStatus === "pending" ? "time-outline" : "card-outline"
//                   }
//                   size={18}
//                   color={payDisabled ? "#aaa" : "#fff"}
//                 />
//                 <Text
//                   style={[s.payBtnText, payDisabled && s.payBtnTextDisabled]}
//                 >
//                   {orderStatus === "pending" ? "En proceso..." : "Ir a pagar"}
//                 </Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// // ─── Estilos ───────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f6fa",
//   },

//   // Banner
//   statusBanner: {
//     marginHorizontal: 12,
//     marginTop: 8,
//     marginBottom: 4,
//     borderRadius: 10,
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//     alignItems: "center",
//   },
//   statusText: { fontWeight: "700", fontSize: 14 },
//   statusSub: { fontSize: 12, marginTop: 2, opacity: 0.85 },

//   // Carrito vacío
//   emptyWrap: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingBottom: 30,
//   },
//   emptyTitle: { fontSize: 18, fontWeight: "700", color: "#444", marginTop: 14 },
//   emptySub: {
//     fontSize: 13,
//     color: "#aaa",
//     marginTop: 6,
//     textAlign: "center",
//     paddingHorizontal: 30,
//   },

//   // Lista
//   listContent: {
//     paddingHorizontal: 12,
//     paddingTop: 10,
//     paddingBottom: 6,
//   },

//   // Tarjeta producto
//   card: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     marginBottom: 8,
//     padding: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.07,
//     shadowRadius: 3,
//     elevation: 2,
//     borderWidth: 1,
//     borderColor: "#ececec",
//   },
//   img: {
//     width: 76,
//     height: 76,
//     borderRadius: 8,
//     backgroundColor: "#f0f0f0",
//   },
//   cardBody: {
//     flex: 1,
//     marginLeft: 10,
//     justifyContent: "space-between",
//   },
//   itemName: {
//     fontWeight: "600",
//     fontSize: 13,
//     color: "#222",
//     lineHeight: 18,
//   },

//   // Precios
//   priceRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     flexWrap: "wrap",
//     gap: 5,
//     marginTop: 3,
//   },
//   normalPrice: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#1565c0",
//   },
//   originalPrice: {
//     fontSize: 12,
//     color: "#aaa",
//     textDecorationLine: "line-through",
//   },
//   discountedPrice: {
//     fontSize: 15,
//     fontWeight: "800",
//     color: "#c62828", // rojo destacado para el precio final
//   },
//   discountBadge: {
//     backgroundColor: "#c62828",
//     borderRadius: 4,
//     paddingHorizontal: 5,
//     paddingVertical: 1,
//   },
//   discountPct: {
//     fontSize: 10,
//     fontWeight: "700",
//     color: "#fff",
//   },

//   // Cantidad
//   qtyRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginTop: 6,
//   },
//   qtyControls: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f0f0f0",
//     borderRadius: 8,
//     paddingHorizontal: 2,
//   },
//   qtyBtn: {
//     width: 30,
//     height: 30,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   qtyBtnText: { fontSize: 18, color: "#333", lineHeight: 22 },
//   qtyNum: {
//     minWidth: 26,
//     textAlign: "center",
//     fontWeight: "700",
//     fontSize: 14,
//     color: "#222",
//   },
//   trashBtn: {
//     padding: 6,
//     borderRadius: 8,
//     backgroundColor: "#fdecea",
//   },

//   // Panel inferior
//   bottomSheet: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 18,
//     borderTopRightRadius: 18,
//     paddingHorizontal: 16,
//     paddingTop: 14,
//     paddingBottom: Platform.OS === "ios" ? 24 : 14,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 6,
//     elevation: 10,
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//   },
//   infoBody: {
//     flex: 1,
//     marginLeft: 8,
//   },
//   infoLabel: {
//     fontSize: 10,
//     fontWeight: "700",
//     color: "#aaa",
//     textTransform: "uppercase",
//     letterSpacing: 0.6,
//     marginBottom: 3,
//   },
//   infoValue: {
//     fontSize: 13,
//     color: "#333",
//     lineHeight: 18,
//   },
//   noAddress: {
//     fontSize: 13,
//     color: "#c62828",
//     marginTop: 2,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#f0f0f0",
//     marginVertical: 10,
//   },
//   metaRow: {
//     flexDirection: "row",
//     gap: 16,
//   },
//   metaItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//   },
//   metaText: {
//     fontSize: 12,
//     color: "#666",
//     maxWidth: 160,
//   },
//   footer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginTop: 4,
//   },
//   totalLabel: {
//     fontSize: 11,
//     color: "#aaa",
//     fontWeight: "600",
//     textTransform: "uppercase",
//     letterSpacing: 0.4,
//   },
//   totalAmount: {
//     fontSize: 22,
//     fontWeight: "800",
//     color: "#1a1a1a",
//     marginTop: 1,
//   },
//   payBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 7,
//     backgroundColor: "#1565c0",
//     paddingHorizontal: 22,
//     paddingVertical: 13,
//     borderRadius: 14,
//     shadowColor: "#1565c0",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.28,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   payBtnDisabled: {
//     backgroundColor: "#e0e0e0",
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   payBtnText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 15,
//   },
//   payBtnTextDisabled: {
//     color: "#aaa",
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

// ─── Banners de estado del pedido ─────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    icon: "time-outline",
    title: "⏳ Esperando confirmación",
    sub: "Tu pedido está siendo revisado por el negocio",
    bg: "#fff8e1",
    border: "#ffe082",
    color: "#e65100",
    iconBg: "#fff3cd",
  },
  paid: {
    icon: "card-outline",
    title: "💳 Pago recibido",
    sub: "Tu pago fue procesado. Esperando confirmación del negocio",
    bg: "#e3f2fd",
    border: "#90caf9",
    color: "#1565c0",
    iconBg: "#dbeafe",
  },
  accepted: {
    icon: "checkmark-circle-outline",
    title: "🎉 ¡Pedido confirmado!",
    sub: "¡Gracias por tu compra! El negocio ya está preparando tu pedido.",
    bg: "#e8f5e9",
    border: "#a5d6a7",
    color: "#2e7d32",
    iconBg: "#dcfce7",
  },
  rejected: {
    icon: "close-circle-outline",
    title: "❌ Pedido rechazado",
    sub: "Lo sentimos, el negocio no pudo procesar tu pedido. Contactanos para más info.",
    bg: "#fdecea",
    border: "#ef9a9a",
    color: "#c62828",
    iconBg: "#fee2e2",
  },
};

// ─── Precio con descuento ──────────────────────────────────────────────────
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

// ─── Banner de estado ──────────────────────────────────────────────────────
function StatusBanner({ status, onDismiss }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;

  return (
    <View
      style={[
        s.statusBanner,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
      ]}
    >
      <View style={[s.statusIconWrap, { backgroundColor: cfg.iconBg }]}>
        <Ionicons name={cfg.icon} size={28} color={cfg.color} />
      </View>
      <View style={s.statusTextWrap}>
        <Text style={[s.statusTitle, { color: cfg.color }]}>{cfg.title}</Text>
        <Text style={[s.statusSub, { color: cfg.color }]}>{cfg.sub}</Text>
      </View>
      {/* Botón cerrar solo para accepted y rejected (el estado ya fue procesado) */}
      {(status === "accepted" || status === "rejected") && (
        <TouchableOpacity onPress={onDismiss} style={s.statusClose}>
          <Ionicons name="close" size={18} color={cfg.color} />
        </TouchableOpacity>
      )}
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

  // ── Cargar direcciones al enfocar ──────────────────────────────────────
  const loadAddresses = useCallback(async () => {
    if (!user?.uid) return;
    setAddressLoading(true);
    try {
      const list = await addressService.getUserAddresses(user.uid);
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
        if (snap.exists()) {
          const status = snap.data().status;
          // Restaurar si está pendiente o pagado (esperando admin)
          if (status === "pending" || status === "paid") {
            setCurrentOrderId(storedId);
            setOrderStatus(status);
          } else {
            await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
          }
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

  // ── Listener en tiempo real ────────────────────────────────────────────
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

        if (status === "pending" || status === "paid") {
          setOrderStatus(status);
        } else if (status === "accepted") {
          // ✅ Mostrar banner de agradecimiento — se cierra manualmente o en 6s
          setOrderStatus("accepted");
          setTimeout(clearOrderState, 6000);
        } else if (status === "rejected") {
          setOrderStatus("rejected");
          setTimeout(clearOrderState, 6000);
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

  // ── Términos ───────────────────────────────────────────────────────────
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

  // ── Total con descuentos ───────────────────────────────────────────────
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
      price: getDiscountedPrice(i.product) ?? i.product.price,
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
    orderStatus === "pending" ||
    orderStatus === "paid";

  const displayName =
    userProfile?.displayName ||
    userProfile?.name ||
    user?.displayName ||
    user?.email;

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      {/* ── Banner de estado ── */}
      {orderStatus && (
        <StatusBanner status={orderStatus} onDismiss={clearOrderState} />
      )}

      {/* ── Carrito vacío ── */}
      {cart.length === 0 && !orderStatus && (
        <View style={s.emptyWrap}>
          <Ionicons name="cart-outline" size={72} color="#ddd" />
          <Text style={s.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={s.emptySub}>Agrega productos para hacer un pedido.</Text>
        </View>
      )}

      {/* Carrito vacío pero hay un pedido en proceso */}
      {cart.length === 0 && orderStatus && (
        <View style={s.emptyWrap}>
          <Ionicons name="receipt-outline" size={56} color="#ddd" />
          <Text style={s.emptyTitle}>Pedido en proceso</Text>
          <Text style={s.emptySub}>
            Te avisaremos cuando el negocio confirme tu pedido.
          </Text>
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
                    payDisabled && orderStatus ? "time-outline" : "card-outline"
                  }
                  size={18}
                  color={payDisabled ? "#aaa" : "#fff"}
                />
                <Text
                  style={[s.payBtnText, payDisabled && s.payBtnTextDisabled]}
                >
                  {orderStatus === "pending" || orderStatus === "paid"
                    ? "En proceso..."
                    : "Ir a pagar"}
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
  container: { flex: 1, backgroundColor: "#f5f6fa" },

  // ── Banner de estado ──────────────────────────────────────────────────
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusTextWrap: { flex: 1 },
  statusTitle: { fontWeight: "700", fontSize: 14, lineHeight: 20 },
  statusSub: { fontSize: 12, marginTop: 3, opacity: 0.85, lineHeight: 17 },
  statusClose: {
    padding: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  // ── Carrito vacío ─────────────────────────────────────────────────────
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

  // ── Lista ─────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },

  // ── Tarjeta producto ──────────────────────────────────────────────────
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
  img: { width: 76, height: 76, borderRadius: 8, backgroundColor: "#f0f0f0" },
  cardBody: { flex: 1, marginLeft: 10, justifyContent: "space-between" },
  itemName: { fontWeight: "600", fontSize: 13, color: "#222", lineHeight: 18 },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 3,
  },
  normalPrice: { fontSize: 14, fontWeight: "700", color: "#1565c0" },
  originalPrice: {
    fontSize: 12,
    color: "#aaa",
    textDecorationLine: "line-through",
  },
  discountedPrice: { fontSize: 15, fontWeight: "800", color: "#c62828" },
  discountBadge: {
    backgroundColor: "#c62828",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  discountPct: { fontSize: 10, fontWeight: "700", color: "#fff" },

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
  trashBtn: { padding: 6, borderRadius: 8, backgroundColor: "#fdecea" },

  // ── Panel inferior ────────────────────────────────────────────────────
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
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  infoBody: { flex: 1, marginLeft: 8 },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  infoValue: { fontSize: 13, color: "#333", lineHeight: 18 },
  noAddress: { fontSize: 13, color: "#c62828", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 },

  metaRow: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#666", maxWidth: 160 },

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
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  payBtnTextDisabled: { color: "#aaa" },
});
