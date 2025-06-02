// // src/screens/Product/ProductScreen.js
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   StatusBar,
//   Platform,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import COLORS from "../../../constants/colors";
// import { useAuth } from "../../context/AuthContext";
// import { wishlistService } from "../../services/wishlist";
// import { useCart } from "../../context/CartContext"; // <-- ¡Añade esta línea!
// import Toast from "react-native-root-toast";
// import { Ionicons } from "@expo/vector-icons";

// export default function ProductScreen({ route, navigation }) {
//   const { product } = route.params;
//   const { user } = useAuth();
//   const { addToCart } = useCart(); // <-- ¡Añade esta línea! (antes era addProduct, pero tu contexto tiene addToCart)
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [checkingFavorite, setCheckingFavorite] = useState(true);

//   // Actualiza el título de la pantalla con el nombre del producto
//   useEffect(() => {
//     if (product && product.name) {
//       navigation.setOptions({ title: product.name });
//     }
//   }, [product, navigation]);

//   // Verifica si el producto está en la wishlist al cargar la pantalla
//   useEffect(() => {
//     const checkFavoriteStatus = async () => {
//       if (user && product && product.id) {
//         try {
//           const favorite = await wishlistService.isProductInWishlist(
//             user.uid,
//             product.id
//           );
//           setIsFavorite(favorite);
//         } catch (error) {
//           console.error("Error al verificar estado de favorito:", error);
//         } finally {
//           setCheckingFavorite(false);
//         }
//       } else {
//         setCheckingFavorite(false);
//       }
//     };
//     checkFavoriteStatus();
//   }, [user, product]);

//   const handleAddToCart = () => {
//     // Asegúrate de que el producto tiene la información necesaria para el carrito
//     if (product) {
//       addToCart(product); // <-- ¡Ahora llama a addToCart!
//       Toast.show(`${product.name} añadido al carrito!`, {
//         position: Toast.positions.CENTER,
//       });
      
//       // Navegar a la pantalla del carrito (OrderScreen) después de añadir el producto
//       navigation.navigate('OrderScreen');
//     } else {
//       Alert.alert("Error", "No se pudo añadir el producto al carrito.");
//     }
//   };

//   const handleToggleWishlist = async () => {
//     if (!user) {
//       Alert.alert(
//         "Inicio de Sesión Requerido",
//         "Debes iniciar sesión para añadir productos a tu lista de deseos."
//       );
//       return;
//     }

//     try {
//       if (isFavorite) {
//         await wishlistService.removeProductFromWishlist(user.uid, product.id);
//         Toast.show(`${product.name} eliminado de favoritos`, {
//           position: Toast.positions.CENTER,
//         });
//         setIsFavorite(false);
//       } else {
//         await wishlistService.addProductToWishlist(user.uid, product.id);
//         Toast.show(`${product.name} añadido a favoritos`, {
//           position: Toast.positions.CENTER,
//         });
//         setIsFavorite(true);
//       }
//     } catch (error) {
//       console.error("Error al gestionar favoritos:", error);
//       Toast.show("Error al gestionar favoritos", {
//         position: Toast.positions.CENTER,
//       });
//     }
//   };

//   // Calculamos el margen superior para evitar la barra de estado
//   const statusBarHeight = Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0;

//   if (!product) {
//     return (
//       <View style={styles.center}>
//         <Text>Producto no encontrado.</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

//       <ScrollView style={styles.scrollView}>
//         <View style={[styles.imageContainer, { marginTop: statusBarHeight }]}>
//           <Image source={{ uri: product.image }} style={styles.mainImage} />
//         </View>

//         <View style={styles.detailsContainer}>
//           <Text style={styles.productName}>{product.name}</Text>
//           <Text style={styles.productPrice}>
//             ${product.price}{" "}
//             {product.discount > 0 && (
//               <Text style={styles.discount}>(-{product.discount}%)</Text>
//             )}
//           </Text>

//           {product.rating > 0 && (
//             <View style={styles.ratingContainer}>
//               <Text style={styles.ratingText}>
//                 Rating: {product.rating} ({product.reviews || 0} reviews)
//               </Text>
//             </View>
//           )}

//           <Text style={styles.descriptionTitle}>Descripción</Text>
//           <Text style={styles.productDescription}>{product.description}</Text>

//           {product.category && (
//             <Text style={styles.infoText}>Categoría: {product.category}</Text>
//           )}

//           {product.stock !== undefined && (
//             <Text style={styles.infoText}>
//               Stock: {product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}
//             </Text>
//           )}

// {product.tags?.length > 0 && (
//             <View style={styles.tagsContainer}>
//               {product.tags.map((tag) => ( // No necesitas 'index' si 'tag' es único
//                 <Text key={tag} style={styles.tag}>
//                   #{tag}
//                 </Text>
//               ))}
//             </View>
//           )}

//           <View style={styles.bottomSpacer} />
//         </View>
//       </ScrollView>

//       <SafeAreaView style={styles.fixedButtonsContainer}>
//         <TouchableOpacity
//           style={styles.button}
//           onPress={handleAddToCart}
//           disabled={product.stock === 0}
//         >
//           <Text style={styles.buttonText}>Añadir al Carrito</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.button, styles.wishlistButton]}
//           onPress={handleToggleWishlist}
//           disabled={checkingFavorite}
//         >
//           {checkingFavorite ? (
//             <ActivityIndicator color={getColor("textPrimary")} />
//           ) : (
//             <Text style={[styles.buttonText, styles.wishlistButtonText]}>
//               {isFavorite ? "En Favoritos ❤️" : "Añadir a Favoritos ❤️"}
//             </Text>
//           )}
//         </TouchableOpacity>
//       </SafeAreaView>
//     </View>
//   );
// }

