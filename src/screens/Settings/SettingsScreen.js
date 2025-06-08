// src/screens/Settings/SettingsScreen.js
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import {
  addressService,
  notificationService,
  userProfileService,
} from '../../services/firestoreService';
import { termsConditionsService } from '../../services/termsConditionsService';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, userProfile, signOut, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addressCount, setAddressCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNewTermsBadge, setShowNewTermsBadge] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    let unsubscribeNotifications;

    const loadData = async () => {
      setLoading(true);
      try {
        if (user?.uid) {
          // Refrescar perfil local
          await refreshUserProfile();

          // 1) Contar direcciones
          const addresses = await addressService.getUserAddresses(user.uid);
          setAddressCount(addresses.length);

          // 2) Suscribir notificaciones en tiempo real
          unsubscribeNotifications = notificationService.getUserNotifications(
            user.uid,
            (notifications) => {
              const unreadCount = notifications.filter((n) => !n.read).length;
              setUnreadNotificationsCount(unreadCount);
            }
          );

          // 3) Verificar si hay nueva versión de T&C
          await checkTermsAndConditionsUpdate();
        }
      } catch (error) {
        console.error(
          'Error al cargar datos en SettingsScreen:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid && isFocused) {
      loadData();
    } else if (!user?.uid) {
      // Si no hay usuario, reiniciar estados
      setAddressCount(0);
      setUnreadNotificationsCount(0);
      setShowNewTermsBadge(false);
      setLoading(false);
    }

    // Cleanup de notificaciones
    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [user, isFocused, refreshUserProfile]);

  // Revisa si la versión actual de T&C es más reciente a userProfile.lastViewedTerms
  const checkTermsAndConditionsUpdate = async () => {
    try {
      const { lastUpdated } = await termsConditionsService.getTermsAndConditions();
      if (!lastUpdated) {
        setShowNewTermsBadge(false);
        return;
      }
      const viewedAt = userProfile?.lastViewedTerms?.toDate();
      setShowNewTermsBadge(
        !viewedAt || lastUpdated.getTime() > viewedAt.getTime()
      );
    } catch (error) {
      console.error('Error al verificar T&C:', error);
      setShowNewTermsBadge(false);
    }
  };

  const menuOptions = [
    {
      id: 'personal',
      title: 'Información Personal',
      icon: 'person-outline',
      onPress: () => navigation.navigate('ProfileDetailsScreen'),
    },
    {
      id: 'addresses',
      title: 'Direcciones de Envío',
      icon: 'location-outline',
      onPress: () => navigation.navigate('AddressesScreen'),
      badge: addressCount > 0 ? addressCount : null,
    },
    {
      id: 'payment',
      title: 'Métodos de Pago',
      icon: 'card-outline',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      id: 'orders',
      title: 'Historial de Pedidos',
      icon: 'receipt-outline',
      onPress: () => {
        // Antes de permitir pedidos, verificamos si aceptó T&C recientemente
        if (showNewTermsBadge) {
          Alert.alert(
            'Términos',
            'Tienes Términos y Condiciones sin aceptar. Accede a “Términos y Condiciones” para aceptar la nueva versión antes de continuar.'
          );
        } else {
          navigation.navigate('OrderHistory');
        }
      },
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'notifications-outline',
      onPress: () => navigation.navigate('Notifications'),
      badge:
        unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
    },
    {
      id: 'help',
      title: 'Ayuda y Soporte',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      id: 'terms',
      title: 'Términos y Condiciones',
      icon: 'document-text-outline',
      onPress: () => {
        navigation.navigate('TermsConditions');
      },
      badge: showNewTermsBadge ? '!' : null,
    },
    {
      id: 'privacy',
      title: 'Política de Privacidad',
      icon: 'shield-outline',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
  ];

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  const handleBackButton = () => {
    navigation.goBack();
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Alert.alert('Error', 'No se pudo cerrar sesión');
          }
        },
      },
    ]);
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

      {/* Header */}
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
        {/* Sección de Perfil */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri:
                userProfile?.photoURL ||
                'https://via.placeholder.com/150',
            }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>
            {userProfile?.displayName || 'Usuario'}
          </Text>
          <Text style={styles.userEmail}>
            {userProfile?.email || user?.email || ''}
          </Text>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editProfileButtonText}>
              Editar Perfil
            </Text>
          </TouchableOpacity>
        </View>

        {/* Opciones del Menú */}
        <View style={styles.menuContainer}>
          {menuOptions.map((option, index) => (
            <React.Fragment key={option.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={option.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color="#000"
                  />
                  <Text style={styles.menuItemText}>
                    {option.title}
                  </Text>
                </View>
                <View style={styles.menuItemRight}>
                  {option.badge ? (
                    <View
                      style={[
                        styles.badge,
                        option.id === 'terms' &&
                          styles.termsBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          option.id === 'terms' &&
                            styles.termsBadgeText,
                        ]}
                      >
                        {option.badge}
                      </Text>
                    </View>
                  ) : null}
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#000"
                  />
                </View>
              </TouchableOpacity>
              {index < menuOptions.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Botón de Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: { width: 28 },
  scrollView: { flex: 1 },
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
    backgroundColor: '#f0f0f0',
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
    borderRadius: 8,
    borderColor: '#AAB3B9',
    backgroundColor: '#055F68',
  },
  editProfileButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  menuContainer: { paddingHorizontal: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  menuItemRight: { flexDirection: 'row', alignItems: 'center' },
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
  termsBadge: {
    backgroundColor: '#ff3b30',
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsBadgeText: {
    color: '#fff',
    fontSize: 14,
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
    borderColor: '#AAB3B9',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#055F68',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
});
