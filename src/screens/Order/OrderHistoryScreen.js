// src/screens/OrderHistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react'; // ¡Importa useCallback!
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Envuelve fetchUserOrders en useCallback
  const fetchUserOrders = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setError("Usuario no autenticado.");
      return;
    }

    try {
      setLoading(true);
      setError(null); // Limpiar error anterior al intentar recargar
      const userOrders = await orderService.getUserOrders(user.uid);
      setOrders(userOrders);
    } catch (err) {
      console.error("Error al cargar el historial de pedidos:", err);
      setError("No se pudo cargar tu historial de pedidos. Inténtalo de nuevo más tarde.");
      setOrders([]); // Asegurarse de que la lista esté vacía en caso de error
    } finally {
      setLoading(false);
    }
  }, [user]); // Dependencia: user. Si user cambia, la función se recrea.

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]); // Se ejecuta cuando fetchUserOrders cambia (o al montar)

  const handleBackButton = () => {
    navigation.goBack();
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      // onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderIdText}>Pedido #{item.id.substring(0, 8).toUpperCase()}</Text>
        <Text style={[
            styles.orderStatus,
            item.status === 'pending' ? styles.statusPending : (item.status === 'accepted' ? styles.statusAccepted : styles.statusRejected)
          ]}
        >
          {item.status === 'pending' ? 'Pendiente' : item.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
        </Text>
      </View>
      <Text style={styles.orderDateText}>
        Fecha: {item.createdAt?.toDate().toLocaleDateString() || 'N/A'}
      </Text>
      <Text style={styles.orderTotalText}>
        Total: {item.totalAmount ? `${item.totalAmount.toFixed(2)}€` : 'N/A'}
      </Text>

      <View style={styles.productsContainer}>
        <Text style={styles.productsTitle}>Productos:</Text>
        {item.items && item.items.slice(0, 2).map((product, index) => (
          <View key={index} style={styles.productItem}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            <Text style={styles.productName}>{product.name} (x{product.quantity})</Text>
          </View>
        ))}
        {item.items && item.items.length > 2 && (
          <Text style={styles.moreProductsText}>+{item.items.length - 2} productos más...</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16222b" />
        <Text style={styles.loadingText}>Cargando historial de pedidos...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchUserOrders} style={styles.retryButton}> 
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Pedidos</Text>
        <View style={styles.headerRight} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Todavía no has realizado ningún pedido.</Text>
          <Text style={styles.emptySubText}>¡Explora nuestros productos y haz tu primera compra!</Text>
          <TouchableOpacity style={styles.shopNowButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopNowButtonText}>Comprar ahora</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContentContainer}
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
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  headerRight: {
    width: 28, // Para mantener el título centrado
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  statusPending: {
    backgroundColor: '#fff3cd', // Amarillo claro
    color: '#856404', // Amarillo oscuro
  },
  statusAccepted: {
    backgroundColor: '#d4edda', // Verde claro
    color: '#28a745', // Verde oscuro
  },
  statusRejected: {
    backgroundColor: '#f8d7da', // Rojo claro
    color: '#dc3545', // Rojo oscuro
  },
  orderDateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  orderTotalText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  productsContainer: {
    marginTop: 10,
  },
  productsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 10,
  },
  productName: {
    fontSize: 14,
    color: '#444',
    flexShrink: 1, // Permite que el texto se ajuste si es largo
  },
  moreProductsText: {
    fontSize: 13,
    color: '#007bff',
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    textAlign: 'center',
  },
  shopNowButton: {
    backgroundColor: '#16222b',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  shopNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});