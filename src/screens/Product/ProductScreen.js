import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";

export default function ProductScreen({ route, navigation }) {
  const { product } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>
          ${product.price}{" "}
          {product.discount > 0 && (
            <Text style={styles.discount}>(-{product.discount}%)</Text>
          )}
        </Text>
        <Text style={styles.description}>{product.description}</Text>

        {product.tags?.length > 0 && (
          <View style={styles.tagsContainer}>
            {product.tags.map((tag, index) => (
              <Text key={index} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={() => alert("Agregar a favoritos")}>
          <Text style={styles.buttonText}>Agregar a favoritos ❤️</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  info: {
    padding: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    color: "#444",
  },
  discount: {
    color: "#f44336",
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    marginTop: 15,
    color: "#555",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  tag: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#16222b",
    marginTop: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
});
