// // src/navigation/TabNavigator.js
// import React from "react";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { TouchableOpacity } from "react-native";
// import { useNavigation } from '@react-navigation/native';
// import HomeScreen from "../screens/Home/HomeScreen";
// import WishlistScreen from "../screens/Wishlist/WishlistScreen";
// import SettingsScreen from "../screens/Settings/SettingsScreen";
// import OrderScreen from "../screens/Order/OrderScreen"; // <-- **Importa OrderScreen**
// import { Ionicons } from "@expo/vector-icons";

// // Creamos un Stack Navigator específico para la pestaña Wishlist
// const WishlistInternalStack = createNativeStackNavigator();

// // Componente que define la pila de navegación para la pestaña Wishlist
// function WishlistStackScreen() {
//   const navigation = useNavigation();

//   return (
//     <WishlistInternalStack.Navigator>
//       <WishlistInternalStack.Screen
//         name="WishlistMain"
//         component={WishlistScreen}
//         options={{
//           headerShown: true,
//           title: 'Lista de Deseos',
//           headerBackTitleVisible: false,
//           headerStyle: {
//             backgroundColor: '#f4f6f8',
//           },
//           headerTintColor: '#000',
//           headerTitleStyle: {
//             fontWeight: 'bold',
//           },
//           headerLeft: () => (
//              <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} 
//              style={{ marginLeft: 15 }}
//            >
//              <Ionicons name="arrow-back" size={24} color="#000" />
//              </TouchableOpacity>
//            ),
//         }}
//       />
//     </WishlistInternalStack.Navigator>
//   );
// }

// // Mantén tu TabNavigator principal
// const Tab = createBottomTabNavigator();

// export default function TabNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarActiveTintColor: "blue",
//         tabBarInactiveTintColor: "gray",
        
//         tabBarIcon: ({ color, size }) => {
//           let iconName;
//           if (route.name === "Home") iconName = "home-outline";
//           if (route.name === "Wishlist") iconName = "heart-outline";
//           if (route.name === "Order") iconName = "receipt-outline"; // <-- **Ícono para OrderScreen**
//           if (route.name === "Settings") iconName = "settings-outline";
//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//       })}
//     >
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="Wishlist" component={WishlistStackScreen} />
//       <Tab.Screen
//         name="Order" // <-- **Nombre de la pestaña**
//         component={OrderScreen}
//         options={{
//           title: "Pedido", // <-- **Título de la pestaña**
//         }}
//       />
//       <Tab.Screen name="Settings" component={SettingsScreen} />
//     </Tab.Navigator>
//   );
// }

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeStackScreen from "./HomeStack";
import WishlistStackScreen from "./WishlistStack";
import OrderStackScreen from "./OrderStack";
import SettingsStackScreen from "./SettingsStack";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === "Home") icon = "home-outline";
          if (route.name === "Wishlist") icon = "heart-outline";
          if (route.name === "Order") icon = "receipt-outline";
          if (route.name === "Settings") icon = "settings-outline";
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Wishlist" component={WishlistStackScreen} />
      <Tab.Screen name="Order" component={OrderStackScreen} options={{ title: "Pedido" }} />
      <Tab.Screen name="Settings" component={SettingsStackScreen} />
    </Tab.Navigator>
  );
}
