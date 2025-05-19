// // src/screens/Auth/LoginScreen.js
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert, // Importamos Alert para usar en lugar de throw new Error
// } from "react-native";
// // Asegúrate de que 'auth' esté correctamente importado desde donde lo estés exportando ahora
// // Si seguiste la última sugerencia, podría ser de App.js o firebaseConfig.js
// import { auth } from "../../firebase/firebaseConfig"; // O desde "../../App" si lo exportaste allí

// export default function LoginScreen({ navigation }) {
//   // Puedes dejar el email por defecto si quieres para pruebas, o dejarlo vacío
//   const [email, setEmail] = useState(""); // Cambiado a vacío
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleLogin = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       await auth.signInWithEmailAndPassword(email.trim(), password);
//     } catch (e) {
//       // Mostrar el error al usuario
//       Alert.alert("Error al iniciar sesión", e.message);
//       setError(e.message); // Opcional: guardar el error en el estado para mostrarlo en la UI
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Iniciar sesión</Text>

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

//       {/* Mostrar el error si existe */}
//       {error ? <Text style={styles.error}>{error}</Text> : null}

//       <TouchableOpacity
//         style={[styles.button, loading && styles.buttonDisabled]}
//         onPress={handleLogin}
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.buttonText}>Ingresar</Text>
//         )}
//       </TouchableOpacity>

//       {/* Enlace para ir a la pantalla de registro (asegúrate de tener una ruta 'Register' en tu StackNavigator) */}
//       <TouchableOpacity onPress={() => navigation.navigate("Register")}>
//         <Text style={styles.toggle}>¿No tienes cuenta? Regístrate</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     padding: 20,
//     backgroundColor: "#f4f6f8",
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: "#16222b",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   input: {
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: "#ccc",
//   },
//   button: {
//     backgroundColor: "#16222b",
//     padding: 15,
//     borderRadius: 8,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonText: { color: "#fff", fontWeight: "bold" },
//   toggle: {
//     color: "#00bcd4",
//     textAlign: "center",
//     marginTop: 15,
//   },
//   error: {
//     color: "red",
//     textAlign: "center",
//     marginBottom: 10,
//   },
// });



// // src/screens/Auth/LoginScreen.js
// import React, { useState } from "react";
// import {
//   SafeAreaView,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Dimensions,
// } from "react-native";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";
// import { auth } from "../../firebase/firebaseConfig"; // o donde lo tengas exportado

// const { width: SCREEN_WIDTH } = Dimensions.get("window");

// export default function LoginScreen({ navigation }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     setLoading(true);
//     try {
//       await auth.signInWithEmailAndPassword(email.trim(), password);
//       // navegación al home u otra pantalla...
//     } catch (e) {
//       Alert.alert("Error al iniciar sesión", e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Ícono de carrito + título */}
//       <Icon name="cart-outline" size={64} color="#000" style={styles.logo} />
//       <Text style={styles.title}>Bienvenido</Text>

//       {/* Input Correo */}
//       <View style={styles.inputContainer}>
//         <Icon name="email-outline" size={24} color="#4F5B66" />
//         <TextInput
//           style={styles.input}
//           placeholder="Correo Electrónico"
//           placeholderTextColor="#4F5B66"
//           autoCapitalize="none"
//           keyboardType="email-address"
//           value={email}
//           onChangeText={setEmail}
//         />
//       </View>

//       {/* Input Contraseña */}
//       <View style={styles.inputContainer}>
//         <Icon name="lock-outline" size={24} color="#4F5B66" />
//         <TextInput
//           style={styles.input}
//           placeholder="Contraseña"
//           placeholderTextColor="#4F5B66"
//           secureTextEntry={!showPassword}
//           value={password}
//           onChangeText={setPassword}
//         />
//         <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
//           <Icon
//             name={showPassword ? "eye-off-outline" : "eye-outline"}
//             size={24}
//             color="#4F5B66"
//           />
//         </TouchableOpacity>
//       </View>

//       {/* Botón Iniciar Sesión */}
//       <TouchableOpacity
//         style={[styles.button, loading && styles.buttonDisabled]}
//         onPress={handleLogin}
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.buttonText}>Iniciar Sesión</Text>
//         )}
//       </TouchableOpacity>

