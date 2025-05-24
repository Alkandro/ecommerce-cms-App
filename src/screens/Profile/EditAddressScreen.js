// src/screens/Profile/EditAddressScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { createUserAddress } from "../../models/userModel";

export default function EditAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth(); // Obtén el objeto user del contexto de autenticación

  // Obtener parámetros de la ruta
  const { mode = "add", address = null } = route.params || {};
  const isEditMode = mode === "edit";

  // Estados para los campos del formulario
  const [alias, setAlias] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Estado de carga y autocompletado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (isEditMode && address) {
      setAlias(address.alias || "");

      // Si existe fullName, intentar separarlo en nombre y apellido
      if (address.fullName) {
        const nameParts = address.fullName.split(' ');
        if (nameParts.length > 1) {
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(' ') || "");
        } else {
          setFirstName(address.fullName || "");
        }
      } else {
        // Si ya existen campos separados, usarlos
        setFirstName(address.firstName || "");
        setLastName(address.lastName || "");
      }

      setPhoneNumber(address.phoneNumber || "");
      setStreet(address.street || "");
      setApartment(address.apartment || "");
      setCity(address.city || "");
      setState(address.state || "");
      setZipCode(address.zipCode || "");
      setCountry(address.country || "");
      setIsDefault(address.isDefault || false);
    }
  }, [isEditMode, address]);

  // Buscar dirección por código postal
  const searchAddressByPostalCode = async () => {
    if (!zipCode || zipCode.length < 3) {
      setError("Por favor ingresa un código postal válido");
      return;
    }

    setIsSearchingAddress(true);
    setError("");

    try {
      // Llamada a la API del correo japonés
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipCode}`);
      const data = await response.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const addressData = data.results[0];

        // Actualizar los campos de dirección
        setState(addressData.address1 || "");
        setCity(addressData.address2 || "");

        // Mostrar mensaje de éxito
        Alert.alert(
          "Dirección encontrada",
          "Se ha completado la información de la dirección automáticamente."
        );
      } else {
        setError("No se encontró dirección para este código postal");
      }
    } catch (error) {
      console.error("Error al buscar dirección:", error);
      setError("Error al buscar la dirección. Inténtalo de nuevo.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Validación del formulario
  const validateForm = () => {
    if (!alias.trim()) {
      setError("Por favor ingresa un nombre para esta dirección");
      return false;
    }
    if (!firstName.trim()) {
      setError("Por favor ingresa el nombre");
      return false;
    }
    if (!lastName.trim()) {
      setError("Por favor ingresa el apellido");
      return false;
    }
    if (!phoneNumber.trim()) {
      setError("Por favor ingresa un número de teléfono");
      return false;
    }
    if (!street.trim()) {
      setError("Por favor ingresa la calle y número");
      return false;
    }
    if (!city.trim()) {
      setError("Por favor ingresa la ciudad");
      return false;
    }
    if (!state.trim()) {
      setError("Por favor ingresa el estado o provincia");
      return false;
    }
    if (!zipCode.trim()) {
      setError("Por favor ingresa el código postal");
      return false;
    }
    if (!country.trim()) {
      setError("Por favor ingresa el país");
      return false;
    }
    return true;
  };

  // Guardar dirección
  const handleSaveAddress = async () => {
    // 1. Verifica si el usuario está autenticado y tiene un UID
    if (!user || !user.uid) {
      Alert.alert(
        "Error de autenticación",
        "No se pudo identificar al usuario para guardar la dirección. Por favor, inicia sesión de nuevo."
      );
      console.error("Error: user.uid es nulo o indefinido al intentar guardar la dirección.");
      return;
    }

    if (!validateForm()) return; // Si la validación falla, sale de la función

    setLoading(true);
    setError(""); // Limpia cualquier error anterior

    try {
      const addressData = {
        alias,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`, // Mantener para compatibilidad
        phoneNumber,
        street,
        apartment,
        city,
        state,
        zipCode,
        country,
        isDefault,
        updatedAt: serverTimestamp() // Se usa para la actualización también
      };

      if (isEditMode && address) {
        // En modo edición, el 'userId' ya debería existir en el documento de Firebase.
        // Solo actualizamos los campos. La regla de seguridad verifica que el 'userId'
        // del documento existente coincida con el usuario actual.
        console.log("Editando dirección con ID:", address.id, "para UID:", user.uid);
        await updateDoc(doc(db, "userAddresses", address.id), addressData);
        Alert.alert(
          "Dirección actualizada",
          "La dirección ha sido actualizada correctamente",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        // En modo creación, usamos createUserAddress para asegurar que 'userId' se incluya.
        const newAddressDocData = createUserAddress(user.uid, addressData);
        // Firebase Timestamp se añade por separado para createdAt y updatedAt
        newAddressDocData.createdAt = serverTimestamp();
        newAddressDocData.updatedAt = serverTimestamp();

        console.log("Creando nueva dirección para UID:", user.uid);
        console.log("Datos que se enviarán:", newAddressDocData);

        await addDoc(collection(db, "userAddresses"), newAddressDocData);
        Alert.alert(
          "Dirección guardada",
          "La dirección ha sido guardada correctamente",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (e) { // Cambié 'error' a 'e' para evitar confusión con el estado 'error'
      console.error("Error al guardar dirección:", e);
      // Aquí podrías parsear el error de Firebase para mensajes más específicos
      if (e.code === 'permission-denied' || e.message.includes('permissions')) {
         setError("Error: Permisos insuficientes. Asegúrate de que estás logueado y tus reglas de Firestore permiten esta operación.");
      } else {
         setError("No se pudo guardar la dirección. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackButton = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header con título y botón de retroceso */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackButton}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Editar dirección" : "Nueva dirección"}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Formulario de dirección */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información de la dirección</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de la dirección</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Casa, Trabajo, etc."
              value={alias}
              onChangeText={setAlias}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del destinatario"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Apellido del destinatario"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Teléfono de contacto"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Detalles de la dirección</Text>

          {/* Código postal con botón de búsqueda */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Código postal</Text>
            <View style={styles.postalCodeContainer}>
              <TextInput
                style={[styles.input, styles.postalCodeInput]}
                placeholder="Código postal"
                keyboardType="number-pad"
                value={zipCode}
                onChangeText={setZipCode}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={searchAddressByPostalCode}
                disabled={isSearchingAddress}
              >
                {isSearchingAddress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Ingresa el código postal y presiona "Buscar" para autocompletar la dirección
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Estado/Provincia</Text>
            <TextInput
              style={styles.input}
              placeholder="Estado o provincia"
              value={state}
              onChangeText={setState}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ciudad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ciudad"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Calle y número</Text>
            <TextInput
              style={styles.input}
              placeholder="Calle y número"
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Apartamento, suite, etc. (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Apartamento, piso, etc."
              value={apartment}
              onChangeText={setApartment}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>País</Text>
            <TextInput
              style={styles.input}
              placeholder="País"
              value={country}
              onChangeText={setCountry}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Establecer como dirección predeterminada</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: "#d1d1d6", true: "#4cd964" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveAddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar dirección</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 28, // Para mantener el título centrado
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#16222b',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  postalCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postalCodeInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#16222b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#16222b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});