// src/screens/Profile/EditProfileScreen.js
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
  Image
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
import { storage } from "../../firebase/firebaseConfig";
import * as FileSystem from 'expo-file-system';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, userProfile, updateProfile, refreshUserProfile } = useAuth();
  
  // Estados para los campos del formulario
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [newPhoto, setNewPhoto] = useState(null);
  
  // Estado de carga
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar datos del perfil
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || "");
      setLastName(userProfile.lastName || "");
      setDisplayName(userProfile.displayName || "");
      setPhoneNumber(userProfile.phoneNumber || "");
      setEmail(userProfile.email || "");
      setPhotoURL(userProfile.photoURL || "");
    }
  }, [userProfile]);

  // Seleccionar imagen de perfil
  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tus fotos");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  // Subir imagen a Firebase Storage
  const uploadImage = async (uri) => {
    // descarga blob
    const response = await fetch(uri);
    const blob     = await response.blob();
  
    // referencia modular
    const path      = `profileImages/${user.uid}/${Date.now()}`;
    const storageRef= ref(storage, path);
  
    // sube y obtiene URL
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  
  
  // Validación del formulario
  const validateForm = () => {
    if (!firstName.trim()) {
      setError("Por favor ingresa tu nombre");
      return false;
    }
    if (!lastName.trim()) {
      setError("Por favor ingresa tu apellido");
      return false;
    }
    if (!phoneNumber.trim()) {
      setError("Por favor ingresa tu número de teléfono");
      return false;
    }
    return true;
  };

  // Guardar perfil
  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Datos a actualizar
      const updatedData = {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        phoneNumber,
      };
      
      // Si hay una nueva foto, subirla
      if (newPhoto) {
        const photoURL = await uploadImage(newPhoto);
        updatedData.photoURL = photoURL;
      }
      
      // Actualizar perfil
      await updateProfile(updatedData);
      
      // Refrescar datos del perfil
      await refreshUserProfile();
      
      Alert.alert(
        "Perfil actualizado",
        "Tu información ha sido actualizada correctamente",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setError("No se pudo actualizar el perfil. Inténtalo de nuevo.");
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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto de perfil */}
        <View style={styles.photoContainer}>
          <TouchableOpacity 
            style={styles.photoWrapper}
            onPress={handleSelectImage}
          >
            <Image 
              source={{ 
                uri: newPhoto || photoURL || "https://via.placeholder.com/150" 
              }} 
              style={styles.profilePhoto}
              // defaultSource={require('../../assets/default-avatar.png')}
            />
            <View style={styles.editPhotoButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Cambiar foto</Text>
        </View>
        
        {/* Formulario de perfil */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu apellido"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu número de teléfono"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />
            <Text style={styles.helperText}>
              El correo electrónico no se puede modificar
            </Text>
          </View>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
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
  photoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16222b',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 16,
    color: '#16222b',
    fontWeight: '500',
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
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
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
