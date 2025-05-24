// src/screens/Order/OrderScreen.js
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
} from "react-native";
// Eliminamos la importación del Picker ya que no se usará
// import { Picker } from "@react-native-picker/picker";
import { DateTime } from "luxon";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { addressService } from "../../services/addressService";
import { orderService } from "../../services/orderService";
import { Ionicons } from "@expo/vector-icons";

console.log("Valor de addressService en OrderScreen:", addressService);

export default function OrderScreen() {
  const { user } = useAuth();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [acceptedItems, setAcceptedItems] = useState({});
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar direcciones
  useEffect(() => {
    const loadAddresses = async () => {
      if (!user?.uid) {
        console.warn("OrderScreen: user.uid no disponible para cargar direcciones.");
        return;
      }
      try {
        const list = await addressService.getUserAddresses(user.uid);
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddress = list.find(addr => addr.isDefault);
          // Establecer la dirección seleccionada automáticamente sin el Picker
          setSelectedAddress(defaultAddress || list[0]);
        }
      } catch (error) {
        console.error("Error cargando direcciones en OrderScreen:", error);
        Alert.alert("Error", "No se pudieron cargar tus direcciones. Inténtalo de nuevo.");
      }
    };
    loadAddresses();
  }, [user?.uid]);

  // Asegurarse de que los productos aceptados se inicialicen correctamente
  useEffect(() => {
    const initialAccepted = {};
    cart.forEach(item => {
      initialAccepted[item.product.id] = false;
    });
    setAcceptedItems(initialAccepted);
  }, [cart]);

  // Alternar aceptado para cada ítem
  const toggleAccept = (productId) =>
    setAcceptedItems((prev) => ({ ...prev, [productId]: !prev[productId] }));

  // Función para disminuir la cantidad
  const handleDecreaseQuantity = useCallback((item) => {
    if (item.quantity - 1 <= 0) {
      removeFromCart(item.product.id);
    } else {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  }, [removeFromCart, updateQuantity]);

  // Función para aumentar la cantidad
  const handleIncreaseQuantity = useCallback((item) => {
    updateQuantity(item.product.id, item.quantity + 1);
  }, [updateQuantity]);

  // Total
  const total = cart.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  // Confirmar pedido
  const confirmOrder = async () => {
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
      const items = cart.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
      }));
      const paymentMethod = "Tarjeta ****1234";
      const ref = await orderService.createOrder({
        userId: user.uid,
        items,
        address: selectedAddress,
        paymentMethod,
      });
      setOrderStatus("pending");
      clearCart(); // Usa clearCart en lugar de emptyCart
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

  return (
    <View style={s.container}>
      {orderStatus && (
        <Text
          style={[
            s.status,
            orderStatus === "pending" ? s.pending : s.accepted,
          ]}
        >
          {orderStatus === "pending"
            ? "⏳ Esperando aceptación"
            : "✅ Pedido aceptado"}
        </Text>
      )}

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
        ListEmptyComponent={() => (
          <View style={s.emptyCartContainer}>
            <Text style={s.emptyCartText}>Tu carrito está vacío.</Text>
            <Text style={s.emptyCartSubtext}>Agrega algunos productos para hacer un pedido.</Text>
          </View>
        )}
      />

      {/* Dirección de envío */}
      <View style={s.section}>
        <Text style={s.label}>Dirección envío:</Text>
        {/* Aquí mostramos la dirección seleccionada, o un mensaje si no hay */}
        {selectedAddress ? (
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
            {/* Puedes añadir más detalles si los tienes y son relevantes, ej: */}
            {/* {selectedAddress.phoneNumber && <Text style={s.addressDetailText}>Tel: {selectedAddress.phoneNumber}</Text>} */}
          </View>
        ) : (
          <Text style={s.noAddressText}>
            No hay direcciones disponibles. Por favor, añade una en tu perfil.
          </Text>
        )}
      </View>

      {/* Usuario y fecha */}
      <View style={s.section}>
        <Text style={s.label}>Cliente:</Text>
        <Text>{user?.displayName || user?.email}</Text>
        <Text style={s.label}>Fecha:</Text>
        <Text>{DateTime.local().toFormat("dd/MM/yyyy")}</Text>
      </View>

      {/* Pago */}
      <View style={s.section}>
        <Text style={s.label}>Pago:</Text>
        <Text>Tarjeta ****1234</Text>
      </View>

      {/* Total + Confirmar */}
      <View style={s.footer}>
        <Text style={s.total}>Total: {total.toFixed(2)}€</Text>
        <Button
          title={loading ? "Enviando..." : "Confirmar pedido"}
          onPress={confirmOrder}
          disabled={loading || cart.length === 0 || !selectedAddress} // Deshabilitar si no hay dirección seleccionada
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
});