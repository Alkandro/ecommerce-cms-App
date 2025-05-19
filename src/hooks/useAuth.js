// import React, { createContext, useState, useEffect, useContext } from 'react';
// import { firebaseAuthService } from '../services/firebaseAuth';
// import { userProfileService } from '../services/firestoreService';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [userProfile, setUserProfile] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [authError, setAuthError] = useState(null);

//   // Cargar perfil de usuario desde Firestore
//   const loadUserProfile = async (userId) => {
//     try {
//       const profile = await userProfileService.getUserProfile(userId);
//       if (profile) {
//         setUserProfile(profile);
//         // Guardar en AsyncStorage para persistencia
//         await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
//       }
//       return profile;
//     } catch (error) {
//       console.error("Error al cargar perfil de usuario:", error);
//       return null;
//     }
//   };

//   useEffect(() => {
//     // Verificar si hay datos de usuario guardados en AsyncStorage
//     const checkPersistedAuth = async () => {
//       try {
//         const storedUser = await AsyncStorage.getItem('authUser');
//         const storedProfile = await AsyncStorage.getItem('userProfile');
        
//         if (storedUser) {
//           const parsedUser = JSON.parse(storedUser);
//           setUser(parsedUser);
          
//           if (storedProfile) {
//             setUserProfile(JSON.parse(storedProfile));
//           }
//         }
//       } catch (e) {
//         console.error("Error al cargar datos de usuario desde AsyncStorage:", e);
//       }
//     };
    
//     checkPersistedAuth();

//     // Escuchar cambios en el estado de autenticación de Firebase
//     const unsubscribe = firebaseAuthService.observeAuthState(async (firebaseUser) => {
//       if (firebaseUser) {
//         // Usuario autenticado
//         const authUser = {
//           uid: firebaseUser.uid,
//           email: firebaseUser.email,
//           displayName: firebaseUser.displayName,
//           photoURL: firebaseUser.photoURL,
//         };
        
//         setUser(authUser);
        
//         // Guardar en AsyncStorage
//         await AsyncStorage.setItem('authUser', JSON.stringify(authUser));
        
//         // Cargar perfil extendido desde Firestore
//         const profile = await loadUserProfile(firebaseUser.uid);
        
//         // Si no existe perfil en Firestore, crearlo
//         if (!profile) {
//           const newProfile = await userProfileService.createUserProfile(
//             firebaseUser.uid,
//             {
//               email: firebaseUser.email,
//               displayName: firebaseUser.displayName || "",
//               photoURL: firebaseUser.photoURL || "",
//             }
//           );
          
//           setUserProfile(newProfile);
//           await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
//         }
//       } else {
//         // Usuario no autenticado
//         setUser(null);
//         setUserProfile(null);
        
//         // Limpiar datos de AsyncStorage
//         await AsyncStorage.removeItem('authUser');
//         await AsyncStorage.removeItem('userProfile');
//       }
      
//       setIsLoading(false);
//     });

//     // Limpiar suscripción al desmontar
//     return () => unsubscribe();
//   }, []);

//   // Iniciar sesión
//   const signIn = async (email, password) => {
//     setAuthError(null);
//     setIsLoading(true);
//     try {
//       await firebaseAuthService.signIn(email, password);
//       // El estado de usuario se actualizará mediante el listener de Firebase Auth
//     } catch (error) {
//       console.error("Error al iniciar sesión:", error);
//       setAuthError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
//       setUser(null);
//       setUserProfile(null);
//       await AsyncStorage.removeItem('authUser');
//       await AsyncStorage.removeItem('userProfile');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Registrar usuario
//   const signUp = async (email, password, userData = {}) => {
//     setAuthError(null);
//     setIsLoading(true);
//     try {
//       const userCredential = await firebaseAuthService.signUp(email, password);
      
//       // Actualizar displayName si se proporciona
//       if (userData.displayName) {
//         await firebaseAuthService.updateProfile({
//           displayName: userData.displayName
//         });
//       }
      
//       // Crear perfil en Firestore
//       await userProfileService.createUserProfile(userCredential.user.uid, {
//         email,
//         ...userData
//       });
      
//       // El estado de usuario se actualizará mediante el listener de Firebase Auth
//     } catch (error) {
//       console.error("Error al registrar usuario:", error);
//       setAuthError(error.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
//       setUser(null);
//       setUserProfile(null);
//       await AsyncStorage.removeItem('authUser');
//       await AsyncStorage.removeItem('userProfile');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Cerrar sesión
//   const signOut = async () => {
//     setAuthError(null);
//     try {
//       await firebaseAuthService.logOut();
//       // El estado de usuario se actualizará mediante el listener de Firebase Auth
//     } catch (error) {
//       console.error("Error al cerrar sesión:", error);
//       setAuthError(error.message || 'Error al cerrar sesión.');
//     }
//   };

//   // Actualizar perfil de usuario
//   const updateProfile = async (userData) => {
//     if (!user) return false;
    
//     try {
//       // Actualizar en Firestore
//       await userProfileService.updateUserProfile(user.uid, userData);
      
//       // Actualizar estado local
//       const updatedProfile = await loadUserProfile(user.uid);
      
//       // Si se actualizó el displayName, actualizar también en Firebase Auth
//       if (userData.displayName) {
//         await firebaseAuthService.updateProfile({
//           displayName: userData.displayName
//         });
        
//         // Actualizar usuario local
//         setUser(prev => ({
//           ...prev,
//           displayName: userData.displayName
//         }));
        
//         // Actualizar en AsyncStorage
//         const storedUser = await AsyncStorage.getItem('authUser');
//         if (storedUser) {
//           const parsedUser = JSON.parse(storedUser);
//           parsedUser.displayName = userData.displayName;
//           await AsyncStorage.setItem('authUser', JSON.stringify(parsedUser));
//         }
//       }
      
//       return true;
//     } catch (error) {
//       console.error("Error al actualizar perfil:", error);
//       return false;
//     }
//   };

//   // Valor del contexto
//   const value = {
//     user,
//     userProfile,
//     isLoading,
//     authError,
//     signIn,
//     signUp,
//     signOut,
//     updateProfile,
//     setAuthError,
//     refreshUserProfile: () => loadUserProfile(user?.uid)
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
