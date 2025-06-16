import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import {initPaymentSheet,presentPaymentSheet} from '@stripe/stripe-react-native';
import { useAuth } from "../../context/AuthContext"; 
  


export default function PaymentMethodsScreen() {
  const [cardNumber, setCardNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null); // 'card' | 'cod' | 'paypal' | etc.
  const { userProfile } = useAuth();

  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetch('https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1000, // en centavos: 1000 = $10.00
          customerId: userProfile?.stripeCustomerId,
        }),
      });
  
      const { paymentIntent, ephemeralKey, customer } = await response.json();
      return { paymentIntent, ephemeralKey, customer };
    } catch (error) {
      console.error('Error al obtener parámetros de Stripe:', error);
      Alert.alert('Error', 'No se pudo iniciar el pago.');
    }
  };
  
  const startStripePayment = async () => {
    const result = await fetchPaymentSheetParams();
    if (!result) return;
  
    const { paymentIntent, ephemeralKey, customer } = result;
  
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Tu Tienda',
      paymentIntentClientSecret: paymentIntent,
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      allowsDelayedPaymentMethods: true,
    });
  
    if (initError) {
      console.error(initError);
      Alert.alert('Error', 'No se pudo mostrar el formulario de pago.');
      return;
    }
  
    const { error: presentError } = await presentPaymentSheet();
  
    if (presentError) {
      Alert.alert('Pago cancelado o fallido', presentError.message);
    } else {
      Alert.alert('Pago exitoso', 'Gracias por tu compra!');
    }
  };

  
  const handleSave = () => {
    if (paymentMethod === "card") {
      startStripePayment();
    } else {
      Alert.alert("Guardado", `Método de pago seleccionado: ${paymentMethod}`);
    }
  };
  
   
  

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Selecciona un método de pago</Text>

        {/* Pago con tarjeta */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => setPaymentMethod("card")}
        >
          <Ionicons name="card-outline" size={24} color="#000" />
          <Text style={styles.optionText}>Tarjeta de crédito o débito</Text>
          {paymentMethod === "card" && (
            <Ionicons name="checkmark" size={20} color="green" />
          )}
        </TouchableOpacity>

        {/* {paymentMethod === "card" && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.cardVisual}
          >
            <Text style={styles.cardTitle}>Datos de la tarjeta</Text>

            <TextInput
              placeholder="Nombre completo"
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              placeholder="Número de tarjeta"
              keyboardType="numeric"
              style={styles.input}
              value={cardNumber}
              onChangeText={setCardNumber}
            />
            <View style={styles.row}>
              <TextInput
                placeholder="MM/AA"
                style={[styles.input, { flex: 1, marginRight: 10 }]}
                value={expiry}
                onChangeText={setExpiry}
              />
              <TextInput
                placeholder="CVV"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
                value={cvv}
                onChangeText={setCvv}
                secureTextEntry
              />
            </View>
          </Animated.View>
        )} */}

        {/* Pago contra entrega */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => setPaymentMethod("cod")}
        >
          <Ionicons name="cash-outline" size={24} color="#000" />
          <Text style={styles.optionText}>Pago al momento de la entrega</Text>
          {paymentMethod === "cod" && (
            <Ionicons name="checkmark" size={20} color="green" />
          )}
        </TouchableOpacity>

        {/* PayPal */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => setPaymentMethod("paypal")}
        >
          <Ionicons name="logo-paypal" size={24} color="#003087" />
          <Text style={styles.optionText}>PayPal</Text>
          {paymentMethod === "paypal" && (
            <Ionicons name="checkmark" size={20} color="green" />
          )}
        </TouchableOpacity>

        {/* Botón Guardar */}
        <TouchableOpacity 
        style={[styles.saveButton,
          !paymentMethod && { opacity: 0.5 },
        ]} 
        onPress={handleSave}
        disabled={!paymentMethod}
        >
          <Text style={styles.saveButtonText}>
            {paymentMethod === "card" ? "Pagar con tarjeta guardada" : "Confirmar pedido"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  cardForm: {
    marginTop: 10,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
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
  },
  cardVisual: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
