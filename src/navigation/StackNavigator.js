// src/navigation/StackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth }              from "../context/AuthContext";
import LoginScreen              from "../screens/Auth/LoginScreen";
import RegisterScreen           from "../screens/Auth/RegisterScreen";
import TabNavigator             from "./TabNavigator";
import ProductScreen            from "../screens/Product/ProductScreen";
import EditProfileScreen        from "../screens/Profile/EditProfileScreen";
import AddressesScreen from "../screens/Profile/AddressesScreen";
import EditAddressScreen from "../screens/Profile/EditAddressScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
        // ⚠ Aquí incluimos Login _y_ Register
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs"           component={TabNavigator} />
          <Stack.Screen name="ProductDetail"  component={ProductScreen} />
          <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
          <Stack.Screen name="AddressesScreen" component={AddressesScreen} />
          <Stack.Screen name="EditAddressScreen" component={EditAddressScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

