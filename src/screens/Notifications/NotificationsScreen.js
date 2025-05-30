// src/screens/Notifications/NotificationsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList // Usaremos FlatList para mejor rendimiento con listas
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/firestoreService'; // Asegúrate de importar el servicio

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth(); // Necesitamos el user.uid para obtener las notificaciones
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // Para refrescar al volver a la pantalla

  useEffect(() => {
    let unsubscribe;

    if (user?.uid && isFocused) {
      setLoading(true);
      // Suscribirse a las notificaciones en tiempo real
      unsubscribe = notificationService.getUserNotifications(user.uid, (data) => {
        setNotifications(data);
        setLoading(false);
      });
    } else if (!user?.uid) {
      setLoading(false); // No hay usuario, no hay notificaciones que cargar
      setNotifications([]);
    }

    // Limpieza de la suscripción al desmontar el componente o cuando el usuario cambia/la pantalla pierde el foco
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, isFocused]); // Dependencias: user y isFocused

  const handleBackButton = () => {
    navigation.goBack();
  };

  const handleNotificationPress = async (notificationId) => {
    // Puedes navegar a una pantalla de detalles de notificación si lo deseas
    // Por ahora, solo la marcaremos como leída
    await notificationService.markNotificationAsRead(notificationId);
    // Opcional: Navegar a los detalles de la notificación
    // navigation.navigate('NotificationDetail', { notificationId });
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.read ? styles.notificationItemRead : styles.notificationItemUnread
      ]}
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
            {new Date(item.timestamp.toDate()).toLocaleString()} {/* Formatea la fecha */}
          </Text>
        )}
      </View>
    </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackButton}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Notificaciones</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Lista de Notificaciones */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No tienes notificaciones por ahora.</Text>
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
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 28, // Para mantener el título centrado
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
  },
  notificationListContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationItemUnread: {
    borderLeftWidth: 5,
    borderLeftColor: '#16222b', // Color para notificaciones no leídas
  },
  notificationItemRead: {
    borderLeftWidth: 5,
    borderLeftColor: '#ddd', // Color más sutil para notificaciones leídas
    opacity: 0.8,
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
});