// // Estilos permanecen igual.
// const defaultColors = {
//   backgroundDefault: "#FFFFFF",
//   textPrimary: "#212121",
//   textSecondary: "#757575",
//   primary: "#FF6347",
//   error: "#f44336",
// };

// const getColor = (colorName) => {
//   if (typeof COLORS === 'undefined') {
//     return defaultColors[colorName] || "#000000";
//   }
//   return COLORS[colorName] || defaultColors[colorName];
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: getColor("backgroundDefault"),
//   },
//   scrollView: {
//     flex: 1,
//   },
//   imageContainer: {
//     width: "100%",
//     height: 300,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   mainImage: {
//     width: "100%",
//     height: "100%",
//     resizeMode: "contain",
//   },
//   detailsContainer: {
//     padding: 20,
//   },
//   productName: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: getColor("textPrimary"),
//     marginBottom: 8,
//   },
//   productPrice: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: getColor("primary"),
//     marginBottom: 15,
//   },
//   discount: {
//     color: getColor("error"),
//     fontWeight: "600",
//   },
//   ratingContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 15,
//   },
//   ratingText: {
//     fontSize: 14,
//     color: getColor("textSecondary"),
//     marginLeft: 5,
//   },
//   descriptionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: getColor("textPrimary"),
//     marginTop: 10,
//     marginBottom: 5,
//   },
//   productDescription: {
//     fontSize: 15,
//     color: getColor("textSecondary"),
//     lineHeight: 22,
//     marginBottom: 15,
//   },
//   infoText: {
//     fontSize: 14,
//     color: getColor("textSecondary"),
//     marginBottom: 5,
//   },
//   tagsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     marginTop: 10,
//     gap: 6,
//   },
//   tag: {
//     backgroundColor: "#e0e0e0",
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 20,
//     fontSize: 14,
//   },
//   bottomSpacer: {
//     height: 120,
//   },
//   fixedButtonsContainer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     paddingHorizontal: 20,
//     paddingTop: 10,
//     paddingBottom: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   button: {
//     backgroundColor: "#16222b",
//     marginTop: 8,
//     paddingVertical: 12,
//     borderRadius: 10,
//     width: '100%',
//   },
//   buttonText: {
//     color: "#fff",
//     textAlign: "center",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   wishlistButton: {
//     backgroundColor: "transparent",
//     borderWidth: 1,
//     borderColor: "#16222b",
//   },
//   wishlistButtonText: {
//     color: "#16222b",
//   },
//   center: { // Nuevo estilo para centrar en caso de error
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });


// src/screens/Product/ProductScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import COLORS from "../../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { wishlistService } from "../../services/wishlist";
import { useCart } from "../../context/CartContext";
import Toast from "react-native-root-toast";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ProductScreen({ route, navigation }) {
  const { product } = route.params;
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Actualiza el título de la pantalla con el nombre del producto
  useEffect(() => {
    if (product && product.name) {
      navigation.setOptions({ title: product.name });
    }
  }, [product, navigation]);

  // Verifica si el producto está en la wishlist al cargar la pantalla
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

  // Si product.images existe y tiene al menos una URL, la usamos. Si no,
  // caemos en product.image para compatibilidad
  const imagesArray =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView style={styles.scrollView}>
        {/* ---------- CARRUSEL DE IMÁGENES ---------- */}
        <View style={[styles.imageContainer, { marginTop: statusBarHeight }]}>
          {/* Imagen principal grande */}
          {imagesArray.length > 0 && (
            <Image
              source={{ uri: imagesArray[selectedImageIndex] }}
              style={styles.mainImage}
            />
          )}
        </View>

        {/* Miniaturas horizontales */}
        {imagesArray.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailScroll}
            contentContainerStyle={styles.thumbnailContainer}
          >
            {imagesArray.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImageIndex(idx)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri }}
                  style={[
                    styles.thumbnailImage,
                    idx === selectedImageIndex && styles.thumbnailSelected,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ---------- DETALLES ---------- */}
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>
            ${product.price}{" "}
            {product.discount > 0 && (
              <Text style={styles.discount}>(-{product.discount}%)</Text>
            )}
          </Text>

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

          {product.tags?.length > 0 && (
            <View style={styles.tagsContainer}>
              {product.tags.map((tag) => (
                <Text key={tag} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

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

// Colores de respaldo
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
  scrollView: {
    flex: 1,
  },

  /* ---------- Contenedor de la imagen principal ---------- */
  imageContainer: {
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  /* ---------- Miniaturas debajo ---------- */
  thumbnailScroll: {
    maxHeight: 80,
    marginTop: 8,
    marginBottom: 16,
  },
  thumbnailContainer: {
    paddingHorizontal: 10,
    alignItems: "center",
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

  /* ---------- Detalles del producto ---------- */
  detailsContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: getColor("textPrimary"),
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "600",
    color: getColor("primary"),
    marginBottom: 15,
  },
  discount: {
    color: getColor("error"),
    fontWeight: "600",
  },
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

  /* ---------- Botones fijos ---------- */
  fixedButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  button: {
    backgroundColor: "#16222b",
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
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

  /* Centrado para mensajes de error */
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
