// src/components/ProductCard.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Easing,
} from "react-native";
import { fn } from "../utils";
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 16) / 2;

export function ProductCard({ product, onPress,
  startColor = '#16222b',
  highlightColor = '#f57c00',
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const imagesArray =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.coverImage
      ? [product.coverImage]
      : typeof product.image === "string"
      ? [product.image]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // --- CAMBIO CLAVE AQUÍ ---
  useEffect(() => {
    if (product.discount > 0) {
      // Reiniciar valor
      pulse.setValue(0);
      // Loop infinito de 0→1 en 1000ms
      const loop = Animated.loop(
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // JS-driven para poder animar color
        })
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [product.discount, pulse]);

  // Interpolar escala: 0→0.5→1  mapea 1→1.1→1
  const scale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  // Interpolar color: 0→0.5→1  mapea azul→naranja→azul
  const color = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    // outputRange: ["#16222b", "#f57c00", "#16222b"],
    outputRange: [startColor, highlightColor, startColor],
  });
  // --- FIN CAMBIO CLAVE ---

  const animatedPriceStyle = {
    transform: [{ scale: pulseAnim }],
    alignSelf: "center",
  };

  const onMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / CARD_WIDTH);
    setActiveIndex(newIndex);
  };

  const hasImages = imagesArray.length > 0;

  const content = (
    <View style={styles.card}>
      {/* ---------- SLIDER PRINCIPAL ---------- */}
      <View style={styles.carouselContainer}>
        {hasImages ? (
          <FlatList
            ref={flatListRef}
            data={imagesArray}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.carouselImage}
                resizeMode="cover"
                onError={() => console.warn("Error cargando imagen:", item)}
              />
            )}
            onMomentumScrollEnd={onMomentumScrollEnd}
            style={{ width: CARD_WIDTH }}
            getItemLayout={(_, index) => ({
              length: CARD_WIDTH,
              offset: CARD_WIDTH * index,
              index,
            })}
          />
        ) : (
          <View style={[styles.carouselImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>Sin imagen</Text>
          </View>
        )}

        {/* ---------- PUNTOS INDICADORES ---------- */}
        {hasImages && imagesArray.length > 1 && (
          <View style={styles.indicatorContainer}>
            {imagesArray.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.indicatorDot,
                  idx === activeIndex && styles.indicatorDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* ---------- MINIATURAS DESPLAZABLES ---------- */}
      {hasImages && imagesArray.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailScrollContainer}
        >
          {imagesArray.map((uri, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                flatListRef.current?.scrollToOffset({
                  offset: CARD_WIDTH * idx,
                  animated: true,
                });
                setActiveIndex(idx);
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri }}
                style={[
                  styles.thumbnailImage,
                  idx === activeIndex && styles.thumbnailSelected,
                ]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ---------- TÍTULO ---------- */}
      <Text style={styles.title} numberOfLines={2}>
        {product.title || product.name}
      </Text>

      {/* ---------- PRECIOS ---------- */}
      <View style={styles.priceContainer}>
        {product.discount > 0 ? (
          <>
            <View style={styles.oldPriceContainer}>
              <Text style={[styles.oldPrice, styles.oldPriceDiscounted]}>
              ¥{product.price}
              </Text>
              <Text style={styles.discountPercentage}>
                -{product.discount}%
              </Text>
            </View>
            <Animated.Text
          style={[
            styles.price,
            { transform: [{ scale }], color },
          ]}
        >
              ¥{fn.calcPrice(product.price, product.discount)}
            </Animated.Text>
          </>
        ) : (
          <Text style={[styles.price, { alignSelf: 'center' }]}>¥{product.price}</Text>
        )}
      </View>
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 280, // suficiente para carrusel, miniaturas y texto
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  /* ---------- CONTENEDOR DEL CARRUSEL ---------- */
  carouselContainer: {
    width: CARD_WIDTH,
    height: 130,
    backgroundColor: "#f2f2f2",
  },
  carouselImage: {
    width: CARD_WIDTH,
    height: 130,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  placeholderText: {
    color: "#888",
    fontSize: 12,
  },
  /* ---------- PUNTOS INDICADORES ---------- */
  indicatorContainer: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 3,
  },
  indicatorDotActive: {
    backgroundColor: "#fff",
  },
  /* ---------- MINIATURAS DESPLAZABLES ---------- */
  thumbnailScrollContainer: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#fff",
  },
  thumbnailImage: {
    width: 40,
    height: 40,
    resizeMode: "cover",
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  thumbnailSelected: {
    borderColor: "#16222b",
    borderWidth: 2,
  },
  /* ---------- TÍTULO ---------- */
  title: {
    fontSize: 14,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingTop: 6,
    minHeight: 40,
  },
  /* ---------- PRECIOS ---------- */
  priceContainer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: -4,
  },
  oldPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  oldPrice: {
    textDecorationLine: "line-through",
    color: "red",
    fontSize: 12,
    marginRight: 8,
  },
  oldPriceDiscounted: {
    
   
  },
  discountPercentage: {
    fontSize: 12,
    color: "green",
    fontWeight: "bold",
  },
  price: {
    fontSize: 16,
    color: "#16222b",
    fontWeight: "bold",
    marginBottom: 14,
    
  },
  newPriceDiscounted: {
    color: "blue",
    marginBottom: 8,
  },
});

