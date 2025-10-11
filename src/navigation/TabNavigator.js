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
