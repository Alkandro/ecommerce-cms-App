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
// Ajuste el cálculo del ancho de la tarjeta para que quede más centrado y ancho.
// Se restan los márgenes de cada lado de la tarjeta, y un pequeño ajuste extra.
const cardWidth = (width / numColumns) - (cardMargin * 2) - 5;


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

  // --- MODIFICACIÓN CLAVE AQUÍ: handleRemove SOLO ELIMINA ---
  const handleRemove = async (productId) => {
    try {
      await wishlistService.removeProductFromWishlist(user.uid, productId);
      Toast.show("Eliminado de favoritos", {
        position: Toast.positions.CENTER,
      });
      loadWishlist(); // Volver a cargar la lista después de la eliminación
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
      // Aquí está bien que elimine de la lista de deseos después de añadir al carrito
      await wishlistService.removeProductFromWishlist(user.uid, productToAdd.id);
      Toast.show(`${productToAdd.name} añadido al carrito y eliminado de favoritos.`, {
        position: Toast.positions.CENTER,
      });
      loadWishlist(); // Volver a cargar la lista para reflejar el cambio
    } catch (error) {
      console.error("Error al añadir al carrito desde favoritos:", error);
      Toast.show("No se pudo añadir al carrito.", {
        position: Toast.positions.CENTER,
      });
    }
  };

  const renderItem = ({ item }) => (
    // Aplica el margen a los lados del card directamente aquí
    <View style={[styles.cardWrapper, { marginLeft: cardMargin, marginRight: cardMargin }]}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("ProductDetail", { product: item })
        }
        style={{ flex: 1 }} // Asegura que el TouchableOpacity ocupe el espacio
      >
        <ProductCard product={item} />
      </TouchableOpacity>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(item.id)} // Este solo elimina
        >
          <Ionicons name="trash-outline" size={24} color="#e53935" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={() => handleAddToCartFromWishlist(item)} // Este añade y luego elimina
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
        // columnWrapperStyle para distribuir los cards uniformemente
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false} // Para una mejor experiencia de usuario
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
    padding: cardMargin, // Padding general de la lista
  },
  cardWrapper: {
    width: cardWidth, // Usa el ancho calculado
    // Eliminamos el marginHorizontal aquí para aplicarlo directamente en renderItem
    marginBottom: 16, // Espacio entre filas
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    // Sombra para Android
    elevation: 5,
    borderColor: "#e0e0e0",
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionButtonsContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    zIndex: 1,
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
  // Nuevo estilo para columnWrapperStyle
  columnWrapper: {
    justifyContent: 'space-between', // Distribuye el espacio uniformemente entre los elementos
  },
  // Mantén singleColumnWrapper si necesitas un comportamiento diferente para un solo elemento
  singleColumnWrapper: {
    justifyContent: 'flex-start', // O 'center' si prefieres centrarlo completamente
  },
});