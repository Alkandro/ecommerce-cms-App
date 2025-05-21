// src/screens/Profile/AddressesScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";

export default function AddressesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar direcciones del usuario
  useEffect(() => {
    if (!user?.uid) return;

    const loadAddresses = async () => {
      setLoading(true);
      try {
        const addressesRef = collection(db, "userAddresses");
        const q = query(addressesRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const addressList = [];
        querySnapshot.forEach((doc) => {
          addressList.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setAddresses(addressList);
      } catch (error) {
        console.error("Error al cargar direcciones:", error);
        Alert.alert("Error", "No se pudieron cargar tus direcciones");
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [user]);

  const handleAddAddress = () => {
    navigation.navigate("EditAddressScreen", { mode: "add" });
  };

  const handleEditAddress = (address) => {
    navigation.navigate("EditAddressScreen", { mode: "edit", address });
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      "Eliminar dirección",
      "¿Estás seguro de que deseas eliminar esta dirección?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "userAddresses", addressId));
              // Actualizar la lista de direcciones
              setAddresses(addresses.filter((addr) => addr.id !== addressId));
            } catch (error) {
              console.error("Error al eliminar dirección:", error);
              Alert.alert("Error", "No se pudo eliminar la dirección");
            }
          },
        },
      ]
    );
  };

  const handleBackButton = () => {
    navigation.goBack();
  };

  // Renderizar cada dirección
  const renderAddress = (address) => {
    return (
      <View key={address.id} style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTitleContainer}>
            <Text style={styles.addressAlias}>{address.alias}</Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Predeterminada</Text>
              </View>
            )}
          </View>

          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditAddress(address)}
            >
              <Ionicons name="create-outline" size={22} color="#16222b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteAddress(address.id)}
            >
              <Ionicons name="trash-outline" size={22} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.addressDetails}>
          <Text style={styles.recipientName}>{address.fullName}</Text>
          <Text style={styles.addressLine}>{address.street}</Text>
          {address.apartment ? (
            <Text style={styles.addressLine}>{address.apartment}</Text>
          ) : null}
          <Text style={styles.addressLine}>
            {address.city}, {address.state} {address.zipCode}
          </Text>
          <Text style={styles.addressLine}>{address.country}</Text>
          <Text style={styles.phoneNumber}>{address.phoneNumber}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con título y botón de retroceso */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Direcciones de Envío</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16222b" />
          <Text style={styles.loadingText}>Cargando direcciones...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                No tienes direcciones guardadas
              </Text>
              <Text style={styles.emptySubtext}>
                Agrega una dirección para facilitar tus compras
              </Text>
            </View>
          ) : (
            addresses.map(renderAddress)
          )}

          <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Agregar nueva dirección</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerRight: {
    width: 28, // Para mantener el título centrado
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginHorizontal: 40,
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addressTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addressAlias: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "500",
  },
  addressActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  addressDetails: {
    marginTop: 4,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 15,
    color: "#444",
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 15,
    color: "#444",
    marginTop: 6,
  },
  addButton: {
    backgroundColor: "#16222b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
