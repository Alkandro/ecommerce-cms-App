// src/components/SearchBar.js
import React from "react";
import { TextInput, StyleSheet, Platform } from "react-native";

export function SearchBar({ value, onChangeText, placeholder = "Buscar producto..." }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    marginHorizontal: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    marginTop: Platform.OS === "ios" ? 60 : 50,
  },
});
