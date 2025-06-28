import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OrderScreen from "../screens/Order/OrderScreen";
import OrderHistoryScreen from "../screens/Order/OrderHistoryScreen";
import PaymentMethodsScreen from "../screens/Payments/PaymentMethodsScreen";

const OrderStack = createNativeStackNavigator();

export default function OrderStackScreen() {
  return (
    <OrderStack.Navigator screenOptions={{ headerShown: false }}>
      <OrderStack.Screen name="OrderMain" component={OrderScreen} />
      <OrderStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <OrderStack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ title: "Métodos de Pago" }}
      />
    </OrderStack.Navigator>
  );
}
