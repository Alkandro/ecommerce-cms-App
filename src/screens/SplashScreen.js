// src/screens/SplashScreen.js
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const SplashScreen = () => {
  const translateX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    // Solo animación - la navegación es automática
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: width,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -200,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../../assets/cart.png")}
        style={[styles.cart, { transform: [{ translateX }] }]}
        resizeMode="contain"
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
  },
  cart: {
    width: 120,
    height: 120,
    position: "absolute",
    bottom: 80,
  },
});