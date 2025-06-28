import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WishlistScreen from "../screens/Wishlist/WishlistScreen";

const WishlistStack = createNativeStackNavigator();

export default function WishlistStackScreen() {
  return (
    <WishlistStack.Navigator screenOptions={{ headerShown: false }}>
      <WishlistStack.Screen name="WishlistMain" component={WishlistScreen} />
    </WishlistStack.Navigator>
  );
}