//       {/* ¿Olvidaste tu contraseña? */}
//       <TouchableOpacity
//         onPress={() => navigation.navigate("ForgotPassword")}
//         style={styles.forgotContainer}
//       >
//         <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
//       </TouchableOpacity>

//       {/* Separador */}
//       <View style={styles.separator} />

//       {/* Registro */}
//       <View style={styles.registerContainer}>
//         <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
//         <TouchableOpacity onPress={() => navigation.navigate("Register")}>
//           <Text style={styles.registerLink}>Regístrate</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const ACCENT = "#055F68";        // color principal (teal)
// const BORDER = "#AAB3B9";        // color de borde de inputs
// const INPUT_BG = "#FFFFFF";      // fondo de inputs
// const PLACEHOLDER = "#4F5B66";   // color placeholder e iconos

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     paddingHorizontal: 24,
//     backgroundColor: "#F9F8F4",
//     justifyContent: "center",
//   },
//   logo: {
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: "bold",
//     color: "#000",
//     marginBottom: 32,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     width: SCREEN_WIDTH - 48,
//     height: 56,
//     backgroundColor: INPUT_BG,
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderColor: BORDER,
//     paddingHorizontal: 16,
//     marginBottom: 16,
//   },
//   input: {
//     flex: 1,
//     marginHorizontal: 8,
//     fontSize: 16,
//     color: "#000",
//   },
//   button: {
//     width: SCREEN_WIDTH - 48,
//     height: 56,
//     backgroundColor: ACCENT,
//     borderRadius: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonText: {
//     color: "#FFF",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   forgotContainer: {
//     marginTop: 16,
//   },
//   forgotText: {
//     color: ACCENT,
//     fontSize: 14,
//   },
//   separator: {
//     width: SCREEN_WIDTH - 48,
//     height: 1,
//     backgroundColor: "#D0D5DD",
//     marginVertical: 24,
//   },
//   registerContainer: {
//     flexDirection: "row",
//   },
//   registerText: {
//     fontSize: 14,
//     color: "#4F5B66",
//   },
//   registerLink: {
//     fontSize: 14,
//     color: ACCENT,
//     fontWeight: "bold",
//   },
// });


// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { signIn, authError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }
    try {
      await signIn(email.trim(), password);
      // La navegación se gestionará vía listener onAuthStateChanged
    } catch (e) {
      console.error('Error al iniciar sesión:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Icon name="cart-outline" size={64} color="#000" style={styles.logo} />
      <Text style={styles.title}>Bienvenido</Text>

      <View style={styles.inputContainer}>
        <Icon name="email-outline" size={24} color="#4F5B66" />
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          placeholderTextColor="#4F5B66"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock-outline" size={24} color="#4F5B66" />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#4F5B66"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
          <Icon
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={24}
            color="#4F5B66"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      {authError && <Text style={styles.errorText}>{authError}</Text>}

      <TouchableOpacity
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotContainer}
      >
        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ACCENT = '#055F68';
const BORDER = '#AAB3B9';
const INPUT_BG = '#FFFFFF';
const PLACEHOLDER = '#4F5B66';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F9F8F4',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SCREEN_WIDTH - 48,
    height: 56,
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
    color: '#000',
  },
  button: {
    width: SCREEN_WIDTH - 48,
    height: 56,
    backgroundColor: ACCENT,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotContainer: {
    marginTop: 16,
  },
  forgotText: {
    color: ACCENT,
    fontSize: 14,
  },
  separator: {
    width: SCREEN_WIDTH - 48,
    height: 1,
    backgroundColor: '#D0D5DD',
    marginVertical: 24,
  },
  registerContainer: {
    flexDirection: 'row',
  },
  registerText: {
    fontSize: 14,
    color: '#4F5B66',
  },
  registerLink: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});
