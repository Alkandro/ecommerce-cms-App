// // src/navigation/StackNavigator.js
// import React from "react";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { useAuth } from "../context/AuthContext";

// import LoginScreen from "../screens/Auth/LoginScreen";
// import RegisterScreen from "../screens/Auth/RegisterScreen";
// import TabNavigator from "./TabNavigator";
// import ProductScreen from "../screens/Product/ProductScreen";
// import OrderScreen from "../screens/Order/OrderScreen";
// import EditProfileScreen from "../screens/Profile/EditProfileScreen";
// import AddressesScreen from "../screens/Profile/AddressesScreen";
// import EditAddressScreen from "../screens/Profile/EditAddressScreen";
// import ProfileDetailsScreen from "../screens/Profile/ProfileDetailsScreen";
// import OrderHistoryScreen from "../screens/Order/OrderHistoryScreen";
// import NotificationsScreen from "../screens/Notifications/NotificationsScreen";
// import TermsConditionsScreen from "../screens/TermsConditionsScreen/TermsConditionsScreen";
// import HomeScreen from "../screens/Home/HomeScreen";
// import PaymentMethodsScreen from "../screens/Payments/PaymentMethodsScreen";
// import { SafeAreaProvider } from 'react-native-safe-area-context';

// const Stack = createNativeStackNavigator();

// export default function StackNavigator() {
//   const { user } = useAuth();

//   return (
//     <SafeAreaProvider>
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {!user ? (
//         <>
//           <Stack.Screen name="Login" component={LoginScreen} />
//           <Stack.Screen name="Register" component={RegisterScreen} />
//         </>
//       ) : (
//         <>
//           <Stack.Screen name="Tabs" component={TabNavigator} />
//           <Stack.Screen name="ProductDetail" component={ProductScreen} />
//           <Stack.Screen name="OrderScreen" component={OrderScreen} />
//           <Stack.Screen
//             name="EditProfileScreen"
//             component={EditProfileScreen}
//           />
//           <Stack.Screen
//             name="ProfileDetailsScreen"
//             component={ProfileDetailsScreen}
//           />
//           <Stack.Screen name="Notifications" component={NotificationsScreen} />
//           <Stack.Screen name="AddressesScreen" component={AddressesScreen} />
//           <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
//           <Stack.Screen name="HomeScreen" component={HomeScreen} />
//           <Stack.Screen
//             name="EditAddressScreen"
//             component={EditAddressScreen}
//           />
//           <Stack.Screen
//             name="PaymentMethods"
//             component={PaymentMethodsScreen}
//             options={{ title: "Métodos de Pago" }}
//           />

//           <Stack.Screen
//             name="TermsConditions"
//             component={TermsConditionsScreen}
//           />
//         </>
//       )}
//     </Stack.Navigator>
//     </SafeAreaProvider>
//   );
// }
// import React from "react";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { useAuth } from "../context/AuthContext";
// import { SafeAreaProvider } from "react-native-safe-area-context";

// import SplashScreen from "../screens/SplashScreen";
// import LoginScreen from "../screens/Auth/LoginScreen";
// import RegisterScreen from "../screens/Auth/RegisterScreen";
// import TabNavigator from "./TabNavigator";

// const Stack = createNativeStackNavigator();

// export default function StackNavigator() {
//   const { user, authDataLoaded } = useAuth();

//   return (
//     <SafeAreaProvider>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {!authDataLoaded ? (
//           <Stack.Screen name="Splash" component={SplashScreen} />
//           ) : !user ? (
//           <>
//             <Stack.Screen name="Login" component={LoginScreen} />
//             <Stack.Screen name="Register" component={RegisterScreen} />
//           </>
//         ) : (
//           <Stack.Screen name="Tabs" component={TabNavigator} />
//         )}
//       </Stack.Navigator>
//     </SafeAreaProvider>
//   );
// }
// src/navigation/StackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import TabNavigator from "./TabNavigator";
import ProductScreen from "../screens/Product/ProductScreen";
import OrderScreen from "../screens/Order/OrderScreen";
import EditProfileScreen from "../screens/Profile/EditProfileScreen";
import AddressesScreen from "../screens/Profile/AddressesScreen";
import EditAddressScreen from "../screens/Profile/EditAddressScreen";
import ProfileDetailsScreen from "../screens/Profile/ProfileDetailsScreen";
import OrderHistoryScreen from "../screens/Order/OrderHistoryScreen";
import NotificationsScreen from "../screens/Notifications/NotificationsScreen";
import TermsConditionsScreen from "../screens/TermsConditionsScreen/TermsConditionsScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import PaymentMethodsScreen from "../screens/Payments/PaymentMethodsScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const { user, isLoading } = useAuth(); // ← Usa isLoading en lugar de authDataLoaded

  return (
    <SafeAreaProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          // Muestra Splash mientras carga la autenticación
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !user ? (
          // Si no hay usuario, muestra Login/Register
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Si hay usuario, muestra las pantallas principales
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="ProductDetail" component={ProductScreen} />
            <Stack.Screen name="OrderScreen" component={OrderScreen} />
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
            <Stack.Screen name="ProfileDetailsScreen" component={ProfileDetailsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="AddressesScreen" component={AddressesScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="EditAddressScreen" component={EditAddressScreen} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: "Métodos de Pago" }} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
          </>
        )}
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}