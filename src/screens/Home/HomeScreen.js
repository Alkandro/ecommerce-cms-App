// // src/screens/Home/HomeScreen.js
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   ActivityIndicator,
//   StyleSheet,
//   Alert,
//   TouchableOpacity,
//   Image,
//   Platform
// } from "react-native";
// import { collection, onSnapshot, query, where } from "firebase/firestore";
// import { db } from "../../firebase/firebaseConfig";
// import { SearchBar } from "../../components/SearchBar";
// import { BannerCarousel } from "../../components/BannerCarousel";
// import { Ionicons } from '@expo/vector-icons'; // Asegúrate de tener esta dependencia instalada

// export default function HomeScreen({ navigation }) {
//   const [products, setProducts] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [banners, setBanners] = useState([]);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const searchInputRef = useRef(null);

//   // Productos en tiempo real
//   useEffect(() => {
//     const q = query(collection(db, "products"), where("available", "==", true));
//     const unsub = onSnapshot(q, snapshot => {
//       const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
//       setProducts(data);
//       setFiltered(data);
//       setLoading(false);
//     }, err => {
//       console.error("Error cargando productos:", err);
//       setLoading(false);
//       Alert.alert("Error", "No se pudieron cargar los productos.");
//     });
//     return unsub;
//   }, []);

//   // Banners one-time fetch
//   useEffect(() => {
//     const q = query(collection(db, "banners"));
//     const unsubscribeBanners = onSnapshot(q, (snapshot) => {
//       const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
//       setBanners(data);
//       setLoadingBanners(false);
//     }, (error) => {
//       console.error("Error cargando banners:", error);
//       setLoadingBanners(false);
//       Alert.alert("Error", "No se pudieron cargar los banners.");
//     });

//     return () => unsubscribeBanners();
//   }, []);

//   // Filtrado
//   useEffect(() => {
//     const txt = search.toLowerCase();
//     setFiltered(
//       products.filter(p =>
//         (p.name || "").toLowerCase().includes(txt) ||
//         (Array.isArray(p.tags) && p.tags.some(tag => tag.toLowerCase().includes(txt)))
//       )
//     );
//   }, [search, products]);

//   const handleFavoritePress = (product) => {
//     // Implementar lógica para añadir/quitar de favoritos
//     Alert.alert("Favorito", `${product.name} añadido a favoritos`);
//   };

//   // Renderizado de cada producto
//   const renderProduct = ({ item }) => (
//     <View style={styles.productCard}>
//       <TouchableOpacity
//         activeOpacity={0.9}
//         onPress={() => {
//           searchInputRef.current?.blur(); // Desenfocar el input al navegar
//           navigation.navigate("ProductDetail", { product: item });
//         }}
//       >
//         <Image source={{ uri: item.image }} style={styles.productImage} />
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.favoriteButton}
//         onPress={() => handleFavoritePress(item)}
//       >
//         <Ionicons name="heart-outline" size={24} color="#000" />
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.productInfoContainer}
//         onPress={() => navigation.navigate("ProductDetail", { product: item })}
//       >
//         <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
//         <Text style={styles.productPrice}>${item.price}</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       {/* Header con menú, búsqueda y perfil */}
//       <View style={styles.fixedHeaderContainer}>
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.menuButton}>
//           <Ionicons name="menu-outline" size={28} color="#000" />
//         </TouchableOpacity>

//         <View style={styles.searchContainer}>
//           <Ionicons name="search-outline" size={20} color="#999" />
//         </View>

//         <TouchableOpacity style={styles.notificationButton}>
//           <Ionicons name="notifications-outline" size={24} color="#000" />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.profileButton}>
//           <Ionicons name="person-outline" size={24} color="#000" />
//         </TouchableOpacity>
//       </View>

//       {/* Barra de búsqueda */}
//       <SearchBar
//         value={search}
//         onChangeText={setSearch}
//         placeholder="Buscar productos..."
//         inputRef={searchInputRef}
//       />
// </View>
//       {/* Contenido principal */}
//       <FlatList
//         data={filtered}
//         renderItem={renderProduct}
//         keyExtractor={item => item.id}
//         numColumns={2}
//         columnWrapperStyle={styles.row}
//         contentContainerStyle={styles.listContent}
//         showsVerticalScrollIndicator={false}
//         ListHeaderComponent={() => (
//           <>
//             {/* Banner Carousel */}
//             {loadingBanners ? (
//               <ActivityIndicator color="#16222b" style={{ marginVertical: 20 }} />
//             ) : (
//               <BannerCarousel
//                 data={banners}
//                 onPressItem={b => {
//                   if (b.product) {
//                     navigation.navigate("ProductDetail", { product: b.product });
//                   }
//                 }}
//               />
//             )}

