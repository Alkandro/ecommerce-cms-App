import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function BannerCarousel({ data = [], onPressItem }) {
  const ref = useRef();
  const [current, setCurrent] = useState(0);

  // auto-scroll cada 3s
  useEffect(() => {
    if (data.length === 0) return;
    const iv = setInterval(() => {
      const next = (current + 1) % data.length;
      setCurrent(next);
      ref.current.scrollToOffset({ offset: next * SCREEN_WIDTH, animated: true });
    }, 3000);
    return () => clearInterval(iv);
  }, [current, data]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={ref}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems[0]) setCurrent(viewableItems[0].index);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.slide}
            activeOpacity={0.8}
            onPress={() => onPressItem && onPressItem(item)}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          </TouchableOpacity>
        )}
      />
      <View style={styles.pagination}>
        {data.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === current ? styles.dotActive : undefined,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 180, marginBottom: 5 },
  slide: { width: SCREEN_WIDTH },
  image: { width: "100%", height: 130, resizeMode: "cover" },
  pagination: { flexDirection: "row", justifyContent: "center", marginBottom: 30 }, // Reducido el marginTop
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: "#16222b" },
});