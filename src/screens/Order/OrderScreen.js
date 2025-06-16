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
import {initPaymentSheet,presentPaymentSheet} from '@stripe/stripe-react-native';


const LAST_ORDER_ID_KEY = "@lastOrderId";

export default function OrderScreen() {
  const { user, userProfile } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigation = useNavigation();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [acceptedItems, setAcceptedItems] = useState({});
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderStatusFromDb, setOrderStatusFromDb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [latestTermsLastUpdated, setLatestTermsLastUpdated] = useState(null);

  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetch('https://us-central1-ecommerce-cms-578f4.cloudfunctions.net/createPaymentIntent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100) }), // en centavos
      });
  
      const { paymentIntent, ephemeralKey, customer } = await response.json();
      return { paymentIntent, ephemeralKey, customer };
    } catch (error) {
      console.error('Error al obtener parámetros de pago:', error);
      Alert.alert('Error', 'No se pudo iniciar el pago.');
      return null;
    }
  };
  
  const startStripePayment = async (itemsForOrder) => {
    setLoading(true);
    try {
      const result = await fetchPaymentSheetParams();
      if (!result) return;
  
      const { paymentIntent, ephemeralKey, customer } = result;
  
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Mi Tienda de Prueba',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
      });
  
      if (initError) {
        console.error(initError);
        Alert.alert('Error', 'No se pudo inicializar el pago.');
        return;
      }
  
      const { error: presentError } = await presentPaymentSheet();
  
      if (presentError) {
        Alert.alert('Pago cancelado o fallido', presentError.message);
      } else {
        Alert.alert('✅ Pago exitoso', 'Gracias por tu compra!');
  
        // Guardar pedido en Firestore solo si el pago fue exitoso
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
          paymentIntentId: paymentIntent, // opcional para debug o futuras consultas
        });
  
        console.log("Pedido pagado creado con ID:", ref.id);
  
        setCurrentOrderId(ref.id);
        setOrderStatusFromDb("paid");
        await AsyncStorage.setItem(LAST_ORDER_ID_KEY, ref.id);
        clearCart();
      }
    } catch (e) {
      console.error("Error al pagar y guardar pedido:", e);
      Alert.alert("Error", "El pago fue exitoso pero ocurrió un error al guardar tu pedido.");
    } finally {
      setLoading(false);
    }
  };
  
  
  
  // 1) Cargar direcciones y último OrderId guardado
  useEffect(() => {
    const loadInitialData = async () => {
      setAddressLoading(true);

      // Carga direcciones del usuario (si ya existe)
      if (user?.uid) {
        try {
          const list = await addressService.getUserAddresses(user.uid);
          setAddresses(list);
          if (list.length > 0) {
            const defaultAddr = list.find((addr) => addr.isDefault);
            setSelectedAddress(defaultAddr || list[0]);
          }
        } catch (err) {
          console.error("Error cargando direcciones en OrderScreen:", err);
          Alert.alert(
            "Error",
            "No se pudieron cargar tus direcciones. Inténtalo de nuevo."
          );
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
      } catch (err) {
        console.error("Failed to load last order ID from AsyncStorage", err);
      }
    };

    loadInitialData();
  }, [user?.uid]);

  // 2) Escucha el estado del pedido en tiempo real, solo cuando user.uid y currentOrderId existen
  useEffect(() => {
    if (!currentOrderId || !user?.uid) {
      return;
    }

    console.log(`Listening to order ${currentOrderId} for user.uid ${user.uid}`);

    const orderRef = doc(db, "orders", currentOrderId);

    // Antes de suscribirnos, probamos un getDoc para comprobar permisos/exists
    const checkAndSubscribe = async () => {
      try {
        const singleSnap = await getDoc(orderRef);
        if (!singleSnap.exists()) {
          // El pedido no existe o no tenemos permiso
          console.log(
            "getDoc: El pedido no existe o no tienes permiso para leerlo."
          );
          setOrderStatusFromDb(null);
          setCurrentOrderId(null);
          await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
          return;
        }

        // Si existía y tenemos permiso, suscribimos onSnapshot
        const unsubscribe = onSnapshot(
          orderRef,
          async (docSnap) => { // <--- Haz esta función asíncrona
            if (docSnap.exists()) {
              const data = docSnap.data();
              console.log(
                "Order data changed:",
                data.status,
                "createdAt:",
                data.createdAt?.toDate(),
                "acceptedAt:",
                data.acceptedAt?.toDate()
              );
              setOrderStatusFromDb(data.status);

              // *** NUEVA LÓGICA AQUÍ ***
              // Si el pedido es 'accepted' o 'rejected', se considera finalizado.
              // Limpiamos el currentOrderId y el storage para que no aparezca de nuevo al reabrir.
              if (data.status === "accepted" || data.status === "rejected") {
                console.log(`Order ${currentOrderId} is now ${data.status}. Clearing local state and storage.`);
                setCurrentOrderId(null);
                setOrderStatusFromDb(null); // Opcional, pero ayuda a que la UI se "resetee"
                await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
              }

            } else {
              // Si alguien borró el pedido en Firestore, limpiamos estado
              console.log(
                "El documento de pedido ya no existe. Limpiando estado local."
              );
              setOrderStatusFromDb(null);
              setCurrentOrderId(null);
              await AsyncStorage.removeItem(LAST_ORDER_ID_KEY); // Usa await aquí
            }
          },
          (error) => {
            console.error("Error listening to order status:", error);
            setOrderStatusFromDb("error");
          }
        );

        // Guardamos el unsubscribe para el cleanup
        return unsubscribe;
      } catch (error) {
        console.error("Error con getDoc() antes de onSnapshot:", error);
        // Si aquí falla (ej. permisos insuficientes), limpiamos estado
        setOrderStatusFromDb("error");
        setCurrentOrderId(null);
        await AsyncStorage.removeItem(LAST_ORDER_ID_KEY); // Usa await aquí
      }
    };

    // Ejecutamos la comprobación y guardamos la función de cleanup
    let unsubscribeFunction;
    checkAndSubscribe().then((unsub) => {
      unsubscribeFunction = unsub;
    });

    // Cleanup cuando el componente se desmonte o currentOrderId/user.uid cambien
    return () => {
      if (unsubscribeFunction) {
        console.log(`Unsubscribed from order ${currentOrderId}.`);
        unsubscribeFunction();
      }
    };
  }, [currentOrderId, user?.uid]); // Dependencias del useEffect

  // ... (el resto de tu código sigue igual)
  // 3) Cargar la fecha de última actualización de los Términos y Condiciones
  useEffect(() => {
    const fetchLatestTermsDate = async () => {
      try {
        const { lastUpdated } = await termsConditionsService.getTermsAndConditions();
        setLatestTermsLastUpdated(lastUpdated);
      } catch (error) {
        console.error("Error al cargar la última fecha de T&C:", error);
      }
    };
    fetchLatestTermsDate();
  }, []);

  // 4) Inicializar acceptedItems cada vez que cambie el carrito
  useEffect(() => {
    const initialAccepted = {};
    cart.forEach((item) => {
      initialAccepted[item.product.id] = false;
    });
    setAcceptedItems(initialAccepted);
  }, [cart]);

  const toggleAccept = (productId) =>
    setAcceptedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));

  const handleDecreaseQuantity = useCallback(
    (item) => {
      if (item.quantity - 1 <= 0) {
        removeFromCart(item.product.id);
      } else {
        updateQuantity(item.product.id, item.quantity - 1);
      }
    },
    [removeFromCart, updateQuantity]
  );

  const handleIncreaseQuantity = useCallback(
    (item) => {
      updateQuantity(item.product.id, item.quantity + 1);
    },
    [updateQuantity]
  );

  // Calcular total del carrito
  const total = cart.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  // 5) Función para confirmar pedido
  const confirmOrder = async () => {
    // Validar Términos y Condiciones
    const userAcceptedTermsAt = userProfile?.termsAcceptedAt?.toDate();
    if (
      !userAcceptedTermsAt ||
      !latestTermsLastUpdated ||
      userAcceptedTermsAt.getTime() < latestTermsLastUpdated.getTime()
    ) {
      Alert.alert(
        "Aviso Importante",
        "Debes leer y aceptar la última versión de los Términos y Condiciones para poder realizar compras.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Ir a Términos",
            onPress: () => navigation.navigate("TermsConditions"),
          },
        ]
      );
      return;
    }
  
    // Validar dirección
    if (!selectedAddress) {
      Alert.alert(
        "Elige una dirección",
        "Por favor, selecciona una dirección de envío antes de continuar."
      );
      return;
    }
  
    // Validar aceptación de todos los ítems
    const allAccepted = cart.every((i) => acceptedItems[i.product.id]);
    if (!allAccepted) {
      Alert.alert(
        "Acepta todos los productos antes",
        "Debes aceptar todos los productos en tu carrito para confirmar el pedido."
      );
      return;
    }
  
    // Preparar items para el pedido
    const itemsForOrder = cart.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      imageUrl: i.product.image
    }));
    
  
    await startStripePayment(itemsForOrder); // Aquí empieza todo el proceso de pago
  };
  

     

  const displayStatus = currentOrderId ? orderStatusFromDb : null;

  return (
    <SafeAreaView style={s.container}>
      {/* Mostrar estado del pedido si existe */}
      {displayStatus && (
        <Text
          style={[
            s.status,
            displayStatus === "pending"
              ? s.pending
              : displayStatus === "accepted"
              ? s.accepted
              : s.rejected,
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

      {/* Si hay ítems en carrito o ya existe un pedido en progreso, muestro la lista */}
      {(cart.length > 0 || currentOrderId) ? (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.product.id}
          renderItem={({ item }) => (
            <View style={s.itemContainer}>
            <View style={s.row}>
              <Image source={{ uri: item.product.image }} style={s.img} />
              <View style={s.info}>
                <Text style={s.name}>{item.product.name}</Text>
                <Text>
                  {item.product.price}€ × {item.quantity}
                </Text>
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

                <TouchableOpacity onPress={() => toggleAccept(item.product.id)}style={s.acceptButton}>
                  <Text
                    style={[
                      s.acceptText,
                      acceptedItems[item.product.id] && s.acceptedText
                    ]}
                  >
                    {acceptedItems[item.product.id] ? "Aceptado" : "Aceptar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            </View>
          )}
          ListEmptyComponent={
            currentOrderId && (
              <View style={s.orderInProgressContainer}>
                <Text style={s.orderInProgressText}>
                  Tu pedido está en proceso de{" "}
                  {displayStatus === "pending" ? "espera" : "revisión"}...
                </Text>
                <Text style={s.orderInProgressSubtext}>
                  Puedes salir de esta pantalla. El estado se actualizará
                  automáticamente.
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

      {/* Sección de dirección */}
      <View style={s.section}>
        <Text style={s.label}>Dirección envío:</Text>
        {addressLoading ? (
          <ActivityIndicator color="#007bff" style={{ marginTop: 10 }} />
        ) : selectedAddress ? (
          <View style={s.selectedAddressDetails}>
            <Text style={s.addressDetailText}>
              {selectedAddress.fullName}
            </Text>
            <Text style={s.addressDetailText}>
              {selectedAddress.street}
              {selectedAddress.number ? ", " + selectedAddress.number : ""}
              {selectedAddress.apartment
                ? " (" + selectedAddress.apartment + ")"
                : ""}
            </Text>
            <Text style={s.addressDetailText}>
              {selectedAddress.city}, {selectedAddress.state}{" "}
              {selectedAddress.zipCode}
            </Text>
            <Text style={s.addressDetailText}>
              {selectedAddress.country}
            </Text>
            {selectedAddress.phoneNumber && (
              <Text style={s.addressDetailText}>
                Tel: {selectedAddress.phoneNumber}
              </Text>
            )}
          </View>
        ) : (
          <Text style={s.noAddressText}>
            No hay direcciones disponibles. Por favor, añade una en tu perfil.
          </Text>
        )}
      </View>

      {/* Sección de cliente/fecha */}
      <View style={s.section}>
        <Text style={s.label}>Cliente:</Text>
        <Text>{userProfile?.displayName || user?.email || "Cargando..."}</Text>
        <Text style={s.label}>Fecha:</Text>
        <Text>{DateTime.local().toFormat("dd/MM/yyyy")}</Text>
      </View>

      {/* Sección de pago (fija) */}
      <View style={s.section}>
        <Text style={s.label}>Pago:</Text>
        <Text>Tarjeta ****1234</Text>
      </View>
{/* boton de STRIPE */}
      {/* <Button
  title="Probar pago con Stripe"
  onPress={confirmOrder}
  color="#4caf50"
/> */}

      {/* Footer con total y botón */}
      <View style={s.footer}>
        <Text style={s.total}>Total: {total.toFixed(2)}€</Text>
        <Button
          title={loading ? "Enviando..." : "Confirmar pedido"}
          onPress={confirmOrder}
          disabled={
            loading || cart.length === 0 || !selectedAddress || currentOrderId !== null
          }
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
    // marginBottom: 12 
  },
  img: { 
    width: 80, 
    height: 80, 
    borderRadius: 8, 
    margin: 12 
  },
  info: { 
    flex: 2,
    justifyContent: "center", 
  },
  name: { 
    fontWeight: "bold",
    marginBottom: 4, 
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
