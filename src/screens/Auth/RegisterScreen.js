// // src/screens/Auth/RegisterScreen.js
// import React, { useState } from "react";
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../../firebase/firebaseConfig";

// export default function RegisterScreen({ navigation }) {
//   const [email,    setEmail]    = useState("");
//   const [password, setPassword] = useState("");
//   const [loading,  setLoading]  = useState(false);
//   const [error,    setError]    = useState("");

//   const handleRegister = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       await createUserWithEmailAndPassword(auth, email, password);
//       navigation.replace("Tabs"); // ó navigation.navigate("Login")
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Crear cuenta</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Correo electrónico"
//         autoCapitalize="none"
//         keyboardType="email-address"
//         value={email}
//         onChangeText={setEmail}
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Contraseña"
//         secureTextEntry
//         value={password}
//         onChangeText={setPassword}
//       />

//       {error ? <Text style={styles.error}>{error}</Text> : null}

//       <TouchableOpacity
//         style={styles.button}
//         onPress={handleRegister}
//         disabled={loading}
//       >
//         {loading
//           ? <ActivityIndicator color="#fff" />
//           : <Text style={styles.buttonText}>Registrarse</Text>}
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => navigation.goBack()}>
//         <Text style={styles.toggle}>¿Ya tienes cuenta? Inicia sesión</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }
// // Reusa los mismos estilos que en LoginScreen
// const styles = StyleSheet.create({
//   container:  { flex:1,justifyContent:"center",padding:20,backgroundColor:"#f4f6f8" },
//   title:      { fontSize:28,fontWeight:"bold",color:"#16222b",marginBottom:20,textAlign:"center" },
//   input:      { backgroundColor:"#fff",borderRadius:8,padding:12,marginBottom:15,borderWidth:1,borderColor:"#ccc" },
//   button:     { backgroundColor:"#16222b",padding:15,borderRadius:8,alignItems:"center",marginTop:10 },
//   buttonDisabled: { opacity:0.7 },
//   buttonText: { color:"#fff",fontWeight:"bold" },
//   toggle:     { color:"#00bcd4",textAlign:"center",marginTop:15 },
//   error:      { color:"red",textAlign:"center",marginBottom:10 },
// });
// src/screens/Auth/RegisterScreen.js
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView,
  Alert
} from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { createUserProfile } from "../../models/userModel";

export default function RegisterScreen({ navigation }) {
  // Campos básicos de autenticación
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Campos adicionales de perfil
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validación de formulario
  const validateForm = () => {
    if (!firstName.trim()) {
      setError("Por favor ingresa tu nombre");
      return false;
    }
    if (!lastName.trim()) {
      setError("Por favor ingresa tu apellido");
      return false;
    }
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return false;
    }
    if (!phoneNumber.trim()) {
      setError("Por favor ingresa tu número de teléfono");
      return false;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // 1. Crear cuenta de usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Actualizar el perfil en Firebase Auth
      const displayName = `${firstName} ${lastName}`;
      await updateProfile(user, { displayName });
      
      // 3. Crear documento de usuario en Firestore
      const userProfile = createUserProfile(
        user.uid,
        email,
        displayName
      );
      
      // Añadir campos adicionales
      userProfile.firstName = firstName;
      userProfile.lastName = lastName;
      userProfile.phoneNumber = phoneNumber;
      
      // Guardar en Firestore
      await setDoc(doc(db, "users", user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 4. Navegar a la pantalla principal
      Alert.alert(
        "Registro exitoso",
        "Tu cuenta ha sido creada correctamente",
        [{ text: "OK", onPress: () => navigation.replace("Tabs") }]
      );
    } catch (err) {
      console.error("Error al registrar usuario:", err);
      
      // Manejar errores específicos de Firebase Auth
      if (err.code === 'auth/email-already-in-use') {
        setError("Este correo electrónico ya está en uso");
      } else if (err.code === 'auth/invalid-email') {
        setError("El formato del correo electrónico no es válido");
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña es demasiado débil");
      } else {
        setError("Error al crear la cuenta: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Crear cuenta</Text>
        
        {/* Campos de información personal */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Información personal</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Número de teléfono"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>
        
        {/* Campos de autenticación */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Datos de acceso</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Registrarse</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.toggle}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: { 
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f4f6f8" 
  },
  title: { 
    fontSize: 28,
    fontWeight: "bold",
    color: "#16222b",
    marginBottom: 20,
    textAlign: "center" 
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#16222b",
  },
  input: { 
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc" 
  },
  button: { 
    backgroundColor: "#16222b",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10 
  },
  buttonDisabled: { 
    opacity: 0.7 
  },
  buttonText: { 
    color: "#fff",
    fontWeight: "bold" 
  },
  toggle: { 
    color: "#00bcd4",
    textAlign: "center",
    marginTop: 15 
  },
  error: { 
    color: "red",
    textAlign: "center",
    marginBottom: 10 
  },
});
