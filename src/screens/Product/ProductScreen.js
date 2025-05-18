import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from "react-native";
import COLORS from "../../../constants/colors"; // Ajusta la ruta según tu estructura

export default function ProductScreen({ route, navigation }) {
  const { product } = route.params;

  // Actualiza el título de la pantalla con el nombre del producto
  React.useEffect(() => {
    if (product && product.name) {
      navigation.setOptions({ title: product.name });
    }
  }, [product, navigation]);

  const handleAddToCart = () => {
    alert(`${product.name} añadido al carrito!`);
  };

  const handleAddToWishlist = () => {
    alert(`${product.name} añadido a favoritos!`);
  };

  // Calculamos el margen superior para evitar la barra de estado
  const statusBarHeight = Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Contenido principal con scroll */}
      <ScrollView style={styles.scrollView}>
        {/* Contenedor de la imagen con margen superior para evitar la barra de estado */}
        <View style={[styles.imageContainer, { marginTop: statusBarHeight }]}>
          <Image source={{ uri: product.image }} style={styles.mainImage} />
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>
            ${product.price}{" "}
            {product.discount > 0 && (
              <Text style={styles.discount}>(-{product.discount}%)</Text>
            )}
          </Text>
          
          {/* Si hay rating, mostrarlo */}
          {product.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                Rating: {product.rating} ({product.reviews || 0} reviews)
              </Text>
            </View>
          )}

          <Text style={styles.descriptionTitle}>Descripción</Text>
          <Text style={styles.productDescription}>{product.description}</Text>

          {/* Si hay categoría, mostrarla */}
          {product.category && (
            <Text style={styles.infoText}>Categoría: {product.category}</Text>
          )}
          
          {/* Si hay stock, mostrarlo */}
          {product.stock !== undefined && (
            <Text style={styles.infoText}>
              Stock: {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
            </Text>
          )}

          {/* Tags del producto */}
          {product.tags?.length > 0 && (
            <View style={styles.tagsContainer}>
              {product.tags.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          )}
          
          {/* Espacio adicional para que el contenido no quede oculto detrás de los botones fijos */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Botones fijos en la parte inferior */}
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
          onPress={handleAddToWishlist}
        >
          <Text style={[styles.buttonText, styles.wishlistButtonText]}>
            Añadir a Favoritos ❤️
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// Definimos colores por defecto en caso de que COLORS no esté disponible
const defaultColors = {
  backgroundDefault: "#FFFFFF",
  textPrimary: "#212121",
  textSecondary: "#757575",
  primary: "#FF6347",
  error: "#f44336",
};

// Usamos COLORS si está disponible, o los colores por defecto si no
const getColor = (colorName) => {
  if (typeof COLORS === 'undefined') {
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
  imageContainer: {
    width: "100%",
    height: 300,
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
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
  // Espacio adicional para que el contenido no quede oculto detrás de los botones fijos
  bottomSpacer: {
    height: 120, // Altura suficiente para los botones y un poco más
  },
  // Contenedor para los botones fijos
  fixedButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Fondo semi-transparente
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20, // Espacio adicional en la parte inferior
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  button: {
    backgroundColor: "#16222b",
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
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
});
