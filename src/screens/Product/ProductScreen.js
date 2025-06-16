// src/screens/Product/ProductScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  ScrollView, // <-- Importamos ScrollView para las miniaturas
} from "react-native";
import COLORS from "../../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { wishlistService } from "../../services/wishlist";
import { useCart } from "../../context/CartContext";
import Toast from "react-native-root-toast";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProductScreen({ route, navigation }) {
  const { product } = route.params;
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Ref para controlar el FlatList del carrusel
  const flatListRef = useRef(null);

  // Animated value para el precio con descuento
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
      pulseAnim.setValue(1);
    }
  }, [product.discount, pulseAnim]);

  const animatedPriceStyle = {
    transform: [{ scale: pulseAnim }],
    // Para asegurar que escale desde el centro:
    alignSelf: "center",
  };

  // Actualiza el título con el nombre del producto
  useEffect(() => {
    if (product && product.name) {
      navigation.setOptions({ title: product.name });
    }
  }, [product, navigation]);

  // Verifica si está en favoritos
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && product && product.id) {
        try {
          const favorite = await wishlistService.isProductInWishlist(
            user.uid,
            product.id
          );
          setIsFavorite(favorite);
        } catch (error) {
          console.error("Error al verificar estado de favorito:", error);
        } finally {
          setCheckingFavorite(false);
        }
      } else {
        setCheckingFavorite(false);
      }
    };
    checkFavoriteStatus();
  }, [user, product]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      Toast.show(`${product.name} añadido al carrito!`, {
        position: Toast.positions.CENTER,
      });
      navigation.navigate("OrderScreen");
    } else {
      Alert.alert("Error", "No se pudo añadir el producto al carrito.");
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      Alert.alert(
        "Inicio de Sesión Requerido",
        "Debes iniciar sesión para añadir productos a tu lista de deseos."
      );
      return;
    }
    try {
      if (isFavorite) {
        await wishlistService.removeProductFromWishlist(user.uid, product.id);
        Toast.show(`${product.name} eliminado de favoritos`, {
          position: Toast.positions.CENTER,
        });
        setIsFavorite(false);
      } else {
        await wishlistService.addProductToWishlist(user.uid, product.id);
        Toast.show(`${product.name} añadido a favoritos`, {
          position: Toast.positions.CENTER,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error al gestionar favoritos:", error);
      Toast.show("Error al gestionar favoritos", {
        position: Toast.positions.CENTER,
      });
    }
  };

  // Para evitar superposición con la barra de estado
  const statusBarHeight =
    Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0;

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Producto no encontrado.</Text>
      </View>
    );
  }

  // Construye el arreglo de imágenes (carrusel + miniaturas)
  const imagesArray =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.coverImage
      ? [product.coverImage]
      : product.image
      ? [product.image]
      : [];

  // Cuando termine el scroll, actualiza el índice activo
  const onMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(newIndex);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {/* ---------- CARRUSEL PRINCIPAL ---------- */}
            <View style={styles.carouselWrapper}>
              {imagesArray.length > 0 ? (
                <FlatList
                  ref={flatListRef}
                  data={imagesArray}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, idx) => idx.toString()}
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: item }}
                      style={styles.mainImage}
                      resizeMode="cover"
                      backgroundColor="black"
                    />
                  )}
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  style={{ width: SCREEN_WIDTH, height: 300 }}
                  getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                  })}
                />
              ) : (
                <View style={[styles.mainImage, styles.carouselPlaceholder]}>
                  <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
              )}
            </View>

            {/* ---------- MINIATURAS DESLIZABLES ---------- */}
            {imagesArray.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailContainer}
              >
                {imagesArray.map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      flatListRef.current?.scrollToOffset({
                        offset: SCREEN_WIDTH * idx,
                        animated: true,
                      });
                      setActiveIndex(idx);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri }}
                      style={[
                        styles.thumbnailImage,
                        idx === activeIndex && styles.thumbnailSelected,
                      ]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* ---------- DETALLES DEL PRODUCTO ---------- */}
            <View style={styles.detailsContainer}>
              <Text style={styles.productName}>{product.name}</Text>

              {/* ---------- BLOQUE DE PRECIO ---------- */}
              <View style={styles.priceWrapper}>
                {product.discount > 0 ? (
                  <>
                    <View style={styles.oldPriceContainerScreen}>
                      <Text style={styles.oldPriceScreen}>
                      ¥{product.price.toFixed(2)}
                      </Text>
                      <Text style={styles.discountPercentageScreen}>
                        -{product.discount}%
                      </Text>
                    </View>
                    <Animated.Text
                      style={[styles.newPriceScreen, animatedPriceStyle]}
                    >
                      ¥
                      {(product.price * (1 - product.discount / 100)).toFixed(
                        2
                      )}
                    </Animated.Text>
                  </>
                ) : (
                  <Text style={styles.priceNoDiscountScreen}>
                    ${product.price.toFixed(2)}
                  </Text>
                )}
              </View>
              

              {product.rating > 0 && (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>
                    Rating: {product.rating} ({product.reviews || 0} reviews)
                  </Text>
                </View>
              )}

              <Text style={styles.descriptionTitle}>Descripción</Text>
              <Text style={styles.productDescription}>
                {product.description}
              </Text>

              {product.category && (
                <Text style={styles.infoText}>
                  Categoría: {product.category}
                </Text>
              )}

              {product.stock !== undefined && (
                <Text style={styles.infoText}>
                  Stock:{" "}
                  {product.stock > 0
                    ? `${product.stock} disponibles`
                    : "Agotado"}
                </Text>
              )}

              <View style={styles.bottomSpacer} />
            </View>
          </>
        }
        data={[]} // FlatList solo usa el header
        renderItem={null}
        keyExtractor={() => "dummy"}
      />

      {/* ---------- BOTONES FIJOS ---------- */}
      <SafeAreaView style={styles.fixedButtonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Text style={styles.buttonText}>Añadir al Carrito</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.wishlistButton]}
          onPress={handleToggleWishlist}
          disabled={checkingFavorite}
        >
          {checkingFavorite ? (
            <ActivityIndicator color={getColor("textPrimary")} />
          ) : (
            <Text style={[styles.buttonText, styles.wishlistButtonText]}>
              {isFavorite ? "En Favoritos ❤️" : "Añadir a Favoritos ❤️"}
            </Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const defaultColors = {
  backgroundDefault: "#FFFFFF",
  textPrimary: "#212121",
  textSecondary: "#757575",
  primary: "#FF6347",
  error: "#f44336",
};

const getColor = (colorName) => {
  if (typeof COLORS === "undefined") {
    return defaultColors[colorName] || "#000000";
  }
  return COLORS[colorName] || defaultColors[colorName];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: getColor("backgroundDefault"),
  },
  // --- NUEVOS ESTILOS PARA EL ENCABEZADO ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Platform.OS === "ios" ? 35 : 15,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 1 : StatusBar.currentHeight - 13, // Ajuste para iOS vs Android
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
    // Estilos de posición fija si quieres que se quede arriba al scrollear
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1, // Asegura que esté encima de otros elementos
  },
  backButton: {
    padding: 5,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    color: "#333",
    flex: 1, // Permite que el título ocupe el espacio restante
  },
  headerRight: {
    width: 28, // Para mantener el título centrado si no hay otro icono a la derecha
  },

  /* ----- CARRUSEL ----- */
  carouselWrapper: {
    width: SCREEN_WIDTH,
    height: 400,
    backgroundColor: "#f9f9f9",
    paddingTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight + 50,
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: 350,
    marginTop: Platform.OS === "ios" ? 0 : 15,
  },
  carouselPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  placeholderText: {
    color: "#888",
    fontSize: 16,
  },

  /* ----- MINIATURAS DESLIZABLES ----- */
  thumbnailContainer: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  thumbnailImage: {
    width: 70,
    height: 70,
    resizeMode: "cover",
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  thumbnailSelected: {
    borderColor: getColor("primary"),
    borderWidth: 2,
  },

  /* ----- DETALLES ----- */
  detailsContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: getColor("textPrimary"),
    marginBottom: 8,
  },

  /* -------- PRECIOS EN PANTALLA -------- */
  priceWrapper: {
    marginBottom: 15,
  },
  // Sin descuento: precio en negro
  priceNoDiscountScreen: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  // Con descuento: precio antiguo en rojo tachado y porcentaje en verde
  oldPriceContainerScreen: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  oldPriceScreen: {
    fontSize: 16,
    color: "red",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  discountPercentageScreen: {
    fontSize: 16,
    color: "green",
    fontWeight: "bold",
  },
  // Nuevo precio en azul, animado
  newPriceScreen: {
    fontSize: 20,
    fontWeight: "bold",
    color: "blue",
  },
  /* ------------------------------------- */

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 14,
    color: getColor("textSecondary"),
    marginLeft: 5,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: getColor("textPrimary"),
    marginTop: 10,
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 15,
    color: getColor("textSecondary"),
    lineHeight: 22,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: getColor("textSecondary"),
    marginBottom: 5,
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
  bottomSpacer: {
    height: 120,
  },

  /* ----- BOTONES FIJOS ----- */
  fixedButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Platform.OS === "ios" ? 20 : 0,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    display: "flex", // Asegura que se comporte como flexbox
    flexDirection: "column", // Los botones ya están apilados verticalmente
    alignItems: "center",
  },
  button: {
    borderColor: "#AAB3B9",
    backgroundColor: "#055F68",
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    width: "90%",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  wishlistButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#16222b",
  },
  wishlistButtonText: {
    color: "#16222b",
  },

  /* ----- CENTRADO PARA ERRORES ----- */
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
