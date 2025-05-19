// // src/services/firebaseAuth.js
// import { auth } from "../firebase/firebaseConfig";

// // Función para registrar un nuevo usuario
// const signUp = (email, password) => {
//   return auth.createUserWithEmailAndPassword(email, password);
// };

// // Función para iniciar sesión
// const signIn = (email, password) => {
//   return auth.signInWithEmailAndPassword(email, password);
// };

// // Función para cerrar sesión
// const logOut = () => {
//   return auth.signOut();
// };

// // Función para observar cambios en el estado de autenticación
// const observeAuthState = (callback) => {
//   return auth.onAuthStateChanged(callback);
// };

// // Función para actualizar el perfil del usuario en Firebase Auth
// const updateProfile = (profileData) => {
//   if (!auth.currentUser) {
//     return Promise.reject(new Error("No hay usuario autenticado"));
//   }
//   return auth.currentUser.updateProfile(profileData);
// };

// export const firebaseAuthService = {
//   signUp,
//   signIn,
//   logOut,
//   observeAuthState,
//   updateProfile
// };
// src/services/firebaseAuth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateAuthProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

export const firebaseAuthService = {
  signIn:         (email, pass) => signInWithEmailAndPassword(auth, email, pass),
  signUp:         (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
  updateProfile:  (profile) => updateAuthProfile(auth.currentUser, profile),
  logOut:         () => signOut(auth),
  observeAuthState: (cb) => onAuthStateChanged(auth, cb),
};
