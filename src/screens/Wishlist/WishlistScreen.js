// src/screens/Wishlist/WishlistScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions // Importa Dimensions
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-root-toast";
import { useAuth } from "../../context/AuthContext";
import { wishlistService } from "../../services/wishlist";
import { useCart } from "../../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { ProductCard } from "../../components/ProductCard";

// Obtén el ancho de la pantalla para calcular el tamaño de las tarjetas
const { width } = Dimensions.get("window");
const cardMargin = 8;
const numColumns = 2;
const cardWidth = (width / numColumns) - (cardMargin * numColumns); // Calcula el ancho de cada tarjeta

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
        columnWrapperStyle={products.length === 1 ? styles.singleColumnWrapper : null}
        contentContainerStyle={styles.listContent}
        numColumns={numColumns} // Define numColumns aquí
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
    padding: cardMargin, // Usamos el margen definido
  },
  cardWrapper: {
    width: cardWidth, // Usa el ancho calculado
    margin: cardMargin / 2, // Mitad del margen para distribuir bien entre las columnas
    position: "relative",
  },
  actionButtonsContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    zIndex: 1, // Asegura que los botones estén por encima del card
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
  // Nuevo estilo para cuando hay un solo producto y necesitas centrarlo
  singleColumnWrapper: {
    justifyContent: 'flex-start', // Centra el elemento en la fila
  },
});