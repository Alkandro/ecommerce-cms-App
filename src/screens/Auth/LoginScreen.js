// src/screens/Auth/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert, // Importamos Alert para usar en lugar de throw new Error
} from "react-native";
// Asegúrate de que 'auth' esté correctamente importado desde donde lo estés exportando ahora
// Si seguiste la última sugerencia, podría ser de App.js o firebaseConfig.js
import { auth } from "../../firebase/firebaseConfig"; // O desde "../../App" si lo exportaste allí

export default function LoginScreen({ navigation }) {
  // Puedes dejar el email por defecto si quieres para pruebas, o dejarlo vacío
  const [email, setEmail] = useState(""); // Cambiado a vacío
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await auth.signInWithEmailAndPassword(email.trim(), password);
    } catch (e) {
      // Mostrar el error al usuario
      Alert.alert("Error al iniciar sesión", e.message);
      setError(e.message); // Opcional: guardar el error en el estado para mostrarlo en la UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

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

      {/* Mostrar el error si existe */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Ingresar</Text>
        )}
      </TouchableOpacity>

      {/* Enlace para ir a la pantalla de registro (asegúrate de tener una ruta 'Register' en tu StackNavigator) */}
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.toggle}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f4f6f8",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#16222b",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  button: {
    backgroundColor: "#16222b",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  toggle: {
    color: "#00bcd4",
    textAlign: "center",
    marginTop: 15,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});
