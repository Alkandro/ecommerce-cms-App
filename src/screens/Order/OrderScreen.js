import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Button,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { DateTime } from "luxon";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { addressService } from "../../services/addressService";
import { orderService } from "../../services/orderService";
import { termsConditionsService } from "../../services/termsConditionsService";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";

const LAST_ORDER_ID_KEY = "@lastOrderId";

export default function OrderScreen() {
  const { user, userProfile } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigation = useNavigation();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderStatusFromDb, setOrderStatusFromDb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [latestTermsLastUpdated, setLatestTermsLastUpdated] = useState(null);

  // 1) Carga inicial de direcciones y último pedido
  useEffect(() => {
    const loadInitialData = async () => {
      setAddressLoading(true);
      if (user?.uid) {
        try {
          const list = await addressService.getUserAddresses(user.uid);
          setAddresses(list);
          setSelectedAddress(list.find((a) => a.isDefault) || list[0] || null);
        } catch (err) {
          console.error(err);
          Alert.alert("Error", "No se pudieron cargar tus direcciones.");
        }
      }
      setAddressLoading(false);

      try {
        const storedId = await AsyncStorage.getItem(LAST_ORDER_ID_KEY);
        if (storedId) setCurrentOrderId(storedId);
      } catch (err) {
        console.error("Error leyendo último pedido:", err);
      }
    };
    loadInitialData();
  }, [user?.uid]);

  // 2) Escucha de estado del pedido
  useEffect(() => {
    if (!currentOrderId || !user?.uid) return;

    const orderRef = doc(db, "orders", currentOrderId);
    let unsubscribe;

    (async () => {
      try {
        const snap = await getDoc(orderRef);
        if (!snap.exists()) {
          setCurrentOrderId(null);
          await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
          return;
        }
        unsubscribe = onSnapshot(
          orderRef,
          (docSnap) => {
            const data = docSnap.data();
            setOrderStatusFromDb(data.status);
            if (["accepted", "rejected"].includes(data.status)) {
              setCurrentOrderId(null);
              setOrderStatusFromDb(null);
              AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
            }
          },
          (err) => {
            console.error(err);
            setOrderStatusFromDb("error");
          }
        );
      } catch (e) {
        console.error(e);
        setOrderStatusFromDb("error");
        setCurrentOrderId(null);
        await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
      }
    })();

    return () => unsubscribe && unsubscribe();
  }, [currentOrderId, user?.uid]);

  // 3) Fecha de T&C
  useEffect(() => {
    termsConditionsService
      .getTermsAndConditions()
      .then(({ lastUpdated }) => setLatestTermsLastUpdated(lastUpdated))
      .catch(console.error);
  }, []);

  // Helpers de Stripe
  const fetchPaymentSheetParams = async () => {
    try {
      const res = await fetch(
        "https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(total * 100) }),
        }
      );
      return await res.json();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo iniciar el pago.");
      return null;
    }
  };

  const startStripePayment = async (itemsForOrder) => {
    setLoading(true);
    const params = await fetchPaymentSheetParams();
    if (!params) {
      setLoading(false);
      return;
    }

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: "Mi Tienda de Prueba",
      customerId: params.customer,
      customerEphemeralKeySecret: params.ephemeralKey,
      paymentIntentClientSecret: params.paymentIntent,
      allowsDelayedPaymentMethods: true,
    });
    if (initError) {
      Alert.alert("Error", "No se pudo inicializar el pago.");
      setLoading(false);
      return;
    }

    const { error: presentError } = await presentPaymentSheet();
    if (presentError) {
      Alert.alert("Pago fallido", presentError.message);
    } else {
      Alert.alert("✅ Pago exitoso", "Gracias por tu compra!");
      try {
        const ref = await orderService.createOrder({
          userId: user.uid,
          userName: user.displayName || user.email,
          userEmail: user.email,
          items: itemsForOrder,
          address: selectedAddress,
          paymentMethod: "Stripe",
          totalAmount: total,
          status: "paid",
          createdAt: new Date(),
          paymentIntentId: params.paymentIntent,
        });
        setCurrentOrderId(ref.id);
        setOrderStatusFromDb("paid");
        await AsyncStorage.setItem(LAST_ORDER_ID_KEY, ref.id);
        clearCart();
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Ocurrió un error guardando tu pedido.");
      }
    }
    setLoading(false);
  };

  // Confirmación de pedido
  const confirmOrder = async () => {
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
          { text: "Ir a Términos", onPress: () => navigation.navigate("TermsConditions") },
        ]
      );
    }

    if (!selectedAddress) {
      return Alert.alert("Elige una dirección", "Selecciona una antes de continuar.");
    }

    const itemsForOrder = cart.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      imageUrl: i.product.image,
    }));

    await startStripePayment(itemsForOrder);
  };

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const displayStatus = currentOrderId ? orderStatusFromDb : null;

  return (
    <SafeAreaView style={s.container}>
      {displayStatus && (
        <Text
          style={[
            s.status,
            displayStatus === "pending" ? s.pending
            : displayStatus === "accepted" ? s.accepted
            : s.rejected,
          ]}
        >
          {displayStatus === "pending"
            ? "⏳ Esperando aceptación"
            : displayStatus === "accepted"
            ? "✅ Pedido aceptado"
            : "❌ Pedido rechazado"}
        </Text>
      )}

      {(cart.length > 0 || currentOrderId) ? (
       <FlatList
       data={cart}
       keyExtractor={(item) => item.product.id}
       renderItem={({ item }) => (
         <View style={s.itemContainer}>
           <View style={s.itemRow}>
             {/* 1) Imagen a la izquierda */}
             <Image source={{ uri: item.product.image }} style={s.img} />
     
             {/* 2) Detalles: título, precio y controles */}
             <View style={s.details}>
               {/* Línea 1: Título */}
               <Text style={s.title} numberOfLines={2} ellipsizeMode="tail">
                 {item.product.name}
               </Text>
     
               {/* Línea 2: Precio */}
               <Text style={s.price}>
                 {item.product.price.toFixed(2)}€
               </Text>
     
               {/* Línea 3: controles cantidad a la izquierda, tachito a la derecha */}
               <View style={s.quantityRow}>
                 <View style={s.qtyControls}>
                   <TouchableOpacity onPress={() => {
                     if (item.quantity - 1 <= 0) removeFromCart(item.product.id);
                     else updateQuantity(item.product.id, item.quantity - 1);
                   }}>
                     <Text style={s.qtyBtn}>−</Text>
                   </TouchableOpacity>
                   <Text style={s.qtyText}>{item.quantity}</Text>
                   <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                     <Text style={s.qtyBtn}>＋</Text>
                   </TouchableOpacity>
                 </View>
                 <TouchableOpacity
                   onPress={() => removeFromCart(item.product.id)}
                   style={s.deleteButton}
                 >
                   <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                 </TouchableOpacity>
               </View>
             </View>
           </View>
         </View>
       )}
          ListEmptyComponent={
            currentOrderId && (
              <View style={s.orderInProgressContainer}>
                <Text style={s.orderInProgressText}>
                  Tu pedido está en proceso...
                </Text>
                <Text style={s.orderInProgressSubtext}>
                  Puedes salir de esta pantalla; el estado se actualizará.
                </Text>
              </View>
            )
          }
        />
      ) : (
        <View style={s.emptyCartContainer}>
          <Text style={s.emptyCartText}>Tu carrito está vacío.</Text>
          <Text style={s.emptyCartSubtext}>
            Agrega algunos productos para hacer un pedido.
          </Text>
        </View>
      )}

      {/* Dirección */}
      <View style={s.section}>
        <Text style={s.label}>Dirección envío:</Text>
        {addressLoading ? (
          <ActivityIndicator color="#007bff" />
        ) : selectedAddress ? (
          <View style={s.selectedAddressDetails}>
            <Text style={s.addressDetailText}>{selectedAddress.fullName}</Text>
            <Text style={s.addressDetailText}>
              {selectedAddress.street}{selectedAddress.number ? `, ${selectedAddress.number}` : ""}
            </Text>
            <Text style={s.addressDetailText}>
              {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
            </Text>
          </View>
        ) : (
          <Text style={s.noAddressText}>
            No hay direcciones disponibles.
          </Text>
        )}
      </View>

      {/* Cliente/Fecha */}
      <View style={s.section}>
        <Text style={s.label}>Cliente:</Text>
        <Text>{userProfile?.displayName || user?.email}</Text>
        <Text style={s.label}>Fecha:</Text>
        <Text>{DateTime.local().toFormat("dd/MM/yyyy")}</Text>
      </View>

      {/* Pago */}
      <View style={s.section}>
        <Text style={s.label}>Pago:</Text>
        <Text>Tarjeta ****1234</Text>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.total}>Total: {total.toFixed(2)}€</Text>
        <Button
          title={loading ? "Enviando..." : "Confirmar pedido"}
          onPress={confirmOrder}
          disabled={loading || cart.length === 0 || !selectedAddress || currentOrderId !== null}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 10, 
    paddingTop: 10,
    backgroundColor: "#fff" 
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  price: {
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBtn: {
    fontSize: 18,
    width: 28,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  qtyText: {
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: "center",
  },
  deleteButton: {
    padding: 6,
    borderRadius: 4,
  },

  status: {
    textAlign: "center",
    marginVertical: 8,
    padding: 8,
    borderRadius: 4,
    fontWeight: "bold",
  },
  
  pending: { 
    backgroundColor: "#fdecea", 
    color: "#d32f2f" 
  },
  accepted: { 
    backgroundColor: "#e8f5e9", 
    color: "#388e3c" 
  },
  itemContainer: {
    backgroundColor: "#f5f5f5",    // un gris muy claro
    borderRadius: 12,               // bordes suaves
    padding: 10,                    // espacio interior
    marginBottom: 12,               // separación entre ítems
    // sombra ligera (opcional):
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    flexWrap: "wrap",
  },
  img: { 
    width: 80, 
    height: 80, 
    borderRadius: 8, 
    margin: 12 
  },
  info: { 
    flex: 1,
    flexShrink: 1,          // <-- puede encogerse si hace falta
    marginRight: 8,
    justifyContent: "center", 
  },
  name: { 
    fontWeight: "bold",
    marginBottom: 4,
    flexShrink: 1,          // <-- el propio Text puede encogerse 
  },
  qty: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginHorizontal: 12, 
  },
  qtyBtn: {
    fontSize: 18,
    width: 28,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  qtyText: { 
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: "center",
  },
  actions: { 
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 80,
    paddingRight: 10, 
  },
  acceptButton: {
    minWidth: 80,         // ancho mínimo suficiente para “Aceptado”
    alignItems: "center", // centra horizontalmente el texto
  },
  acceptText: {
    borderWidth: 1,
    borderColor: "#1565c0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    color: "#1565c0",
    textAlign: "center",
  },
  acceptedText: {
    backgroundColor: "#1565c0",
    color: "#fff",
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
  },
  accept: {
    marginTop: 8,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#1565c0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    color: "#1565c0",
  },
  acceptedBtn: { 
    backgroundColor: "#1565c0", 
    color: "#fff" 
  },
  section: { 
    margin: 10 
  },
  label: { 
    fontWeight: "bold",
     marginBottom: 4
     },
  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 12,
    alignItems: "center",
  },
  total: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 8 
  },
  emptyCartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  noAddressText: {
    fontSize: 15,
    color: "#d32f2f",
    marginTop: 8,
    textAlign: "center",
  },
  selectedAddressDetails: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressDetailText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  orderInProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    marginTop: 20,
  },
  orderInProgressText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1565c0",
    marginBottom: 8,
  },
  orderInProgressSubtext: {
    fontSize: 16,
    color: "#42a5f5",
    textAlign: "center",
  },
});
