// // App.js
// import React, { useEffect, useRef } from "react"; // Importa 'useRef'
// import { NavigationContainer } from "@react-navigation/native";
// import StackNavigator from "./src/navigation/StackNavigator";
// import { AuthProvider, useAuth } from "./src/context/AuthContext";
// import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native'; // Importa AppState
// import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'; // Importa Firestore
// import { db } from './src/firebase/firebaseConfig'; // Asegúrate de que esta ruta es correcta

// function InitialLoader() {
//   const { loading, user } = useAuth(); // Obtenemos el estado de carga Y el objeto 'user'
//   const appState = useRef(AppState.currentState); // Para rastrear el estado de la aplicación
//   const intervalRef = useRef(null); // Para guardar la referencia al temporizador de actualización

//   // Función para actualizar la marca de tiempo 'updatedAt' del usuario
//   const updateLastSeen = async () => {
//     if (user && user.uid) { // Solo si hay un usuario logueado
//       try {
//         const userRef = doc(db, 'users', user.uid);
//         await updateDoc(userRef, {
//           updatedAt: serverTimestamp(), // Esto actualiza el campo con la marca de tiempo del servidor
//         });
//         // console.log(`Usuario ${user.uid} - updatedAt actualizado`); // Puedes descomentar para depurar
//       } catch (error) {
//         console.error('Error al actualizar lastSeen:', error);
//       }
//     }
//   };

//   useEffect(() => {
//     // Manejar los cambios de estado de la aplicación (primer plano, segundo plano)
//     const handleAppStateChange = (nextAppState) => {
//       if (
//         appState.current.match(/inactive|background/) &&
//         nextAppState === 'active'
//       ) {
//         // La app ha vuelto al primer plano, actualiza inmediatamente el estado del usuario
//         updateLastSeen();
//       }
//       appState.current = nextAppState;
//     };

//     // Suscribirse a los cambios de AppState
//     const subscription = AppState.addEventListener('change', handleAppStateChange);

//     // Iniciar la lógica de presencia cuando el usuario está logueado
//     if (user && user.uid) {
//       updateLastSeen(); // Actualizar inmediatamente al iniciar o reconectar

//       // Configurar un temporizador para actualizar cada 5 minutos
//       intervalRef.current = setInterval(updateLastSeen, 5 * 60 * 1000); // 5 minutos = 300,000 ms

//     } else {
//       // Si no hay usuario (deslogueado o aún cargando), limpiar cualquier temporizador existente
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     }

//     // Función de limpieza para cuando el componente se desmonte o las dependencias cambien
//     return () => {
//       subscription.remove(); // Desuscribirse de los cambios de AppState
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current); // Limpiar el temporizador
//         intervalRef.current = null;
//       }
//     };
//   }, [user]); // Este useEffect se ejecuta cuando el objeto 'user' cambia

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#16222b" />
//         {/* <Text>Cargando sesión...</Text> */}
//       </View>
//     );
//   }

//   return <StackNavigator />;
// }


// export default function App() {
//   return (
//     <AuthProvider>
//       <NavigationContainer>
//         <InitialLoader />
//       </NavigationContainer>
//     </AuthProvider>
//   );
// }

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f4f6f8',
//   },
// });

// App.js
import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
// import { SearchProvider } from "./src/context/SearchContext";
import { View, ActivityIndicator, StyleSheet, AppState } from "react-native";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from './src/firebase/firebaseConfig';

function InitialLoader() {
  const { loading, user } = useAuth();
  const appState = useRef(AppState.currentState);
  const intervalRef = useRef(null);

  const updateLastSeen = async () => {
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { updatedAt: serverTimestamp() });
      } catch (error) {
        console.error('Error al actualizar lastSeen:', error);
      }
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        updateLastSeen();
      }
      appState.current = nextAppState;
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);

    if (user?.uid) {
      updateLastSeen();
      intervalRef.current = setInterval(updateLastSeen, 5 * 60 * 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => {
      sub.remove();
      clearInterval(intervalRef.current);
    };
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16222b" />
      </View>
    );
  }
  return <StackNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      {/* Ahora envuelves también con SearchProvider y CartProvider */}
      {/* <SearchProvider> */}
        <CartProvider>
          <NavigationContainer>
            <InitialLoader />
          </NavigationContainer>
        </CartProvider>
      {/* </SearchProvider> */}
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8',
  },
});
