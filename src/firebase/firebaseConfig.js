// // src/firebase/firebaseConfig.js
// import firebase from "firebase/compat/app";
// import "firebase/compat/auth";
// import "firebase/compat/firestore";
// import "firebase/compat/storage"; 

// const firebaseConfig = {
//   apiKey: "AIzaSyCi_C7T1iIayYfiq6g45MTj1qAmsbsiYRI",
//   authDomain: "ecommerce-cms-578f4.firebaseapp.com",
//   databaseURL: "https://ecommerce-cms-578f4-default-rtdb.firebaseio.com",
//   projectId: "ecommerce-cms-578f4",
//   storageBucket: "ecommerce-cms-578f4.appspot.com",
//   messagingSenderId: "609199158290",
//   appId: "1:609199158290:web:68029b4ccd8307648254cb",
// };

// // Si ya está inicializada, no la vuelvas a inicializar
// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// }

// export const auth = firebase.auth();
// export const db   = firebase.firestore();
// export const storage = firebase.storage();


// src/firebase/firebaseConfig.js
// src/firebase/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage }   from 'firebase/storage';
import AsyncStorage     from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCi_C7T1iIayYfiq6g45MTj1qAmsbsiYRI",
  authDomain: "ecommerce-cms-578f4.firebaseapp.com",
  databaseURL: "https://ecommerce-cms-578f4-default-rtdb.firebaseio.com",
  projectId: "ecommerce-cms-578f4",
  storageBucket: "ecommerce-cms-578f4.firebasestorage.app",
  messagingSenderId: "609199158290",
  appId: "1:609199158290:web:68029b4ccd8307648254cb"
};

// 1) Inicializa la app
const app = initializeApp(firebaseConfig);

// 2) Inicializa Auth **una sola vez**, con persistencia en AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// 3) Resto de servicios
export const db      = getFirestore(app);
export const storage = getStorage(app);
