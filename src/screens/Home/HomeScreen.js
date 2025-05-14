import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions, // Importa Dimensions para obtener el ancho de la pantalla
  Platform, // Importa Platform
} from "react-native";

import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { ProductCard } from "../../components/ProductCard";

const { width: screenWidth } = Dimensions.get('window'); // Obtiene el ancho de la pantalla

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannersFromFirebase, setBannersFromFirebase] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const bannersCollection = collection(db, "banners");
      const snapshot = await getDocs(bannersCollection);
      const bannersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Banners fetched from Firebase:", bannersData);
      setBannersFromFirebase(bannersData);
    } catch (error) {
      console.error("Error fetching banners from Firebase:", error);
      Alert.alert("Error", "No se pudieron cargar los banners.");
    } finally {
      setLoadingBanners(false);
    }
  };

  const setupProductListener = () => {
    setLoading(true);
    const productsCollection = collection(db, "products");
    const availableProductsQuery = query(
      productsCollection,
      where("available", "==", true)
    );

    const unsubscribe = onSnapshot(
      availableProductsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Available products fetched (onSnapshot):", data.length);
        setProducts(data);
        const filteredData = data.filter((p) =>
          p.name && typeof p.name === 'string' && p.name.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(filteredData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products with onSnapshot:", error);
        setLoading(false);
        Alert.alert("Error", "No se pudieron cargar los productos.");
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    console.log("Setting up product listener...");
    const unsubscribe = setupProductListener();
    fetchBanners();

    return () => {
      console.log("Cleaning up product listener...");
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("Search text changed:", search);
    const lowerCaseSearch = search.toLowerCase(); // Convertir a minúsculas para una búsqueda insensible a mayúsculas

    const filteredData = products.filter((p) => {
      // Verificar si el nombre del producto incluye el texto de búsqueda
      const nameMatch = p.name && typeof p.name === 'string' && p.name.toLowerCase().includes(lowerCaseSearch);

      // Verificar si alguna de las etiquetas incluye el texto de búsqueda
      const tagsMatch = p.tags && Array.isArray(p.tags) && p.tags.some(tag =>
        typeof tag === 'string' && tag.toLowerCase().includes(lowerCaseSearch)
      );

      // El producto se incluye en los resultados filtrados si coincide con el nombre o con alguna etiqueta
      return nameMatch || tagsMatch;
    });
    setFiltered(filteredData);
  }, [search, products]);

  useEffect(() => {
    if (bannersFromFirebase.length > 0) {
      const intervalId = setInterval(() => {
        const nextIndex = (currentIndex + 1) % bannersFromFirebase.length;
        setCurrentIndex(nextIndex);
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * screenWidth,
          animated: true,
        });
      }, 3000); // Cambia de banner cada 3 segundos (ajusta el valor según necesites)

      return () => clearInterval(intervalId); // Limpia el intervalo al desmontar el componente
    }
  }, [bannersFromFirebase, currentIndex]);

  const renderProductItem = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    />
  );

  const renderBannerItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.bannerItem]} // Aplica el estilo para el ancho total
      onPress={() => {
        if (item.productId) {
          navigation.navigate("ProductDetail", { productId: item.productId });
        } else {
          console.log("Banner clicked, no product associated.");
        }
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barra de Búsqueda */}
      <TextInput
        placeholder="Buscar producto..."
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      {/* Carrusel de Banners de Firebase */}
      {loadingBanners ? (
        <ActivityIndicator style={styles.bannerLoading} color="#16222b" />
      ) : (
        <View style={styles.bannerContainer}>
          <FlatList
            ref={flatListRef}
            data={bannersFromFirebase}
            horizontal
            pagingEnabled // Permite el desplazamiento por páginas completas
            showsHorizontalScrollIndicator={false}
            renderItem={renderBannerItem}
            keyExtractor={(item) => item.id}
            style={styles.bannerList}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems.length > 0) {
                setCurrentIndex(viewableItems[0].index);
              }
            }}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50, // Considera un item visible si al menos el 50% está en la pantalla
            }}
          />
          {/* Indicadores de Página */}
          <View style={styles.pagination}>
            {bannersFromFirebase.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex ? styles.paginationDotActive : null,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Indicador de Carga de Productos */}
      {loading && products.length === 0 ? (
        <ActivityIndicator size="large" color="#16222b" style={{ marginTop: 20 }} />
      ) : null}

      {/* Mensaje si no hay productos disponibles o no hay resultados de búsqueda */}
      {!loading && filtered.length === 0 ? (
        <Text style={styles.noResultsText}>
          {products.length === 0 ? "No hay productos disponibles en este momento." : "No se encontraron resultados para la búsqueda."}
        </Text>
      ) : null}

      {/* Lista de Productos */}
      {filtered.length > 0 && (
       <FlatList
         data={filtered}
         renderItem={renderProductItem}
         keyExtractor={(item) => item.id}
         numColumns={2}

         // ======================
         // Aquí el truco:
         // ======================
         // Espacio horizontal entre columnas
         columnWrapperStyle={{
           justifyContent: "space-between",
           marginBottom: 16,
         }}
         // Padding general para que no toquen los bordes de la pantalla
         contentContainerStyle={{
           paddingHorizontal: 16,
           paddingBottom: 20,
         }}
       />
     )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f4f6f8", 
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
   },
  search: {
    marginHorizontal: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  bannerContainer: {
    height: 120, // Reduje la altura del contenedor a 120 (puedes ajustar este valor)
    marginBottom: 20,
  },
  bannerList: { width: screenWidth },
  bannerItem: { width: screenWidth },
  bannerImage: {
    width: '100%',
    height: 120, // La altura de la imagen ahora coincide con la del contenedor (puedes ajustarla)
    resizeMode: 'cover',
  },
  bannerLoading: {
    height: 120, // Ajusta la altura del indicador de carga también
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: '#16222b',
  },
  
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#888',
  }
});