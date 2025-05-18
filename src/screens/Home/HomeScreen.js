// src/screens/Home/HomeScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { ProductCard } from "../../components/ProductCard";
import { SearchBar } from "../../components/SearchBar";
import { BannerCarousel } from "../../components/BannerCarousel";

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // Productos en tiempo real
  useEffect(() => {
    const q = query(collection(db, "products"), where("available", "==", true));
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(data);
      setFiltered(data);
      setLoading(false);
    }, err => {
      setLoading(false);
      Alert.alert("Error", "No se pudieron cargar los productos.");
    });
    return unsub;
  }, []);

  // Banners one-time fetch
  useEffect(() => {
    const q = query(collection(db, "banners"));
    const unsubscribeBanners = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setBanners(data);
      setLoadingBanners(false);
    }, (error) => {
      setLoadingBanners(false);
      Alert.alert("Error", "No se pudieron cargar los banners.");
    });
  
    return () => unsubscribeBanners(); // Importante para evitar fugas de memoria
  }, []);

  // Filtrado
  useEffect(() => {
    const txt = search.toLowerCase();
    setFiltered(
      products.filter(p =>
        (p.name || "").toLowerCase().includes(txt) ||
        (Array.isArray(p.tags) && p.tags.some(tag => tag.toLowerCase().includes(txt)))
      )
    );
  }, [search, products]);

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    />
  );

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} />

      {loadingBanners
        ? <ActivityIndicator color="#16222b" style={{ marginVertical: 20 }} />
        : <BannerCarousel
            data={banners}
            onPressItem={b => navigation.navigate("ProductDetail", { product: b.product })}
          />
      }

      {loading
        ? <ActivityIndicator color="#16222b" style={{ marginTop: 20 }} />
        : filtered.length === 0
          ? <Text style={styles.emptyText}>
              {products.length === 0
                ? "No hay productos disponibles."
                : "No se encontraron resultados."}
            </Text>
          : <FlatList
              data={filtered}
              renderItem={renderProduct}
              keyExtractor={i => i.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
            />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  row: { justifyContent: "space-between", marginBottom: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyText: { textAlign: "center", marginTop: 40, color: "#888", fontSize: 16 },
});
