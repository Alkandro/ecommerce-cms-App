import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { addressService } from '../../services/firestoreService';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, userProfile, signOut, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addressCount, setAddressCount] = useState(0);

  // Cargar datos adicionales al montar el componente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Refrescar perfil de usuario
        if (user?.uid) {
          await refreshUserProfile();
          
          // Obtener conteo de direcciones
          const addresses = await addressService.getUserAddresses(user.uid);
          setAddressCount(addresses.length);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // Opciones del menú de configuración
  const menuOptions = [
    {
      id: 'personal',
      title: 'Información Personal',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfileScreen')
    },
    {
      id: 'addresses',
      title: 'Direcciones de Envío',
      icon: 'location-outline',
      onPress: () => navigation.navigate('AddressesScreen'),
      badge: addressCount > 0 ? addressCount : null
    },
    {
      id: 'payment',
      title: 'Métodos de Pago',
      icon: 'card-outline',
      onPress: () => navigation.navigate('PaymentMethods')
    },
    {
      id: 'orders',
      title: 'Historial de Pedidos',
      icon: 'receipt-outline',
      onPress: () => navigation.navigate('OrderHistory')
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'notifications-outline',
      onPress: () => navigation.navigate('Notifications')
    },
    {
      id: 'help',
      title: 'Ayuda y Soporte',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('HelpSupport')
    },
    {
      id: 'terms',
      title: 'Términos y Condiciones',
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('TermsConditions')
    },
    {
      id: 'privacy',
      title: 'Política de Privacidad',
      icon: 'shield-outline',
      onPress: () => navigation.navigate('PrivacyPolicy')
    }
  ];

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');  
  };

  const handleBackButton = () => {
    navigation.goBack();
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar sesión", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              // La navegación se manejará automáticamente por el AuthNavigator
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar sesión");
            }
          }
        }
      ]
    );
  };

  if (loading && !userProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16222b" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header con título y botón de retroceso */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackButton}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de perfil */}
        <View style={styles.profileSection}>
          <Image 
            source={{ 
              uri: userProfile?.photoURL || "https://via.placeholder.com/150" 
            }} 
            style={styles.profileImage}
            // defaultSource={require('../assets/default-avatar.png')}
          />
          <Text style={styles.userName}>{userProfile?.displayName || "Usuario"}</Text>
          <Text style={styles.userEmail}>{userProfile?.email || user?.email || ""}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editProfileButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>
        
        {/* Opciones de menú */}
        <View style={styles.menuContainer}>
          {menuOptions.map((option, index) => (
            <React.Fragment key={option.id}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={option.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={option.icon} size={24} color="#000" />
                  <Text style={styles.menuItemText}>{option.title}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  {option.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{option.badge}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={24} color="#000" />
                </View>
              </TouchableOpacity>
              
              {/* Separador (excepto después del último ítem) */}
              {index < menuOptions.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>
        
        {/* Botón de cerrar sesión */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: '#f0f0f0', // Color de fondo mientras carga
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  editProfileButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  editProfileButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#16222b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  logoutButton: {
    marginTop: 30,
    marginBottom: 40,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff3b30',
  },
});
