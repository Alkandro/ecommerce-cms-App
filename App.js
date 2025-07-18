import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { View, ActivityIndicator, StyleSheet, AppState } from "react-native";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from './src/firebase/firebaseConfig';
import { StripeProvider } from '@stripe/stripe-react-native';

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
    <StripeProvider
      publishableKey="pk_test_51QrcAFBArP6IIIPdt7cv4RNQWz5k49FXInfgZgcRJ9zwPuQFPKSlXPwiLJuzjl003PQBIA9zQkM8jVZW1eQzEtm500eYGOMRti" // <- tu clave pública aquí
      merchantIdentifier="merchant.com.tuapp" // requerido para Apple Pay (puede ser cualquier string único)
    >
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <InitialLoader />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  },
});
