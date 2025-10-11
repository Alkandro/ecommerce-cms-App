// // src/screens/Payments/PaymentMethodsScreen.js
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from "@expo/vector-icons";
// import {initPaymentSheet,presentPaymentSheet} from '@stripe/stripe-react-native';
// import { useAuth } from "../../context/AuthContext"; 

// export default function PaymentMethodsScreen({ route, navigation }) {
//   const { items, total } = route.params;              // <-- recogemos lo que vino de OrderScreen
//   const [paymentMethod, setPaymentMethod] = useState(null);
//   const { userProfile } = useAuth();

//   const fetchPaymentSheetParams = async () => {
//     try {
//       const response = await fetch(
//         'https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent',
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             amount: Math.round(total * 100),           // <-- usar el total
//             customerId: userProfile?.stripeCustomerId,
//           }),
//         }
//       );
//       const { paymentIntent, ephemeralKey, customer } = await response.json();
//       return { paymentIntent, ephemeralKey, customer };
//     } catch (error) {
//       console.error(error);
//       Alert.alert('Error', 'No se pudo iniciar el pago.');
//       return null;
//     }
//   };
  
//   const startStripePayment = async () => {
//     const params = await fetchPaymentSheetParams();
//     if (!params) return;

//     const { error: initError } = await initPaymentSheet({
//       merchantDisplayName: 'Tu Tienda',
//       paymentIntentClientSecret: params.paymentIntent,
//       customerId: params.customer,
//       customerEphemeralKeySecret: params.ephemeralKey,
//       allowsDelayedPaymentMethods: true,
//     });
//     if (initError) {
//       console.error(initError);
//       return Alert.alert('Error', 'No se pudo mostrar el formulario de pago.');
//     }

//     const { error: presentError } = await presentPaymentSheet();
//     if (presentError) {
//       return Alert.alert('Pago fallido', presentError.message);
//     }

//     // Si el pago fue exitoso, aquí llamarías a tu orderService.createOrder(...)
//     Alert.alert('Pago exitoso', '¡Gracias por tu compra!');

//     // Y luego, por ejemplo, vuelves al home u orden histórica:
//     navigation.popToTop();
//   };

//   const handleSave = () => {
//     if (paymentMethod === "card") {
//       return startStripePayment();
//     }
//     // Otras opciones (cod, paypal)...
//     Alert.alert("Confirmado", `Método de pago: ${paymentMethod}`);
//     navigation.popToTop();
//   };

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <View style={styles.container}>
//         <Text style={styles.title}>Selecciona un método de pago</Text>
//         <TouchableOpacity style={styles.option} onPress={() => setPaymentMethod("card")}>
//           <Ionicons name="card-outline" size={24} />
//           <Text style={styles.optionText}>Tarjeta de crédito o débito</Text>
//           {paymentMethod==="card" && <Ionicons name="checkmark" size={20} color="green"/>}
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.option} onPress={() => setPaymentMethod("cod")}>
//           <Ionicons name="cash-outline" size={24} />
//           <Text style={styles.optionText}>Pago contra entrega</Text>
//           {paymentMethod==="cod" && <Ionicons name="checkmark" size={20} color="green"/>}
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.option} onPress={() => setPaymentMethod("paypal")}>
//           <Ionicons name="logo-paypal" size={24} color="#003087" />
//           <Text style={styles.optionText}>PayPal</Text>
//           {paymentMethod==="paypal" && <Ionicons name="checkmark" size={20} color="green"/>}
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.saveButton, !paymentMethod && { opacity: 0.5 }]}
//           onPress={handleSave}
//           disabled={!paymentMethod}
//         >
//           <Text style={styles.saveButtonText}>
//             {paymentMethod === "card" ? "Pagar con tarjeta" : "Confirmar pedido"}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20, flex: 1, backgroundColor: "#fff" },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
//   option: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
//   optionText: { fontSize: 16, marginLeft: 12, flex: 1 },
//   saveButton: {
//     marginTop: 30,
//     backgroundColor: "#055F68",
//     paddingVertical: 14,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
// });
// src/screens/Payments/PaymentMethodsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { useAuth } from "../../context/AuthContext";
import { orderService } from "../../services/orderService";
import { useCart } from "../../context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_ORDER_ID_KEY = "@lastOrderId";

