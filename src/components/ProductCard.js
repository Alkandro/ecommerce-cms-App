// import React, { useEffect, useState, useRef } from "react";
// import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated } from "react-native";
// import { fn } from "../utils";

// const { width: SCREEN_WIDTH } = Dimensions.get("window");
// const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 16) / 2;

// export function ProductCard({ product, onPress }) {
//   let imageUrl = product.image;
//   if (!imageUrl || typeof imageUrl !== "string") {
//     imageUrl = "https://via.placeholder.com/150";
//   }

//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     if (product.discount > 0) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, {
//             toValue: 1.1,
//             duration: 500,
//             useNativeDriver: true,
//           }),
//           Animated.timing(pulseAnim, {
//             toValue: 1,
//             duration: 500,
//             useNativeDriver: true,
//           }),
//         ])
//       ).start();
//     } else {
//       pulseAnim.setValue(1); // Reset animation if no discount
//     }
//   }, [product.discount, pulseAnim]);

//   const animatedPriceStyle = {
//     transform: [{ scale: pulseAnim }],
//   };

//   const content = (
//     <View style={styles.card}>
//       <Image
//         source={{ uri: imageUrl }}
//         style={styles.image}
//         resizeMode="cover"
//       />
//       <Text style={styles.title} numberOfLines={2}>
//         {product.title || product.name}
//       </Text>
//       <View style={styles.priceContainer}>
//         {product.discount > 0 ? (
//           <>
//             <View style={styles.oldPriceContainer}>
//               <Text style={[styles.oldPrice, styles.oldPriceDiscounted]}>{product.price}¥</Text>
//               <Text style={styles.discountPercentage}>
//                 -{product.discount}%
//               </Text>
//             </View>
//             <Animated.Text style={[styles.price, styles.newPriceDiscounted, animatedPriceStyle]}>
//               {fn.calcPrice(product.price, product.discount)}¥
//             </Animated.Text>
//           </>
//         ) : (
//           <Text style={styles.price}>{product.price}¥</Text>
//         )}
//       </View>
//     </View>
//   );

//   return onPress ? (
//     <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>
//   ) : (
//     content
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     width: CARD_WIDTH,
//     height: 230, // alto fijo para uniformidad
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     overflow: "hidden",

//     // sombras:
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 1.5,
//   },
//   image: {
//     width: "100%",
//     height: 120, // altura fija de imagen
//   },
//   title: {
//     fontSize: 14,
//     fontWeight: "bold",
//     padding: 8,
//     minHeight: 40, // espacio mínimo para dos líneas
//   },
//   priceContainer: {
//     flexDirection: "column", // Cambiamos a columna para apilar los precios
//     alignItems: "flex-start", // Alineamos los precios a la izquierda
//     paddingHorizontal: 8,
//     marginTop: 4,
//   },
//   oldPriceContainer: {
//     flexDirection: "row", // Para alinear precio antiguo y porcentaje
//     alignItems: "center",
//     marginBottom: 2,
//   },
//   oldPrice: {
//     textDecorationLine: "line-through",
//     color: "red",
//     fontSize: 12,
//     marginRight: 4, // Espacio entre el precio antiguo y el porcentaje
//   },
//   discountPercentage: {
//     fontSize: 12,
//     color: "green", // Puedes elegir el color que desees para el porcentaje
//     fontWeight: "bold",
//   },
//   price: {
//     fontSize: 16,
//     color: "#16222b",
//     fontWeight: "bold",
//   },
//   newPriceDiscounted: {
//     color: "blue", // Color azul para el precio nuevo con descuento
//   },
// });

// src/components/ProductCard.js

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { fn } from "../utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 16) / 2;

export function ProductCard({ product, onPress }) {
  // 1) Determinar imageUrl a partir de product.images o product.coverImage
  const imageUrl =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.coverImage
      ? product.coverImage
      : typeof product.image === "string"
      ? product.image
      : "https://via.placeholder.com/150";

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (product.discount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1); // Reset animation si no hay descuento
    }
  }, [product.discount, pulseAnim]);

  const animatedPriceStyle = {
    transform: [{ scale: pulseAnim }],
  };

  const content = (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

      <Text style={styles.title} numberOfLines={2}>
        {product.title || product.name}
      </Text>

      <View style={styles.priceContainer}>
        {product.discount > 0 ? (
          <>
            <View style={styles.oldPriceContainer}>
              <Text
                style={[styles.oldPrice, styles.oldPriceDiscounted]}
              >
                {product.price}¥
              </Text>
              <Text style={styles.discountPercentage}>
                -{product.discount}%
              </Text>
            </View>
            <Animated.Text
              style={[styles.price, styles.newPriceDiscounted, animatedPriceStyle]}
            >
              {fn.calcPrice(product.price, product.discount)}¥
            </Animated.Text>
          </>
        ) : (
          <Text style={styles.price}>{product.price}¥</Text>
        )}
      </View>
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 230,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  image: {
    width: "100%",
    height: 120,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    padding: 8,
    minHeight: 40,
  },
  priceContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 8,
    marginTop: 4,
  },
  oldPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  oldPrice: {
    textDecorationLine: "line-through",
    color: "red",
    fontSize: 12,
    marginRight: 4,
  },
  discountPercentage: {
    fontSize: 12,
    color: "green",
    fontWeight: "bold",
  },
  price: {
    fontSize: 16,
    color: "#16222b",
    fontWeight: "bold",
  },
  newPriceDiscounted: {
    color: "blue",
  },
});
