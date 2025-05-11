// src/screens/Home/HomeScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Image, TouchableOpacity } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import Carousel from "react-native-reanimated-carousel"; // o usa un paquete como react-native-snap-carousel

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const banners = [
    // require("../../../assets/banner1.jpg"),
    // require("../../../assets/banner2.jpg"),
    { uri: "https://via.placeholder.com/300x180?text=Banner+1" },
    { uri: "https://via.placeholder.com/300x180?text=Banner+2" },
  ];

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProducts(data);
    setFiltered(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filteredData = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    >
      {/* <Image source={{ uri: item.image }} style={styles.image} /> */}
      <Image source={item} style={styles.banner} resizeMode="cover" />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.price}>${item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Buscar producto..."
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      {/* Banner */}
      <FlatList
        data={banners}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image source={item} style={styles.banner} resizeMode="cover" />
        )}
        keyExtractor={(item, index) => index.toString()}
        style={styles.bannerContainer}
      />

      {/* Productos */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        numColumns={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8", paddingTop: 20 },
  search: {
    marginHorizontal: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  bannerContainer: { height: 180, marginBottom: 20 },
  banner: {
    width: 300,
    height: 180,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  productList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    flex: 1,
    margin: 8,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: { fontWeight: "bold", fontSize: 16 },
  price: { color: "#888", marginTop: 4 },
});
