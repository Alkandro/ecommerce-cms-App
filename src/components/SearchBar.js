// src/components/SearchBar.js
import React from "react";
import {View, TextInput, StyleSheet, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar producto...",
  inputRef
}) {
  return (
    <View style={styles.container}>
      <TextInput
      ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={styles.input}
      />
      <Ionicons name="search-outline" size={24} color="#999" style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    
    marginTop: Platform.OS === "ios" ? -45 : -45,
    width: Platform.OS === "ios" ? 245 : 225,
    marginLeft: Platform.OS === "ios" ? 50 : 50,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  icon: {
    paddingRight: 10,
  },
});
