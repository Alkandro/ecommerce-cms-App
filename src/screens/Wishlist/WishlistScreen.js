// src/screens/Wishlist/WishlistScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-root-toast";
import { useAuth } from "../../context/AuthContext";
import { wishlistService } from "../../services/wishlist";
import { useCart } from "../../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { ProductCard } from "../../components/ProductCard";

export default function WishlistScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigation = useNavigation();
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadWishlist();
      } else {
        setProducts([]);
        setLoading(false);
      }
    }, [user])
  );

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await wishlistService.getAllWishlistProducts(
        user.uid
      );
      // AÑADE ESTA LÍNEA PARA DEPURAR
      console.log("Productos fetched de Wishlist:", fetchedProducts.map(p => p.id));
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error al cargar favoritos desde Firebase:", error);
      Toast.show("Error al cargar favoritos", {
        position: Toast.positions.CENTER,
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistService.removeProductFromWishlist(user.uid, productId);
      Toast.show("Eliminado de favoritos", {
        position: Toast.positions.CENTER,
      });
      loadWishlist();
    } catch (error) {
      console.error("Error al eliminar de favoritos:", error);
      Toast.show("No se pudo eliminar", {
        position: Toast.positions.CENTER,
      });
    }
  };

  const handleAddToCartFromWishlist = async (productToAdd) => {
    if (!productToAdd) return;

    try {
      addToCart(productToAdd);
      await wishlistService.removeProductFromWishlist(user.uid, productToAdd.id);
      Toast.show(`${productToAdd.name} añadido al carrito y eliminado de favoritos.`, {
        position: Toast.positions.CENTER,
      });
      loadWishlist();
    } catch (error) {
      console.error("Error al añadir al carrito desde favoritos:", error);
      Toast.show("No se pudo añadir al carrito.", {
        position: Toast.positions.CENTER,
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("ProductDetail", { product: item })
        }
      >
        <ProductCard product={item} />
      </TouchableOpacity>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#e53935" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={() => handleAddToCartFromWishlist(item)}
        >
          <Ionicons name="cart-outline" size={24} color="#16222b" />
        </TouchableOpacity>
      </View>
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
        {user ? (
          <Text style={styles.emptyText}>¡Añade algunos!</Text>
        ) : (
          <Text style={styles.emptyText}>
            Inicia sesión para ver tus favoritos.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
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
  actionButtonsContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
  },
  removeBtn: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: 4,
    marginLeft: 5,
  },
  addToCartBtn: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: 4,
    marginLeft: 5,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
});