// src/screens/Auth/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

export default function RegisterScreen({ navigation }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.replace("Tabs"); // ó navigation.navigate("Login")
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

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
  );
}
// Reusa los mismos estilos que en LoginScreen
const styles = StyleSheet.create({
  container:  { flex:1,justifyContent:"center",padding:20,backgroundColor:"#f4f6f8" },
  title:      { fontSize:28,fontWeight:"bold",color:"#16222b",marginBottom:20,textAlign:"center" },
  input:      { backgroundColor:"#fff",borderRadius:8,padding:12,marginBottom:15,borderWidth:1,borderColor:"#ccc" },
  button:     { backgroundColor:"#16222b",padding:15,borderRadius:8,alignItems:"center",marginTop:10 },
  buttonDisabled: { opacity:0.7 },
  buttonText: { color:"#fff",fontWeight:"bold" },
  toggle:     { color:"#00bcd4",textAlign:"center",marginTop:15 },
  error:      { color:"red",textAlign:"center",marginBottom:10 },
});
