import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SettingsScreen from "../screens/Settings/SettingsScreen";
import ProfileDetailsScreen from "../screens/Profile/ProfileDetailsScreen";
import EditProfileScreen from "../screens/Profile/EditProfileScreen";
import AddressesScreen from "../screens/Profile/AddressesScreen";
import EditAddressScreen from "../screens/Profile/EditAddressScreen";
import NotificationsScreen from "../screens/Notifications/NotificationsScreen";
import TermsConditionsScreen from "../screens/TermsConditionsScreen/TermsConditionsScreen";
import PaymentMethodsScreen from "../screens/Payments/PaymentMethodsScreen";

const SettingsStack = createNativeStackNavigator();

export default function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      <SettingsStack.Screen name="EditProfile" component={EditProfileScreen} />
      <SettingsStack.Screen name="Addresses" component={AddressesScreen} />
      <SettingsStack.Screen name="EditAddress" component={EditAddressScreen} />
      <SettingsStack.Screen name="Notifications" component={NotificationsScreen} />
      <SettingsStack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <SettingsStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    </SettingsStack.Navigator>
  );
}
