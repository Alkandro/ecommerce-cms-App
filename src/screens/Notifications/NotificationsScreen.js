// src/screens/Notifications/NotificationsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/firestoreService';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth(); 
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); 

  // Suscripción a notificaciones del usuario en tiempo real
  useEffect(() => {
    // Si no hay usuario, limpiar y salir inmediatamente
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return; // ← IMPORTANTE: salir antes de crear listeners
    }

    // Solo cargar si la pantalla está enfocada Y hay usuario
    if (!isFocused) {
      return;
    }

    setLoading(true);
    
    const unsubscribe = notificationService.getUserNotifications(
      user.uid,
      (data) => {
        setNotifications(data);
        setLoading(false);
      }
    );

    // Limpiar listener cuando cambie user, isFocused, o se desmonte
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, isFocused]); // ← Cambié user por user?.uid para mejor control

  const handleBackButton = () => {
    navigation.goBack();
  };

  // Cuando se presiona la notificación, la marcamos como leída
  const handleNotificationPress = async (notificationId) => {
    // Verificar que hay usuario antes de intentar marcar como leída
    if (!user?.uid) {
      Alert.alert("Error", "Debes iniciar sesión para realizar esta acción.");
      return;
    }

    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (err) {
      // Ignorar errores de permisos (ocurren al cerrar sesión)
      if (err.code !== 'permission-denied') {
        console.error("Error al marcar notificación como leída:", err);
        Alert.alert("Error", "No se pudo marcar como leída. Inténtalo de nuevo.");
      }
    }
  };

  // Eliminar notificación (después de confirmación)
  const handleDeleteNotification = (notificationId) => {
    // Verificar que hay usuario antes de intentar eliminar
    if (!user?.uid) {
      Alert.alert("Error", "Debes iniciar sesión para realizar esta acción.");
      return;
    }

    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que deseas eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notificationId);
            } catch (err) {
              // Ignorar errores de permisos
              if (err.code !== 'permission-denied') {
                console.error("Error al eliminar notificación:", err);
                Alert.alert("Error", "No se pudo eliminar. Inténtalo de nuevo.");
              }
            }
          },
        },
      ]
    );
  };

  // Renderizado de cada ítem en la lista
  const renderNotificationItem = ({ item }) => (
    <View
      style={[
        styles.notificationItem,
        item.read ? styles.notificationItemRead : styles.notificationItemUnread,
      ]}
    >
      <TouchableOpacity
        style={styles.notificationTouchable}
        onPress={() => handleNotificationPress(item.id)}
      >
        <Ionicons
          name={item.read ? "mail-open-outline" : "mail-outline"}
          size={24}
          color={item.read ? "#666" : "#16222b"}
          style={styles.notificationIcon}
        />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          {item.timestamp && (
            <Text style={styles.notificationTime}>
              {new Date(item.timestamp.toDate()).toLocaleString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Botón para eliminar la notificación */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item.id)}
      >
        <Ionicons name="trash-outline" size={22} color="#D32F2F" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16222b" />
        <Text style={styles.loadingText}>Cargando notificaciones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Notificaciones</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Lista de Notificaciones */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={80}
            color="#ccc"
          />
          <Text style={styles.emptyText}>
            No tienes notificaciones por ahora.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerRight: {
    width: 28,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
    marginTop: 20,
    textAlign: "center",
  },
  notificationListContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationItemUnread: {
    borderLeftWidth: 5,
    borderLeftColor: "#16222b",
  },
  notificationItemRead: {
    borderLeftWidth: 5,
    borderLeftColor: "#ddd",
    opacity: 0.8,
  },
  notificationTouchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
});