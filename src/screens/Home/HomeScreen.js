// // src/screens/Home/HomeScreen.js
import React, { useEffect, useState, useRef } from "react";
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
  Dimensions,
} from "react-native";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { SearchBar } from "../../components/SearchBar";
import { BannerCarousel } from "../../components/BannerCarousel"; // Asegúrate de que este componente exista y funcione bien
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { wishlistService } from "../../services/wishlist";
import { notificationService } from "../../services/firestoreService";
import { termsConditionsService } from "../../services/termsConditionsService";
import Toast from "react-native-root-toast";
import { ProductCard } from "../../components/ProductCard";
import { useIsFocused } from "@react-navigation/native";


const { width } = Dimensions.get("window");
const homeCardMargin = 5;
const homeNumColumns = 2;
const homeCardWidth = (width / homeNumColumns) - (homeCardMargin * homeNumColumns * 2);

export default function HomeScreen({ navigation }) {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const isFocused = useIsFocused();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  const [wishlistProductIds, setWishlistProductIds] = useState(new Set());
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [newTermsAvailable, setNewTermsAvailable] = useState(false);

  const searchInputRef = useRef(null);

  // REFERENCIA para el FlatList de banners (autoscroll)
  // Mantenemos la ref aquí si BannerCarousel es un wrapper de FlatList y se la pasamos
  const bannerCarouselRef = useRef(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  // 1) Cargar productos disponibles en tiempo real
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

  // 2) Cargar banners en tiempo real
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

  // 3) Cargar wishlist del usuario en tiempo real
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

  // 4) Notificaciones no leídas del usuario en tiempo real
  useEffect(() => {
    let unsubscribeNotifications;
    if (user?.uid) {
      unsubscribeNotifications = notificationService.getUserNotifications(user.uid, (notifications) => {
        const unreadCount = notifications.filter(n => !n.read).length;
        setUnreadNotificationsCount(unreadCount);
      });
    } else {
      setUnreadNotificationsCount(0);
    }
    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [user]); // Dependencia: user

  // 5) Filtrar productos según search
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

  // 6) Verificar si hay nueva versión de T&C cada vez que la pantalla esté en foco
  useEffect(() => {
    const checkTerms = async () => {
      if (!user?.uid) {
        setNewTermsAvailable(false);
        return;
      }
      try {
        const { lastUpdated } = await termsConditionsService.getTermsAndConditions();
        const viewedAt = userProfile?.lastViewedTerms?.toDate();
        const hasNew = !viewedAt || lastUpdated.getTime() > viewedAt.getTime();
        setNewTermsAvailable(Boolean(hasNew));
      } catch {
        setNewTermsAvailable(false);
      }
    };
    if (isFocused) {
      refreshUserProfile().then(checkTerms).catch(() => checkTerms());
    }
  }, [userProfile, isFocused, user]);

  // 7) Autoscroll manual para el carrusel de banners (cada 3 segundos)
  // Esta lógica ahora se aplica al ref del BannerCarousel
  useEffect(() => {
    if (banners.length === 0 || !bannerCarouselRef.current) return; // Asegúrate de que la ref exista
    const interval = setInterval(() => {
      const nextIndex = (bannerIndex + 1) % banners.length;
      setBannerIndex(nextIndex);
      // Asume que BannerCarousel internamente usa un FlatList y expone un método para hacer scroll,
      // o que la ref apunta directamente a un FlatList.
      bannerCarouselRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [bannerIndex, banners]);

  // 8) Si se pulsa un banner, navegar a su producto
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

  // 9) Agregar / quitar favorito
  const handleFavoritePress = async (product) => {
    if (!user) {
      Alert.alert("Inicio de Sesión Requerido", "Debes iniciar sesión para gestionar favoritos.");
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

  // 10) Navegar al perfil
  const irAlUsuerProfile=() => {
    navigation.navigate("ProfileDetailsScreen")
  }
  // 11) Navegar a notificaciones
  const handleNotificationPress = () => {
    navigation.navigate("Notifications");
  };

  // 12) Render de cada tarjeta de producto
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
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#e53935" : "#000"} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeaderContainer}>
        <View style={styles.header}>
        <View style={styles.buscador} >
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar productos..."
          inputRef={searchInputRef}
        />
         </View >
         

         
          <View style={styles.searchContainer}>
           
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

          
          <TouchableOpacity
            style={styles.profileButton}
            onPress={irAlUsuerProfile}
          >
            <Ionicons name="person-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("TermsConditions")}
          >
            <Ionicons name="document-text-outline" size={28} color="#000" />
            {newTermsAvailable && (
              <View style={styles.tncBadge}>
                <Text style={styles.tncBadgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

       
      </View>

      
      {loadingBanners ? (
        <ActivityIndicator
          color="#16222b"
          style={styles.bannerLoadingIndicator} // Nuevo estilo para posicionar correctamente
        />
      ) : (
        <View style={styles.bannerContainer}> 
          <BannerCarousel
            data={banners}
            onPressItem={handleBannerPress}
            carouselRef={bannerCarouselRef} // Pasamos la ref al BannerCarousel
            currentBannerIndex={bannerIndex} // Pasamos el índice actual para los puntos de paginación
          />
        </View>
      )}

      {/* ================= LISTA DE PRODUCTOS ================= */}
      <FlatList
        data={filtered}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={homeNumColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {filtered.length === products.length ? "Novedades" : "Resultados"}
            </Text>
          </View>
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
  container: { flex: 1, backgroundColor: "#f4f6f8" },

  /* ===== CABECERA FIJA ===== */
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
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "ios" ? 20 : -60,
    paddingBottom: 5,
    justifyContent: "space-between",
  },
  buscador: {
    padding: 1,
    margin:-50,
    
    marginTop: Platform.OS === "ios" ? 40 : 25,
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

  /* ===== BANNER CARRUSEL (NUEVOS ESTILOS) ===== */
  // Contenedor para el BannerCarousel para posicionarlo correctamente
  bannerContainer: {
    marginTop: Platform.OS === "ios" ? 110 : 90, // Altura del fixedHeaderContainer + SearchBar
    height: 180, // Altura del banner
    width: '100%',
    backgroundColor: "#f0f0f0", // Color de fondo si el banner no ocupa todo
  },
  bannerLoadingIndicator: {
    marginTop: Platform.OS === "ios" ? 110 + 80 : 90 + 80, // Ajusta según la altura del header + searchbar + mitad del banner
    height: 250,
  },
  // Estos estilos podrían ir dentro de BannerCarousel si maneja su propio diseño
  bannerWrapper: {
    width: width,
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  noBannerPlaceholder: {
    width: width,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },

  /* ===== SECCIÓN DE PRODUCTOS ===== */
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 1,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    // Ya no necesita marginTop negativo aquí, ya que el banner está fuera
  },
  row: {
    justifyContent: "space-around",
    
    marginBottom: 16,
    paddingHorizontal: homeCardMargin / 2,
  },
  listContent: {
    paddingBottom: 20,
    // El paddingTop se elimina o se ajusta, ya que el banner está fuera del FlatList
    // Ahora, el FlatList comienza después del banner y el header.
  },
  productCardWrapper: {
    width: homeCardWidth,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: homeCardMargin / 2,
    // Sombra iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // Elevation Android
    elevation: 6,
    borderColor: "#e0e0e0",
    borderWidth: StyleSheet.hairlineWidth,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },

  /* ===== BADGE NOTIFICACIONES ===== */
  badge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#ff3b30",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  // Estos estilos deberían ir dentro de BannerCarousel si maneja su propia paginación
  pagination: {
    position: "absolute",
    bottom: 8,
    width: width,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#16222b",
  },
  tncBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ff3b30",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  tncBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});