// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
// Importa AuthProvider y useAuth
import { AuthProvider, useAuth } from "./src/context/AuthContext";
// Importa View y ActivityIndicator para la pantalla de carga
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Este es un componente que espera a que el estado de autenticación cargue
function InitialLoader() {
  const { loading } = useAuth(); // Obtenemos el estado de carga del contexto

  if (loading) {
    // Si está cargando, mostramos un indicador (o tu splash screen)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16222b" />
        {/* <Text>Cargando sesión...</Text> */}
      </View>
    );
  }

  // Una vez que la carga termina, renderizamos el StackNavigator
  // El StackNavigator decidirá si mostrar Login o Tabs basado en si 'user' es null o no
  return <StackNavigator />;
}


export default function App() {
  return (
    // AuthProvider envuelve todo para dar contexto de auth
    <AuthProvider>
      {/* NavigationContainer maneja el estado de navegación */}
      <NavigationContainer>
        {/* Nuestro componente InitialLoader es el primer contenido dentro del navegador,
            decidirá qué mostrar (carga o StackNavigator) */}
        <InitialLoader />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8', // Un color de fondo
  },
});