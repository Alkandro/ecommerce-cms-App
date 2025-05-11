// src/screens/Wishlist/WishlistScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-root-toast";
import { useAuth } from "../../context/AuthContext";
// import { wishlistCtrl } from "../../api";
import { ProductCard } from "../../components/ProductCard";
import { Ionicons } from "@expo/vector-icons";

export default function WishlistScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const response = await wishlistCtrl.getAllProducts(user.id);
      // mapea tu respuesta para sacar directamente atributos del producto
      const items = response.data.map((entry) => {
        const attr = entry.product.data.attributes;
        return {
          id: entry.id,
          slug: attr.slug,
          title: attr.title,
          price: attr.price,
          discount: attr.discount,
          main_image: attr.main_image,
          // añade más campos si los necesitas...
        };
      });
      setProducts(items);
    } catch (error) {
      Toast.show("Error al cargar favoritos", {
        position: Toast.positions.CENTER,
      });

    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (slug) => {
    try {
      await wishlistCtrl.delete(user.id, slug);
      Toast.show("Eliminado de favoritos", {
        position: Toast.positions.CENTER,
      });
      loadWishlist();
    } catch (error) {
      Toast.show("No se pudo eliminar", {
        position: Toast.positions.CENTER,
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("ProductDetail", { slug: item.slug })
        }
      >
        <ProductCard product={item} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => handleRemove(item.slug)}
      >
        <Ionicons name="trash-outline" size={24} color="#e53935" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16222b" />
      </View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No tienes productos en favoritos</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.slug}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        numColumns={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  listContent: {
    padding: 8,
  },
  cardWrapper: {
    flex: 1,
    margin: 8,
    position: "relative",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});
