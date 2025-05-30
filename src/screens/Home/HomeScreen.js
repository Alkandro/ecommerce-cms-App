import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Dimensions // Importa Dimensions también aquí
} from "react-native";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { SearchBar } from "../../components/SearchBar";
import { BannerCarousel } from "../../components/BannerCarousel";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { wishlistService } from "../../services/wishlist";
import { notificationService } from '../../services/firestoreService';
import Toast from "react-native-root-toast";
import { ProductCard } from "../../components/ProductCard"; // <-- ¡Importa ProductCard!

const { width } = Dimensions.get("window"); // Para calcular el ancho de los cards
const homeCardMargin = 5; // Margen para los cards de Home
const homeNumColumns = 2;
const homeCardWidth = (width / homeNumColumns) - (homeCardMargin * homeNumColumns * 2); // Ajuste para 2 columnas con margen


export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [wishlistProductIds, setWishlistProductIds] = useState(new Set());
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const searchInputRef = useRef(null);

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

  useEffect(() => {
    let unsubscribeWishlist = () => {};

    if (user) {
      const wishlistRef = collection(db, "users", user.uid, "wishlist");
      unsubscribeWishlist = onSnapshot(wishlistRef, (snapshot) => {
        const ids = new Set(snapshot.docs.map(doc => doc.id));
        setWishlistProductIds(ids);
      }, (error) => {
        console.error("Error cargando wishlist en tiempo real:", error);
      });
    } else {
      setWishlistProductIds(new Set());
    }

    return () => unsubscribeWishlist();
  }, [user]);

  // NUEVO: useEffect para notificaciones no leídas
  useEffect(() => {
    let unsubscribeNotifications;

    if (user?.uid) {
      unsubscribeNotifications = notificationService.getUserNotifications(user.uid, (notifications) => {
        const unreadCount = notifications.filter(n => !n.read).length;
        setUnreadNotificationsCount(unreadCount);
      });
    } else {
      setUnreadNotificationsCount(0); // Si no hay usuario, no hay notificaciones no leídas
    }

    // Limpieza de la suscripción
    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [user]); // Dependencia: user


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
    } catch (error) {
      console.error("Error al gestionar favoritos:", error);
      Toast.show("Error al gestionar favoritos", { position: Toast.positions.CENTER });
    }
  };

  const irAlUsuerProfile=() => {
    navigation.navigate("EditProfileScreen")
  }
  const handleNotificationPress = () => {
    navigation.navigate("Notifications"); // Asegúrate de que esta ruta sea correcta
  };

  // --- MODIFICACIÓN CLAVE AQUÍ ---
  const renderProduct = ({ item }) => {
    const isFavorite = wishlistProductIds.has(item.id);
    return (
      <View style={styles.productCardWrapper}> 
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            searchInputRef.current?.blur();
            navigation.navigate("ProductDetail", { product: item });
          }}
        >
          <ProductCard product={item} /> 
        </TouchableOpacity>

       
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleFavoritePress(item)}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#e53935" : "#000"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeaderContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu-outline" size={28} color="#000" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#999" />
          </View>

          <TouchableOpacity
           style={styles.notificationButton}
           onPress={handleNotificationPress}
           >
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
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
        numColumns={homeNumColumns} // Usa la variable definida
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
    backgroundColor: "#f4f6f8",
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
    position: 'relative',
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
    justifyContent: "space-around",
    marginBottom: 16,
    paddingHorizontal: homeCardMargin / 2, // Ajusta el padding para la fila
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: Platform.OS === "ios" ? 110 : 90,
  },
  // --- Estilo MODIFICADO para el contenedor del ProductCard ---
  productCardWrapper: {
    width: homeCardWidth, // Usa el ancho calculado
    marginBottom: 16,
    backgroundColor: "#fff", // Puedes agregarlo si ProductCard no tiene un fondo blanco
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: homeCardMargin / 2, // Agrega margen horizontal
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4, // Aumenta la altura para una sombra más prominente
    },
    shadowOpacity: 0.15, // Opacidad de la sombra
    shadowRadius: 6, // Radio de la sombra

    // Sombra para Android
    elevation: 6, // Aumenta el valor para una sombra más intensa
    borderColor: "#e0e0e0", // Borde sutil
    borderWidth: StyleSheet.hairlineWidth, // Un borde delgado
  },
 
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1, // Asegura que esté encima del card
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#ff3b30', // Un color rojo llamativo
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 4, // Pequeño padding horizontal
  },
  badgeText: {
    color: 'white',
    fontSize: 11, // Tamaño de fuente más pequeño para el badge
    fontWeight: 'bold',
  },
});