export default function PaymentMethodsScreen({ route, navigation }) {
  const { items, total, selectedAddress } = route.params; // ← Agrega selectedAddress
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, userProfile } = useAuth();
  const { clearCart } = useCart();

  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetch(
        'https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            customerId: userProfile?.stripeCustomerId,
          }),
        }
      );
      const { paymentIntent, ephemeralKey, customer } = await response.json();
      return { paymentIntent, ephemeralKey, customer };
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo iniciar el pago.');
      return null;
    }
  };

  // Función para crear la orden en Firestore
  const createOrder = async (paymentMethodType, paymentIntentId = null) => {
    try {
      const orderData = {
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || user.email,
        userEmail: user.email,
        items: items,
        address: selectedAddress,
        paymentMethod: paymentMethodType,
        totalAmount: total,
        status: paymentMethodType === "card" ? "paid" : "pending",
        createdAt: new Date(),
      };

      // Si es pago con tarjeta, agregar el paymentIntentId
      if (paymentIntentId) {
        orderData.paymentIntentId = paymentIntentId;
      }

      const orderRef = await orderService.createOrder(orderData);
      
      // Guardar el ID de la orden
      await AsyncStorage.setItem(LAST_ORDER_ID_KEY, orderRef.id);
      
      // Limpiar el carrito
      clearCart();
      
      return orderRef;
    } catch (error) {
      console.error("Error al crear orden:", error);
      throw error;
    }
  };

  const startStripePayment = async () => {
    setLoading(true);
    const params = await fetchPaymentSheetParams();
    if (!params) {
      setLoading(false);
      return;
    }

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Tu Tienda',
      paymentIntentClientSecret: params.paymentIntent,
      customerId: params.customer,
      customerEphemeralKeySecret: params.ephemeralKey,
      allowsDelayedPaymentMethods: true,
    });

    if (initError) {
      console.error(initError);
      setLoading(false);
      return Alert.alert('Error', 'No se pudo mostrar el formulario de pago.');
    }

    const { error: presentError } = await presentPaymentSheet();
    
    if (presentError) {
      setLoading(false);
      return Alert.alert('Pago fallido', presentError.message);
    }

    // Pago exitoso - crear orden
    try {
      await createOrder("card", params.paymentIntent);
      Alert.alert('✅ Pago exitoso', '¡Gracias por tu compra!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate("Tabs", { screen: "Home" })
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error guardando tu pedido.');
    }
    
    setLoading(false);
  };

  const handleCODPayment = async () => {
    setLoading(true);
    try {
      await createOrder("cod");
      Alert.alert(
        '✅ Pedido confirmado',
        'Tu pedido ha sido registrado. Pagarás al recibir el producto.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate("Tabs", { screen: "Home" })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el pedido. Inténtalo de nuevo.');
    }
    setLoading(false);
  };

  const handlePayPalPayment = async () => {
    // Por ahora, tratarlo como pendiente
    setLoading(true);
    try {
      await createOrder("paypal");
      Alert.alert(
        '✅ Pedido confirmado',
        'Tu pedido ha sido registrado. Completa el pago con PayPal.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate("Tabs", { screen: "Home" })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el pedido. Inténtalo de nuevo.');
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!paymentMethod) return;

    if (paymentMethod === "card") {
      return startStripePayment();
    }
    
    if (paymentMethod === "cod") {
      return handleCODPayment();
    }
    
    if (paymentMethod === "paypal") {
      return handlePayPalPayment();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Selecciona un método de pago</Text>
        
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => setPaymentMethod("card")}
          disabled={loading}
        >
          <Ionicons name="card-outline" size={24} />
          <Text style={styles.optionText}>Tarjeta de crédito o débito</Text>
          {paymentMethod === "card" && <Ionicons name="checkmark" size={20} color="green"/>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option} 
          onPress={() => setPaymentMethod("cod")}
          disabled={loading}
        >
          <Ionicons name="cash-outline" size={24} />
          <Text style={styles.optionText}>Pago contra entrega</Text>
          {paymentMethod === "cod" && <Ionicons name="checkmark" size={20} color="green"/>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option} 
          onPress={() => setPaymentMethod("paypal")}
          disabled={loading}
        >
          <Ionicons name="logo-paypal" size={24} color="#003087" />
          <Text style={styles.optionText}>PayPal</Text>
          {paymentMethod === "paypal" && <Ionicons name="checkmark" size={20} color="green"/>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, (!paymentMethod || loading) && { opacity: 0.5 }]}
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
                ? "Confirmar pedido (Pago contra entrega)"
                : "Confirmar pedido"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Mostrar total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total a pagar:</Text>
          <Text style={styles.totalAmount}>¥{total.toFixed(2)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  option: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  optionText: { fontSize: 16, marginLeft: 12, flex: 1 },
  saveButton: {
    marginTop: 30,
    backgroundColor: "#055F68",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold",
    textAlign: "center",
  },
  totalContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#055F68",
  },
});