//             {/* Título de sección */}
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>
//                 {filtered.length === products.length ? "Novedades" : "Resultados"}
//               </Text>
//             </View>
//           </>
//         )}
//         ListEmptyComponent={() => (
//           loading ? (
//             <ActivityIndicator color="#16222b" style={{ marginTop: 20 }} />
//           ) : (
//             <Text style={styles.emptyText}>
//               {products.length === 0
//                 ? "No hay productos disponibles."
//                 : "No se encontraron resultados."}
//             </Text>
//           )
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff"
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 10,
//     paddingBottom: 5,
//   },
//   menuButton: {
//     padding: 5,
//     marginTop: Platform.OS === "ios" ? 40 : 25,
//   },
//   searchContainer: {
//     flex: 1,
//     alignItems: 'center',
//     marginTop: Platform.OS === "ios" ? 40 : 25,
//   },
//   notificationButton: {
//     padding: 5,
//     marginTop: Platform.OS === "ios" ? 40 : 25,
//   },
//   profileButton: {
//     padding: 5,
//     marginTop: Platform.OS === "ios" ? 40 : 25,
//   },
//   sectionHeader: {
//     paddingHorizontal: 16,
//     paddingTop: -25,
//     paddingBottom: 10,
//   },
//   sectionTitle: {
//     fontSize: 28,
//     fontWeight: "bold",
//   },
//   row: {
//     justifyContent: "space-between",
//     marginBottom: 16,
//   },
//   listContent: {
//     paddingHorizontal: 16,
//     paddingBottom: 20,
//   },
//   productCard: {
//     width: '48%',
//     marginBottom: 16,
//     borderRadius: 8,
//     backgroundColor: "#fff",
//     overflow: 'hidden',
//   },
//   productImage: {
//     width: "100%",
//     height: 150,
//     resizeMode: "cover",
//   },
//   favoriteButton: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     borderRadius: 15,
//     width: 30,
//     height: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   productInfoContainer: {
//     padding: 10,
//   },
//   productName: {
//     fontSize: 16,
//     fontWeight: "500",
//     marginBottom: 4,
//   },
//   productPrice: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   emptyText: {
//     textAlign: "center",
//     marginTop: 40,
//     color: "#888",
//     fontSize: 16,
//   },
// });
// src/screens/Home/HomeScreen.js
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
} from "react-native";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { SearchBar } from "../../components/SearchBar";
import { BannerCarousel } from "../../components/BannerCarousel";
import { Ionicons } from "@expo/vector-icons"; // Asegúrate de tener esta dependencia instalada

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const searchInputRef = useRef(null);

  // Productos en tiempo real
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

  // Banners one-time fetch
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

  // Filtrado
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

  const handleFavoritePress = (product) => {
    // Implementar lógica para añadir/quitar de favoritos
    Alert.alert("Favorito", `${product.name} añadido a favoritos`);
  };

  // Renderizado de cada producto
  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          searchInputRef.current?.blur(); // Desenfocar el input al navegar
          navigation.navigate("ProductDetail", { product: item });
        }}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleFavoritePress(item)}
      >
        <Ionicons name="heart-outline" size={24} color="#000" />
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

  return (
    <View style={styles.container}>
      {/* Contenedor fijo para Header y SearchBar */}
      <View style={styles.fixedHeaderContainer}>
        {/* Header con menú, búsqueda y perfil */}
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

          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar productos..."
          inputRef={searchInputRef}
        />
      </View>

      {/* Contenido principal */}
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
            {/* Banner Carousel */}
            {loadingBanners ? (
              <ActivityIndicator
                color="#16222b"
                style={{ marginVertical: 20 }}
              />
            ) : (
              <BannerCarousel
                data={banners}
                onPressItem={(b) => {
                  if (b.product) {
                    navigation.navigate("ProductDetail", {
                      product: b.product,
                    });
                  }
                }}
              />
            )}

            {/* Título de sección */}
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
    backgroundColor: "white", // Asegúrate de que tenga un fondo para ocultar el contenido debajo
    zIndex: 10, // Asegura que esté por encima del contenido
    elevation: 3, // Para sombra en Android (opcional)
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 :-60, // Ajuste para el notch en iOS
    paddingBottom: 5,
    justifyContent: "space-between", // Espacia los elementos del header
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
    paddingTop: 10, // Ajusta el paddingTop para dejar espacio al header fijo
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: Platform.OS === "ios" ? 110 : 90, // Ajusta el paddingTop para el header y la barra de búsqueda fijas
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
  // Estilos para SearchBar (si no están en un archivo separado)
  // ... (puedes mantener los estilos del SearchBar en su propio archivo)
});
