// src/navigation/TabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/Home/HomeScreen";
import WishlistScreen from "../screens/Wishlist/WishlistScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import OrderScreen from "../screens/Order/OrderScreen"; // <-- **Importa OrderScreen**
import { Ionicons } from "@expo/vector-icons";

// Creamos un Stack Navigator específico para la pestaña Wishlist
const WishlistInternalStack = createNativeStackNavigator();

// Componente que define la pila de navegación para la pestaña Wishlist
function WishlistStackScreen() {
  return (
    <WishlistInternalStack.Navigator>
      <WishlistInternalStack.Screen
        name="WishlistMain"
        component={WishlistScreen}
        options={{
          headerShown: true,
          title: 'Lista de Deseos',
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: '#f4f6f8',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </WishlistInternalStack.Navigator>
  );
}

// Mantén tu TabNavigator principal
const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#16222b",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home-outline";
          if (route.name === "Wishlist") iconName = "heart-outline";
          if (route.name === "Order") iconName = "receipt-outline"; // <-- **Ícono para OrderScreen**
          if (route.name === "Settings") iconName = "settings-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wishlist" component={WishlistStackScreen} />
      <Tab.Screen
        name="Order" // <-- **Nombre de la pestaña**
        component={OrderScreen}
        options={{
          title: "Pedido", // <-- **Título de la pestaña**
        }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}