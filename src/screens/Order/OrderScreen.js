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
} from "react-native";
import { DateTime } from "luxon";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { addressService } from "../../services/addressService";
import { orderService } from "../../services/orderService";
import { termsConditionsService } from "../../services/termsConditionsService"; // ¡Importar el nuevo servicio!
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native"; // Importar useNavigation

const LAST_ORDER_ID_KEY = "@lastOrderId"; // Clave para AsyncStorage

export default function OrderScreen() {
  const { user, userProfile, refreshUserProfile } = useAuth(); // Añadir refreshUserProfile
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigation = useNavigation(); // Hook de navegación

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [acceptedItems, setAcceptedItems] = useState({});
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderStatusFromDb, setOrderStatusFromDb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [latestTermsLastUpdated, setLatestTermsLastUpdated] = useState(null); // Estado para la fecha de los T&C más recientes

  // Cargar direcciones y último OrderId guardado
  useEffect(() => {
    const loadInitialData = async () => {
      setAddressLoading(true);
      if (user?.uid) {
        try {
          const list = await addressService.getUserAddresses(user.uid);
          setAddresses(list);
          if (list.length > 0) {
            const defaultAddress = list.find(addr => addr.isDefault);
            setSelectedAddress(defaultAddress || list[0]);
          }
        } catch (error) {
          console.error("Error cargando direcciones en OrderScreen:", error);
          Alert.alert("Error", "No se pudieron cargar tus direcciones. Inténtalo de nuevo.");
        }
      }
      setAddressLoading(false);

      // Cargar el último ID de pedido desde AsyncStorage
      try {
        const storedOrderId = await AsyncStorage.getItem(LAST_ORDER_ID_KEY);
        if (storedOrderId) {
          console.log("Found stored order ID:", storedOrderId);
          setCurrentOrderId(storedOrderId);
        }
      } catch (e) {
        console.error("Failed to load last order ID from AsyncStorage", e);
      }
    };
    loadInitialData();
  }, [user?.uid]);

  // Escucha el estado del pedido en tiempo real
  useEffect(() => {
    let unsubscribe;
    if (currentOrderId) {
      console.log(`Listening to order ${currentOrderId} changes.`);
      const orderRef = doc(db, "orders", currentOrderId);
      unsubscribe = onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Order data changed:", data.status, "at", data.createdAt?.toDate(), "acceptedAt", data.acceptedAt?.toDate());
          setOrderStatusFromDb(data.status);
        } else {
          console.log("Order document no longer exists in DB. Clearing local state.");
          setOrderStatusFromDb(null);
          setCurrentOrderId(null);
          AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
        }
      }, (error) => {
        console.error("Error listening to order status:", error);
        setOrderStatusFromDb("error");
      });
    }
    return () => {
      if (unsubscribe) {
        console.log(`Unsubscribed from order ${currentOrderId}.`);
        unsubscribe();
      }
    };
  }, [currentOrderId]);

  // Cargar la fecha de última actualización de los Términos y Condiciones
  useEffect(() => {
    const fetchLatestTermsDate = async () => {
      try {
        const { lastUpdated } = await termsConditionsService.getTermsAndConditions();
        setLatestTermsLastUpdated(lastUpdated);
      } catch (error) {
        console.error("Error al cargar la última fecha de T&C:", error);
        // Manejar el error, tal vez establecer un estado de error o un valor predeterminado
      }
    };
    fetchLatestTermsDate();
  }, []); // Se ejecuta una sola vez al montar

  // Otros useEffects y funciones
  useEffect(() => {
    const initialAccepted = {};
    cart.forEach(item => {
      initialAccepted[item.product.id] = false;
    });
    setAcceptedItems(initialAccepted);
  }, [cart]);

  const toggleAccept = (productId) =>
    setAcceptedItems((prev) => ({ ...prev, [productId]: !prev[productId] }));

  const handleDecreaseQuantity = useCallback((item) => {
    if (item.quantity - 1 <= 0) {
      removeFromCart(item.product.id);
    } else {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  }, [removeFromCart, updateQuantity]);

  const handleIncreaseQuantity = useCallback((item) => {
    updateQuantity(item.product.id, item.quantity + 1);
  }, [updateQuantity]);

  const total = cart.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  const confirmOrder = async () => {
    // Primero, verificar la aceptación de los Términos y Condiciones
    const userAcceptedTermsAt = userProfile?.termsAcceptedAt?.toDate();

    if (!userAcceptedTermsAt || !latestTermsLastUpdated || userAcceptedTermsAt.getTime() < latestTermsLastUpdated.getTime()) {
      Alert.alert(
        "Aviso Importante",
        "Debes leer y aceptar la última versión de los Términos y Condiciones para poder realizar compras.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Ir a Términos",
            onPress: () => navigation.navigate('TermsConditions'), // Navegar a la pantalla de T&C
          },
        ]
      );
      return; // Detener la función si los términos no están aceptados o actualizados
    }

    // --- Lógica de pedido existente (solo se ejecuta si los T&C están OK) ---
    if (!selectedAddress) {
      Alert.alert("Elige una dirección", "Por favor, selecciona una dirección de envío antes de continuar.");
      return;
    }
    const allOK = cart.every((i) => acceptedItems[i.product.id]);
    if (!allOK) {
      Alert.alert("Acepta todos los productos antes", "Debes aceptar todos los productos en tu carrito para confirmar el pedido.");
      return;
    }
    setLoading(true);
    try {
      const itemsForOrder = cart.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        imageUrl: i.product.image,
      }));

      const paymentMethod = "Tarjeta ****1234";

      const ref = await orderService.createOrder({
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        items: itemsForOrder,
        address: selectedAddress,
        paymentMethod,
        totalAmount: total,
      });

      setCurrentOrderId(ref.id);
      setOrderStatusFromDb("pending");
      await AsyncStorage.setItem(LAST_ORDER_ID_KEY, ref.id);

      clearCart();

      Alert.alert("¡Pedido enviado!", "Esperando aceptación del vendedor", [
        { text: "OK", onPress: () => {} }
      ]);
    } catch (e) {
      console.error("Error al enviar el pedido:", e);
      Alert.alert("Error", "No se pudo enviar tu pedido. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const displayStatus = currentOrderId ? orderStatusFromDb : null;

  return (
    <View style={s.container}>
      {displayStatus && (
        <Text
          style={[
            s.status,
            displayStatus === "pending" ? s.pending : (displayStatus === "accepted" ? s.accepted : s.rejected),
          ]}
        >
          {displayStatus === "pending"
            ? "⏳ Esperando aceptación"
            : displayStatus === "accepted"
            ? "✅ Pedido aceptado"
            : displayStatus === "rejected"
            ? "❌ Pedido rechazado"
            : "Estado desconocido"}
        </Text>
      )}

      {(cart.length > 0 || currentOrderId) ? (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.product.id}
          renderItem={({ item }) => (
            <View style={s.row}>
              <Image source={{ uri: item.product.image }} style={s.img} />
              <View style={s.info}>
                <Text style={s.name}>{item.product.name}</Text>
                <Text>{item.product.price}€ × {item.quantity}</Text>
              </View>
              <View style={s.qty}>
                <TouchableOpacity onPress={() => handleDecreaseQuantity(item)}>
                  <Text style={s.qtyBtn}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => handleIncreaseQuantity(item)}>
                  <Text style={s.qtyBtn}>＋</Text>
                </TouchableOpacity>
              </View>
              <View style={s.actions}>
                <TouchableOpacity
                  style={s.deleteButton}
                  onPress={() => removeFromCart(item.product.id)}
                >
                  <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleAccept(item.product.id)}
                >
                  <Text
                    style={[
                      s.accept,
                      acceptedItems[item.product.id] && s.acceptedBtn,
                    ]}
                  >
                    {acceptedItems[item.product.id] ? "Aceptado" : "Aceptar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            currentOrderId && (
              <View style={s.orderInProgressContainer}>
                <Text style={s.orderInProgressText}>Tu pedido está en proceso de {displayStatus === 'pending' ? 'espera' : 'revisión'}...</Text>
                <Text style={s.orderInProgressSubtext}>Puedes salir de esta pantalla. El estado se actualizará automáticamente.</Text>
              </View>
            )
          }
        />
      ) : (
        <View style={s.emptyCartContainer}>
          <Text style={s.emptyCartText}>Tu carrito está vacío.</Text>
          <Text style={s.emptyCartSubtext}>Agrega algunos productos para hacer un pedido.</Text>
        </View>
      )}


      <View style={s.section}>
        <Text style={s.label}>Dirección envío:</Text>
        {addressLoading ? (
          <ActivityIndicator color="#007bff" style={{ marginTop: 10 }} />
        ) : selectedAddress ? (
          <View style={s.selectedAddressDetails}>
            <Text style={s.addressDetailText}>{selectedAddress.fullName}</Text>
            <Text style={s.addressDetailText}>
              {selectedAddress.street}
              {selectedAddress.number ? ', ' + selectedAddress.number : ''}
              {selectedAddress.apartment ? ' (' + selectedAddress.apartment + ')' : ''}
            </Text>
            <Text style={s.addressDetailText}>
              {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
            </Text>
            <Text style={s.addressDetailText}>{selectedAddress.country}</Text>
            {selectedAddress.phoneNumber && (
              <Text style={s.addressDetailText}>Tel: {selectedAddress.phoneNumber}</Text>
            )}
          </View>
        ) : (
          <Text style={s.noAddressText}>
            No hay direcciones disponibles. Por favor, añade una en tu perfil.
          </Text>
        )}
      </View>

      <View style={s.section}>
        <Text style={s.label}>Cliente:</Text>
        <Text>{userProfile?.displayName || user?.email || "Cargando..."}</Text> 
        <Text style={s.label}>Fecha:</Text>
        <Text>{DateTime.local().toFormat("dd/MM/yyyy")}</Text>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Pago:</Text>
        <Text>Tarjeta ****1234</Text>
      </View>

      <View style={s.footer}>
        <Text style={s.total}>Total: {total.toFixed(2)}€</Text>
        <Button
          title={loading ? "Enviando..." : "Confirmar pedido"}
          onPress={confirmOrder}
          disabled={loading || cart.length === 0 || !selectedAddress || currentOrderId !== null}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  status: {
    textAlign: "center",
    marginVertical: 8,
    padding: 8,
    borderRadius: 4,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 5,
  },
  pending: { backgroundColor: "#fdecea", color: "#d32f2f" },
  accepted: { backgroundColor: "#e8f5e9", color: "#388e3c" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  img: { width: 50, height: 50, borderRadius: 4, marginRight: 8 },
  info: { flex: 2 },
  name: { fontWeight: "bold" },
  qty: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  qtyBtn: {
    fontSize: 18,
    width: 24,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  qtyText: { marginHorizontal: 6 },
  actions: { alignItems: "flex-end" },
  del: { color: "#d32f2f", marginBottom: 4 },
  accept: {
    color: "#1565c0",
    borderWidth: 1,
    borderColor: "#1565c0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  acceptedBtn: { backgroundColor: "#1565c0", color: "#fff" },
  section: { marginVertical: 8 },
  label: { fontWeight: "bold", marginBottom: 4 },
  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 12,
    alignItems: "center",
  },
  total: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
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
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressDetailText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  orderInProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    backgroundColor: '#e3f2fd',
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