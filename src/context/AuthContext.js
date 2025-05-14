// src/context/AuthContext.js
import React, { createContext, useEffect, useState, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";  // ← aquí

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Este listener se dispara:
    // 1. Inmediatamente después de que Firebase verifica la sesión persistente al inicio de la app
    // 2. Cada vez que el usuario inicia sesión o cierra sesión
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
      console.log("Firebase auth state changed:", firebaseUser ? "User logged in" : "No user"); // Log para depurar
      setUser(firebaseUser); // Actualiza el estado del usuario
      setLoading(false); // <-- Desactiva la carga una vez que el estado inicial es conocido
    });
    return unsubscribe;
  }, []);
  const value = {
    user,
    loading, // <-- Exponemos el estado de carga
  };
  return (
    <AuthContext.Provider value={ value }>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
