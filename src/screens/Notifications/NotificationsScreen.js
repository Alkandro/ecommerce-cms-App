// src/screens/Notifications/NotificationsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
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

  // 1) Suscripción a notificaciones del usuario en tiempo real
  useEffect(() => {
    let unsubscribe;

    if (user?.uid && isFocused) {
      setLoading(true);
      unsubscribe = notificationService.getUserNotifications(user.uid, (data) => {
        setNotifications(data);
        setLoading(false);
      });
    } else if (!user?.uid) {
      setLoading(false);
      setNotifications([]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, isFocused]);

  const handleBackButton = () => {
    navigation.goBack();
  };

  // 2) Cuando se presiona la notificación, la marcamos como leída
  const handleNotificationPress = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (err) {
      console.error("Error al marcar notificación como leída:", err);
      Alert.alert("Error", "No se pudo marcar como leída. Inténtalo de nuevo.");
    }
  };

  // 3) Eliminar notificación (después de confirmación)
  const handleDeleteNotification = (notificationId) => {
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
              // Opcional: mostrar un toast o alerta de éxito
              // Alert.alert("Eliminada", "Notificación eliminada correctamente.");
            } catch (err) {
              console.error("Error al eliminar notificación:", err);
              Alert.alert("Error", "No se pudo eliminar. Inténtalo de nuevo.");
            }
          },
        },
      ]
    );
  };

  // 4) Renderizado de cada ítem en la lista
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
    width: 28, // Para mantener el título centrado
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
    flex: 1, // Ocupa todo el espacio salvo el botón de eliminar
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
