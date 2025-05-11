// src/components/ProductCard.js
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
// import { fn } from "../utils"; // tu helper calcPrice

export function ProductCard({ product }) {
  // extraemos la URL de la imagen principal
  let imageUrl = "";
  if (product.main_image) {
    // si viene de Strapi con data.attributes.url
    imageUrl =
      product.main_image.data?.attributes?.url ||
      product.main_image.url ||
      product.main_image;
  }
  if (!imageUrl) {
    imageUrl = "https://via.placeholder.com/150";
  }

  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <Text style={styles.title} numberOfLines={2}>
        {product.title}
      </Text>
      <View style={styles.priceContainer}>
        {product.discount ? (
          <Text style={styles.oldPrice}>{product.price}€</Text>
        ) : null}
        <Text style={styles.price}>
          {fn.calcPrice(product.price, product.discount)}€
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 120,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    padding: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  oldPrice: {
    textDecorationLine: "line-through",
    color: "#888",
    marginRight: 6,
  },
  price: {
    fontSize: 16,
    color: "#16222b",
    fontWeight: "bold",
  },
});
