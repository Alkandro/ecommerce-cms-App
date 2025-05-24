import React, { useEffect, useState, useRef, useCallback } from "react"; // Añade useCallback
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { SearchBar } from "../../components/SearchBar";
import { BannerCarousel } from "../../components/BannerCarousel";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext"; // <-- Importa tu contexto de autenticación
import { wishlistService } from "../../services/wishlist"; // <-- Importa tu servicio de wishlist
import Toast from "react-native-root-toast"; 

export default function HomeScreen({ navigation }) {
  const { user } = useAuth(); // <-- Obtén el usuario autenticado
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [wishlistProductIds, setWishlistProductIds] = useState(new Set()); // <-- Nuevo estado para IDs de wishlist
  const searchInputRef = useRef(null);

  // ... (useEffect para productos en tiempo real y banners, sin cambios) ...

  useEffect(() => {
    const q = query(collection(db, "products"), where("available", "==", true));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(data);
        setFiltered(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando productos:", err);
        setLoading(false);
        Alert.alert("Error", "No se pudieron cargar los productos.");
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "banners"));
    const unsubscribeBanners = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBanners(data);
        setLoadingBanners(false);
      },
      (error) => {
        console.error("Error cargando banners:", error);
        setLoadingBanners(false);
        Alert.alert("Error", "No se pudieron cargar los banners.");
      }
    );

    return () => unsubscribeBanners();
  }, []);

  // Nuevo useEffect para cargar la wishlist del usuario cuando cambie el usuario
  useEffect(() => {
    let unsubscribeWishlist = () => {}; // Inicializar para que siempre sea una función

    if (user) {
      // Escuchar cambios en la wishlist en tiempo real
      const wishlistRef = collection(db, "users", user.uid, "wishlist");
      unsubscribeWishlist = onSnapshot(wishlistRef, (snapshot) => {
        const ids = new Set(snapshot.docs.map(doc => doc.id));
        setWishlistProductIds(ids);
      }, (error) => {
        console.error("Error cargando wishlist en tiempo real:", error);
      });
    } else {
      setWishlistProductIds(new Set()); // Limpiar wishlist si no hay usuario
    }

    return () => unsubscribeWishlist();
  }, [user]); // Depende del objeto user

  // ... (Filtrado sin cambios) ...
  useEffect(() => {
    const txt = search.toLowerCase();
    setFiltered(
      products.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(txt) ||
          (Array.isArray(p.tags) &&
            p.tags.some((tag) => tag.toLowerCase().includes(txt)))
      )
    );
  }, [search, products]);

  const handleBannerPress = async (banner) => {
    if (banner.productId) {
      try {
        const productRef = doc(db, 'products', banner.productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() };
          console.log("Navegando a ProductDetail con producto:", productData.name);
          navigation.navigate("ProductDetail", { product: productData });
        } else {
          console.warn(`Producto con ID ${banner.productId} no encontrado.`);
          Alert.alert("Error", "El producto asociado a este banner no está disponible.");
        }
      } catch (error) {
        console.error("Error al cargar el producto desde el banner:", error);
        Alert.alert("Error", "No se pudo cargar el producto. Inténtalo de nuevo.");
      }
    } else {
      console.log("Este banner no tiene un producto asociado.");
      Alert.alert("Info", "Este banner es solo informativo.");
    }
  };

  // --- MODIFICAR handleFavoritePress ---
  const handleFavoritePress = async (product) => {
    if (!user) {
      Alert.alert("Inicio de Sesión Requerido", "Debes iniciar sesión para añadir productos a tu lista de deseos.");
      return;
    }

    try {
      const isCurrentlyInWishlist = wishlistProductIds.has(product.id);

      if (isCurrentlyInWishlist) {
        await wishlistService.removeProductFromWishlist(user.uid, product.id);
        Toast.show(`${product.name} eliminado de favoritos`, { position: Toast.positions.CENTER });
      } else {
        await wishlistService.addProductToWishlist(user.uid, product.id);
        Toast.show(`${product.name} añadido a favoritos`, { position: Toast.positions.CENTER });
      }
      // No necesitas recargar explícitamente aquí, el onSnapshot en useEffect actualizará el estado
    } catch (error) {
      console.error("Error al gestionar favoritos:", error);
      Toast.show("Error al gestionar favoritos", { position: Toast.positions.CENTER });
    }
  };

  const irAlUsuerProfile=() => {
    navigation.navigate("EditProfileScreen")
  }

  // Renderizado de cada producto
  const renderProduct = ({ item }) => {
    const isFavorite = wishlistProductIds.has(item.id); // <-- Verifica si es favorito
    return (
      <View style={styles.productCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            searchInputRef.current?.blur();
            navigation.navigate("ProductDetail", { product: item });
          }}
        >
          <Image source={{ uri: item.image }} style={styles.productImage} />
        </TouchableOpacity>

        {/* Botón de favorito */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleFavoritePress(item)} // Pasa el 'item' completo
        >
          {/* Cambia el icono basado en si es favorito o no */}
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"} // Corazón relleno si es favorito
            size={24}
            color={isFavorite ? "#e53935" : "#000"} // Color diferente si es favorito
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.productInfoContainer}
          onPress={() => navigation.navigate("ProductDetail", { product: item })}
        >
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>${item.price}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ... (resto del JSX sin cambios, solo asegúrate de que el BannerCarousel esté correcto) ... */}
      <View style={styles.fixedHeaderContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu-outline" size={28} color="#000" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#999" />
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileButton}
          onPress={irAlUsuerProfile}
          >
            <Ionicons name="person-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar productos..."
          inputRef={searchInputRef}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            {loadingBanners ? (
              <ActivityIndicator
                color="#16222b"
                style={{ marginVertical: 20 }}
              />
            ) : (
              <BannerCarousel
                data={banners}
                onPressItem={handleBannerPress}
              />
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {filtered.length === products.length
                  ? "Novedades"
                  : "Resultados"}
              </Text>
            </View>
          </>
        )}
        ListEmptyComponent={() =>
          loading ? (
            <ActivityIndicator color="#16222b" style={{ marginTop: 20 }} />
          ) : (
            <Text style={styles.emptyText}>
              {products.length === 0
                ? "No hay productos disponibles."
                : "No se encontraron resultados."}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  fixedHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    zIndex: 10,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : -60,
    paddingBottom: 5,
    justifyContent: "space-between",
  },
  menuButton: {
    padding: 5,
    marginTop: Platform.OS === "ios" ? 40 : 25,
  },
  searchContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 40 : 25,
  },

  notificationButton: {
    padding: 5,
    marginTop: Platform.OS === "ios" ? 40 : 25,
  },
  profileButton: {
    padding: 5,
    marginTop: Platform.OS === "ios" ? 40 : 25,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop:Platform.OS === "ios" ? -20 : -30,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: Platform.OS === "ios" ? 110 : 90,
  },
  productCard: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  favoriteButton: { // Ya está aquí
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfoContainer: {
    padding: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },
});