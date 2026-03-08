// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import {
//   initPaymentSheet,
//   presentPaymentSheet,
// } from "@stripe/stripe-react-native";
// import { useAuth } from "../../context/AuthContext";
// import { orderService } from "../../services/orderService";
// import { useCart } from "../../context/CartContext";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const LAST_ORDER_ID_KEY = "@lastOrderId";

// export default function PaymentMethodsScreen({ route, navigation }) {
//   const { items = [], total = 0, selectedAddress = null } = route?.params ?? {};
//   const [paymentMethod, setPaymentMethod] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const { user, userProfile } = useAuth();
//   const { clearCart } = useCart();

//   const fetchPaymentSheetParams = async () => {
//     try {
//       const response = await fetch(
//         "https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             amount: Math.round(total * 100),
//             customerId: userProfile?.stripeCustomerId,
//           }),
//         },
//       );
//       const { paymentIntent, ephemeralKey, customer } = await response.json();
//       return { paymentIntent, ephemeralKey, customer };
//     } catch (error) {
//       console.error(error);
//       Alert.alert("Error", "No se pudo iniciar el pago.");
//       return null;
//     }
//   };

//   // Función para crear la orden en Firestore
//   const createOrder = async (paymentMethodType, paymentIntentId = null) => {
//     try {
//       const orderData = {
//         userId: user.uid,
//         userName: userProfile?.displayName || user.displayName || user.email,
//         userEmail: user.email,
//         items: items,
//         address: selectedAddress,
//         paymentMethod: paymentMethodType,
//         totalAmount: total,
//         status: paymentMethodType === "card" ? "paid" : "pending",
//         createdAt: new Date(),
//       };

//       // Si es pago con tarjeta, agregar el paymentIntentId
//       if (paymentIntentId) {
//         orderData.paymentIntentId = paymentIntentId;
//       }

//       const orderRef = await orderService.createOrder(orderData);

//       // Guardar el ID de la orden
//       await AsyncStorage.setItem(LAST_ORDER_ID_KEY, orderRef.id);

//       // Limpiar el carrito
//       clearCart();

//       return orderRef;
//     } catch (error) {
//       console.error("Error al crear orden:", error);
//       throw error;
//     }
//   };

//   const startStripePayment = async () => {
//     setLoading(true);
//     const params = await fetchPaymentSheetParams();
//     if (!params) {
//       setLoading(false);
//       return;
//     }

//     const { error: initError } = await initPaymentSheet({
//       merchantDisplayName: "Tu Tienda",
//       paymentIntentClientSecret: params.paymentIntent,
//       customerId: params.customer,
//       customerEphemeralKeySecret: params.ephemeralKey,
//       allowsDelayedPaymentMethods: true,
//     });

//     if (initError) {
//       console.error(initError);
//       setLoading(false);
//       return Alert.alert("Error", "No se pudo mostrar el formulario de pago.");
//     }

//     const { error: presentError } = await presentPaymentSheet();

//     if (presentError) {
//       setLoading(false);
//       return Alert.alert("Pago fallido", presentError.message);
//     }

//     // Pago exitoso - crear orden
//     try {
//       await createOrder("card", params.paymentIntent);
//       Alert.alert("✅ Pago exitoso", "¡Gracias por tu compra!", [
//         {
//           text: "OK",
//           onPress: () => navigation.navigate("Tabs", { screen: "Home" }),
//         },
//       ]);
//     } catch (error) {
//       Alert.alert("Error", "Ocurrió un error guardando tu pedido.");
//     }

//     setLoading(false);
//   };

//   const handleCODPayment = async () => {
//     setLoading(true);
//     try {
//       await createOrder("cod");
//       Alert.alert(
//         "✅ Pedido confirmado",
//         "Tu pedido ha sido registrado. Pagarás al recibir el producto.",
//         [
//           {
//             text: "OK",
//             onPress: () => navigation.navigate("Tabs", { screen: "Home" }),
//           },
//         ],
//       );
//     } catch (error) {
//       Alert.alert("Error", "No se pudo crear el pedido. Inténtalo de nuevo.");
//     }
//     setLoading(false);
//   };

