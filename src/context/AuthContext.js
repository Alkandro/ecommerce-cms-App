// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateAuthProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { userProfileService } from '../services/firestoreService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Escucha los cambios de autenticación y carga el perfil
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profile = await userProfileService.getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error cargando perfil:', error);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // Iniciar sesión
  const signIn = async (email, password) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Registrar usuario
  const signUp = async (email, password, displayName) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateAuthProfile(cred.user, { displayName });
      }
      await userProfileService.createUserProfile(cred.user.uid, { email, displayName });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setAuthError(error.message);
    }
  };

  // Actualizar perfil en Auth y Firestore
  const updateProfile = async (data) => {
    if (!auth.currentUser) return false;
    try {
      if (data.displayName) {
        await updateAuthProfile(auth.currentUser, { displayName: data.displayName });
      }
      await userProfileService.updateUserProfile(auth.currentUser.uid, data);
      const profile = await userProfileService.getUserProfile(auth.currentUser.uid);
      setUserProfile(profile);
      return true;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return false;
    }
  };

  // Refrescar manualmente el perfil de Firestore
  const refreshUserProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const profile = await userProfileService.getUserProfile(auth.currentUser.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error refrescando perfil:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        authError,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshUserProfile,
        setAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