//   const handlePayPalPayment = async () => {
//     // Por ahora, tratarlo como pendiente
//     setLoading(true);
//     try {
//       await createOrder("paypal");
//       Alert.alert(
//         "✅ Pedido confirmado",
//         "Tu pedido ha sido registrado. Completa el pago con PayPal.",
//         [
//           {
//             text: "OK",
//             onPress: () => navigation.navigate("Tabs", { screen: "Home" }),
//           },
//         ],
//       );
//     } catch (error) {
//       Alert.alert("Error", "No se pudo crear el pedido. Inténtalo de nuevo.");
//     }
//     setLoading(false);
//   };

//   const handleSave = () => {
//     if (!paymentMethod) return;

//     if (paymentMethod === "card") {
//       return startStripePayment();
//     }

//     if (paymentMethod === "cod") {
//       return handleCODPayment();
//     }

//     if (paymentMethod === "paypal") {
//       return handlePayPalPayment();
//     }
//   };

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <View style={styles.container}>
//         <Text style={styles.title}>Selecciona un método de pago</Text>

//         <TouchableOpacity
//           style={styles.option}
//           onPress={() => setPaymentMethod("card")}
//           disabled={loading}
//         >
//           <Ionicons name="card-outline" size={24} />
//           <Text style={styles.optionText}>Tarjeta de crédito o débito</Text>
//           {paymentMethod === "card" && (
//             <Ionicons name="checkmark" size={20} color="green" />
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.option}
//           onPress={() => setPaymentMethod("cod")}
//           disabled={loading}
//         >
//           <Ionicons name="cash-outline" size={24} />
//           <Text style={styles.optionText}>Pago contra entrega</Text>
//           {paymentMethod === "cod" && (
//             <Ionicons name="checkmark" size={20} color="green" />
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.option}
//           onPress={() => setPaymentMethod("paypal")}
//           disabled={loading}
//         >
//           <Ionicons name="logo-paypal" size={24} color="#003087" />
//           <Text style={styles.optionText}>PayPal</Text>
//           {paymentMethod === "paypal" && (
//             <Ionicons name="checkmark" size={20} color="green" />
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[
//             styles.saveButton,
//             (!paymentMethod || loading) && { opacity: 0.5 },
//           ]}
//           onPress={handleSave}
//           disabled={!paymentMethod || loading}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.saveButtonText}>
//               {paymentMethod === "card"
//                 ? "Pagar con tarjeta"
//                 : paymentMethod === "cod"
//                   ? "Confirmar pedido (Pago contra entrega)"
//                   : "Confirmar pedido"}
//             </Text>
//           )}
//         </TouchableOpacity>

//         {/* Mostrar total */}
//         <View style={styles.totalContainer}>
//           <Text style={styles.totalLabel}>Total a pagar:</Text>
//           <Text style={styles.totalAmount}>¥{total.toFixed(2)}</Text>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20, flex: 1, backgroundColor: "#fff" },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
//   option: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 15,
//     padding: 15,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     borderRadius: 8,
//   },
//   optionText: { fontSize: 16, marginLeft: 12, flex: 1 },
//   saveButton: {
//     marginTop: 30,
//     backgroundColor: "#055F68",
//     paddingVertical: 14,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   saveButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   totalContainer: {
//     marginTop: 20,
//     padding: 15,
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   totalLabel: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   totalAmount: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#055F68",
//   },
// });

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import {
//   initPaymentSheet,
//   presentPaymentSheet,
// } from "@stripe/stripe-react-native";
// import { useAuth } from "../../context/AuthContext";
// import { orderService } from "../../services/orderService";
// import { useCart } from "../../context/CartContext";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const LAST_ORDER_ID_KEY = "@lastOrderId";

// export default function PaymentMethodsScreen({ route, navigation }) {
//   const { items = [], total = 0, selectedAddress = null } = route?.params ?? {};

//   const [paymentMethod, setPaymentMethod] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const { user, userProfile } = useAuth();
//   const { clearCart } = useCart();

//   // Sin datos válidos → pantalla de error amigable
//   if (!route?.params?.items || route.params.items.length === 0) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <Ionicons name="alert-circle-outline" size={52} color="#ccc" />
//         <Text style={styles.errorTitle}>Sin datos del pedido</Text>
//         <Text style={styles.errorSub}>
//           Volvé al carrito y tocá "Ir a pagar" para continuar.
//         </Text>
//         <TouchableOpacity
//           style={styles.backBtn}
//           onPress={() => navigation.goBack()}
//         >
//           <Text style={styles.backBtnText}>← Volver al carrito</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   // ── Obtener params del Payment Sheet ────────────────────────────────────
//   const fetchPaymentSheetParams = async () => {
//     try {
//       const response = await fetch(
//         "https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             amount: Math.round(total), // JPY no usa centavos, es entero
//             customerId: userProfile?.stripeCustomerId ?? null,
//             userId: user?.uid ?? null, // ✅ para guardar el customerId en Firestore
//           }),
//         },
//       );
//       const data = await response.json();
//       if (data.error) throw new Error(data.error);
//       return data; // { paymentIntent, ephemeralKey, customer }
//     } catch (error) {
//       console.error("fetchPaymentSheetParams:", error);
//       Alert.alert("Error", "No se pudo iniciar el pago. Intenta de nuevo.");
//       return null;
//     }
//   };

//   // ── Crear pedido en Firestore ────────────────────────────────────────────
//   const createOrder = async (paymentMethodType, paymentIntentId = null) => {
//     const orderData = {
//       userId: user.uid,
//       userName: userProfile?.displayName || user.displayName || user.email,
//       userEmail: user.email,
//       items,
//       address: selectedAddress,
//       paymentMethod: paymentMethodType,
//       totalAmount: total,
//       status: paymentMethodType === "card" ? "paid" : "pending",
//       createdAt: new Date(),
//     };
//     if (paymentIntentId) orderData.paymentIntentId = paymentIntentId;

//     const orderRef = await orderService.createOrder(orderData);
//     await AsyncStorage.setItem(LAST_ORDER_ID_KEY, orderRef.id);
//     clearCart();
//     return orderRef;
//   };

//   // ── Pago con Stripe ──────────────────────────────────────────────────────
//   const startStripePayment = async () => {
//     setLoading(true);
//     const params = await fetchPaymentSheetParams();
//     if (!params) {
//       setLoading(false);
//       return;
//     }

//     const { error: initError } = await initPaymentSheet({
//       merchantDisplayName: "Tu Tienda",
//       paymentIntentClientSecret: params.paymentIntent,
//       customerId: params.customer,
//       customerEphemeralKeySecret: params.ephemeralKey,
//       allowsDelayedPaymentMethods: false,
//       // ✅ Permite al usuario guardar la tarjeta para futuras compras
//       savePaymentMethodOptInEnabled: true,
//     });

//     if (initError) {
//       setLoading(false);
//       return Alert.alert("Error", "No se pudo mostrar el formulario de pago.");
//     }

//     const { error: presentError } = await presentPaymentSheet();
//     if (presentError) {
//       setLoading(false);
//       // Cancelación no es un error — no mostrar alerta
//       if (presentError.code !== "Canceled") {
//         Alert.alert("Pago fallido", presentError.message);
//       }
//       return;
//     }

//     // Pago exitoso
//     try {
//       await createOrder("card", params.paymentIntent);
//       Alert.alert("✅ Pago exitoso", "¡Gracias por tu compra!", [
//         {
//           text: "OK",
//           onPress: () => navigation.navigate("Tabs", { screen: "Home" }),
//         },
//       ]);
//     } catch {
//       Alert.alert(
//         "Error",
//         "Pago procesado pero hubo un error guardando el pedido.",
//       );
//     }
//     setLoading(false);
//   };

//   // ── Pago contra entrega ──────────────────────────────────────────────────
//   const handleCODPayment = async () => {
//     setLoading(true);
//     try {
//       await createOrder("cod");
//       Alert.alert(
//         "✅ Pedido confirmado",
//         "Tu pedido ha sido registrado. Pagarás al recibir el producto.",
//         [
//           {
//             text: "OK",
//             onPress: () => navigation.navigate("Tabs", { screen: "Home" }),
//           },
//         ],
//       );
//     } catch {
//       Alert.alert("Error", "No se pudo crear el pedido. Inténtalo de nuevo.");
//     }
//     setLoading(false);
//   };

//   // ── PayPal (pendiente de implementación real) ────────────────────────────
//   const handlePayPalPayment = async () => {
//     setLoading(true);
//     try {
//       await createOrder("paypal");
//       Alert.alert(
//         "✅ Pedido confirmado",
//         "Tu pedido ha sido registrado. Completa el pago con PayPal.",
//         [
//           {
//             text: "OK",
//             onPress: () => navigation.navigate("Tabs", { screen: "Home" }),
//           },
//         ],
//       );
//     } catch {
//       Alert.alert("Error", "No se pudo crear el pedido. Inténtalo de nuevo.");
//     }
//     setLoading(false);
//   };

//   const handleSave = () => {
//     if (!paymentMethod) return;
//     if (paymentMethod === "card") return startStripePayment();
//     if (paymentMethod === "cod") return handleCODPayment();
//     if (paymentMethod === "paypal") return handlePayPalPayment();
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
//       <View style={styles.container}>
//         <Text style={styles.title}>Método de pago</Text>

//         {/* Tarjeta */}
//         <TouchableOpacity
//           style={[
//             styles.option,
//             paymentMethod === "card" && styles.optionSelected,
//           ]}
//           onPress={() => setPaymentMethod("card")}
//           disabled={loading}
//         >
//           <Ionicons
//             name="card-outline"
//             size={24}
//             color={paymentMethod === "card" ? "#1565c0" : "#444"}
//           />
//           <View style={{ flex: 1, marginLeft: 12 }}>
//             <Text style={styles.optionText}>Tarjeta de crédito o débito</Text>
//             <Text style={styles.optionSub}>
//               Visa, Mastercard, AMEX · tarjetas guardadas
//             </Text>
//           </View>
//           {paymentMethod === "card" && (
//             <Ionicons name="checkmark-circle" size={22} color="#1565c0" />
//           )}
//         </TouchableOpacity>

//         {/* Contra entrega */}
//         <TouchableOpacity
//           style={[
//             styles.option,
//             paymentMethod === "cod" && styles.optionSelected,
//           ]}
//           onPress={() => setPaymentMethod("cod")}
//           disabled={loading}
//         >
//           <Ionicons
//             name="cash-outline"
//             size={24}
//             color={paymentMethod === "cod" ? "#1565c0" : "#444"}
//           />
//           <View style={{ flex: 1, marginLeft: 12 }}>
//             <Text style={styles.optionText}>Pago contra entrega</Text>
//             <Text style={styles.optionSub}>Pagás en efectivo al recibir</Text>
//           </View>
//           {paymentMethod === "cod" && (
//             <Ionicons name="checkmark-circle" size={22} color="#1565c0" />
//           )}
//         </TouchableOpacity>

//         {/* PayPal */}
//         <TouchableOpacity
//           style={[
//             styles.option,
//             paymentMethod === "paypal" && styles.optionSelected,
//           ]}
//           onPress={() => setPaymentMethod("paypal")}
//           disabled={loading}
//         >
//           <Ionicons name="logo-paypal" size={24} color="#003087" />
//           <View style={{ flex: 1, marginLeft: 12 }}>
//             <Text style={styles.optionText}>PayPal</Text>
//             <Text style={styles.optionSub}>
//               Redirige a PayPal para completar
//             </Text>
//           </View>
//           {paymentMethod === "paypal" && (
//             <Ionicons name="checkmark-circle" size={22} color="#1565c0" />
//           )}
//         </TouchableOpacity>

//         {/* Total */}
//         <View style={styles.totalContainer}>
//           <Text style={styles.totalLabel}>Total a pagar</Text>
//           <Text style={styles.totalAmount}>
//             ¥{Math.round(total).toLocaleString()}
//           </Text>
//         </View>

//         {/* Botón confirmar */}
//         <TouchableOpacity
//           style={[
//             styles.saveButton,
//             (!paymentMethod || loading) && { opacity: 0.5 },
//           ]}
//           onPress={handleSave}
//           disabled={!paymentMethod || loading}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.saveButtonText}>
//               {paymentMethod === "card"
//                 ? "Pagar con tarjeta"
//                 : paymentMethod === "cod"
//                   ? "Confirmar (Contra entrega)"
//                   : "Confirmar pedido"}
//             </Text>
//           )}
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   errorContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 32,
//     backgroundColor: "#fff",
//   },
//   errorTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginTop: 14 },
//   errorSub: {
//     fontSize: 14,
//     color: "#888",
//     textAlign: "center",
//     marginTop: 8,
//     lineHeight: 20,
//   },
//   backBtn: {
//     marginTop: 24,
//     paddingVertical: 12,
//     paddingHorizontal: 28,
//     backgroundColor: "#055F68",
//     borderRadius: 10,
//   },
//   backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

//   container: { padding: 20, flex: 1, backgroundColor: "#fff" },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#111" },

//   option: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//     padding: 15,
//     borderWidth: 1.5,
//     borderColor: "#e0e0e0",
//     borderRadius: 12,
//     backgroundColor: "#fafafa",
//   },
//   optionSelected: { borderColor: "#1565c0", backgroundColor: "#eff6ff" },
//   optionText: { fontSize: 15, fontWeight: "600", color: "#222" },
//   optionSub: { fontSize: 12, color: "#888", marginTop: 2 },

//   totalContainer: {
//     marginTop: 24,
//     padding: 16,
//     backgroundColor: "#f5f5f5",
//     borderRadius: 12,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   totalLabel: { fontSize: 15, fontWeight: "600", color: "#555" },
//   totalAmount: { fontSize: 24, fontWeight: "800", color: "#055F68" },

//   saveButton: {
//     marginTop: 20,
//     backgroundColor: "#055F68",
//     paddingVertical: 15,
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
// });

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  initPaymentSheet,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import { useAuth } from "../../context/AuthContext";
import { orderService } from "../../services/orderService";
import { useCart } from "../../context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_ORDER_ID_KEY = "@lastOrderId";

export default function PaymentMethodsScreen({ route, navigation }) {
  const { items = [], total = 0, selectedAddress = null } = route?.params ?? {};

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, userProfile } = useAuth();
  const { clearCart } = useCart();

  // Sin datos válidos → pantalla de error amigable
  if (!route?.params?.items || route.params.items.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={52} color="#ccc" />
        <Text style={styles.errorTitle}>Sin datos del pedido</Text>
        <Text style={styles.errorSub}>
          Volvé al carrito y tocá "Ir a pagar" para continuar.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Volver al carrito</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Volver al carrito (tab Order) ────────────────────────────────────────
  // Usamos navigate al stack raíz del tab Order para que el banner de estado
  // sea visible inmediatamente después de confirmar el pedido
  const goBackToCart = () => {
    navigation.navigate("OrderMain");
  };

  // ── Obtener params del Payment Sheet ────────────────────────────────────
  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetch(
        "https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total),
            customerId: userProfile?.stripeCustomerId ?? null,
            userId: user?.uid ?? null,
          }),
        },
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error("fetchPaymentSheetParams:", error);
      Alert.alert("Error", "No se pudo iniciar el pago. Intenta de nuevo.");
      return null;
    }
  };

  // ── Crear pedido en Firestore ────────────────────────────────────────────
  const createOrder = async (paymentMethodType, paymentIntentId = null) => {
    const orderData = {
      userId: user.uid,
      userName: userProfile?.displayName || user.displayName || user.email,
      userEmail: user.email,
      items,
      address: selectedAddress,
      paymentMethod: paymentMethodType,
      totalAmount: total,
      status: paymentMethodType === "card" ? "paid" : "pending",
      createdAt: new Date(),
    };
    if (paymentIntentId) orderData.paymentIntentId = paymentIntentId;

    const orderRef = await orderService.createOrder(orderData);
    await AsyncStorage.setItem(LAST_ORDER_ID_KEY, orderRef.id);
    clearCart();
    return orderRef;
  };

  // ── Pago con Stripe ──────────────────────────────────────────────────────
  const startStripePayment = async () => {
    setLoading(true);
    const params = await fetchPaymentSheetParams();
    if (!params) {
      setLoading(false);
      return;
    }

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: "Tu Tienda",
      paymentIntentClientSecret: params.paymentIntent,
      customerId: params.customer,
      customerEphemeralKeySecret: params.ephemeralKey,
      allowsDelayedPaymentMethods: false,
      savePaymentMethodOptInEnabled: true,
    });

    if (initError) {
      setLoading(false);
      return Alert.alert("Error", "No se pudo mostrar el formulario de pago.");
    }

    const { error: presentError } = await presentPaymentSheet();
    if (presentError) {
      setLoading(false);
      if (presentError.code !== "Canceled") {
        Alert.alert("Pago fallido", presentError.message);
      }
      return;
    }

    // Pago exitoso → crear orden y volver al carrito
    try {
      await createOrder("card", params.paymentIntent);
      // ✅ Volver al carrito — el banner de estado se mostrará ahí
      goBackToCart();
    } catch {
      Alert.alert(
        "Error",
        "Pago procesado pero hubo un error guardando el pedido.",
      );
    }
    setLoading(false);
  };

  // ── Pago contra entrega ──────────────────────────────────────────────────
  const handleCODPayment = async () => {
    setLoading(true);
    try {
      await createOrder("cod");
      // ✅ Volver al carrito — el banner mostrará "Esperando aceptación"
      goBackToCart();
    } catch {
      Alert.alert("Error", "No se pudo crear el pedido. Inténtalo de nuevo.");
    }
    setLoading(false);
  };

  // ── PayPal ───────────────────────────────────────────────────────────────
  const handlePayPalPayment = async () => {
    setLoading(true);
    try {
      await createOrder("paypal");
      goBackToCart();
    } catch {
      Alert.alert("Error", "No se pudo crear el pedido. Inténtalo de nuevo.");
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!paymentMethod) return;
    if (paymentMethod === "card") return startStripePayment();
    if (paymentMethod === "cod") return handleCODPayment();
    if (paymentMethod === "paypal") return handlePayPalPayment();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <Text style={styles.title}>Método de pago</Text>

        {/* Tarjeta */}
        <TouchableOpacity
          style={[
            styles.option,
            paymentMethod === "card" && styles.optionSelected,
          ]}
          onPress={() => setPaymentMethod("card")}
          disabled={loading}
        >
          <Ionicons
            name="card-outline"
            size={24}
            color={paymentMethod === "card" ? "#1565c0" : "#444"}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.optionText}>Tarjeta de crédito o débito</Text>
            <Text style={styles.optionSub}>
              Visa, Mastercard · tarjetas guardadas
            </Text>
          </View>
          {paymentMethod === "card" && (
            <Ionicons name="checkmark-circle" size={22} color="#1565c0" />
          )}
        </TouchableOpacity>

        {/* Contra entrega */}
        <TouchableOpacity
          style={[
            styles.option,
            paymentMethod === "cod" && styles.optionSelected,
          ]}
          onPress={() => setPaymentMethod("cod")}
          disabled={loading}
        >
          <Ionicons
            name="cash-outline"
            size={24}
            color={paymentMethod === "cod" ? "#1565c0" : "#444"}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.optionText}>Pago contra entrega</Text>
            <Text style={styles.optionSub}>Pagás en efectivo al recibir</Text>
          </View>
          {paymentMethod === "cod" && (
            <Ionicons name="checkmark-circle" size={22} color="#1565c0" />
          )}
        </TouchableOpacity>

        {/* PayPal */}
        <TouchableOpacity
          style={[
            styles.option,
            paymentMethod === "paypal" && styles.optionSelected,
          ]}
          onPress={() => setPaymentMethod("paypal")}
          disabled={loading}
        >
          <Ionicons name="logo-paypal" size={24} color="#003087" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.optionText}>PayPal</Text>
            <Text style={styles.optionSub}>
              Redirige a PayPal para completar
            </Text>
          </View>
          {paymentMethod === "paypal" && (
            <Ionicons name="checkmark-circle" size={22} color="#1565c0" />
          )}
        </TouchableOpacity>

        {/* Total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalAmount}>
            ¥{Math.round(total).toLocaleString()}
          </Text>
        </View>

        {/* Botón confirmar */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!paymentMethod || loading) && { opacity: 0.5 },
          ]}
          onPress={handleSave}
          disabled={!paymentMethod || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {paymentMethod === "card"
                ? "Pagar con tarjeta"
                : paymentMethod === "cod"
                  ? "Confirmar (Contra entrega)"
                  : "Confirmar pedido"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginTop: 14 },
  errorSub: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  backBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: "#055F68",
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  container: { padding: 20, flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#111" },

  option: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 15,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  optionSelected: { borderColor: "#1565c0", backgroundColor: "#eff6ff" },
  optionText: { fontSize: 15, fontWeight: "600", color: "#222" },
  optionSub: { fontSize: 12, color: "#888", marginTop: 2 },

  totalContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#555" },
  totalAmount: { fontSize: 24, fontWeight: "800", color: "#055F68" },

  saveButton: {
    marginTop: 20,
    backgroundColor: "#055F68",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
