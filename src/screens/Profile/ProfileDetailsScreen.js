// src/screens/Profile/ProfileDetailsScreen.js

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";

export default function ProfileDetailsScreen() {
  const navigation = useNavigation();
  const { userProfile, user, refreshUserProfile } = useAuth();
  const isFocused = useIsFocused(); // Hook para saber si la pantalla está en foco

  // Refrescar el perfil cada vez que la pantalla esté en foco
  useEffect(() => {
    if (isFocused && user?.uid) {
      refreshUserProfile();
    }
  }, [isFocused, user, refreshUserProfile]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  const handleBackButton = () => {
    navigation.goBack();
  };

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
        <Text style={styles.headerTitle}>Información Personal</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de la foto de perfil */}
        <View style={styles.photoContainer}>
          <Image
            source={{
              uri: userProfile?.photoURL || "https://via.placeholder.com/150"
            }}
            style={styles.profilePhoto}
            // defaultSource={require('../../assets/default-avatar.png')}
          />
        </View>

        {/* Sección de información personal */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Detalles del Perfil</Text>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Nombre Completo</Text>
            <Text style={styles.infoText}>{userProfile?.displayName || 'N/A'}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoText}>{userProfile?.firstName || 'N/A'}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Apellido</Text>
            <Text style={styles.infoText}>{userProfile?.lastName || 'N/A'}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Nickname</Text>
            <Text style={styles.infoText}>{userProfile?.nickname || 'N/A'}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Género</Text>
            <Text style={styles.infoText}>
              {userProfile?.gender ?
                (userProfile.gender === 'masculino' ? 'Masculino' :
                userProfile.gender === 'femenino' ? 'Femenino' :
                'Prefiero no decir')
                : 'N/A'
              }
            </Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Número de Teléfono</Text>
            <Text style={styles.infoText}>{userProfile?.phoneNumber || 'N/A'}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoText}>{user?.email || 'N/A'}</Text>
          </View>
        </View>

        {/* Botón para editar perfil */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
          <Ionicons name="create-outline" size={20} color="#fff" style={styles.editButtonIcon} />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0', // Color de fondo mientras carga
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#16222b',
  },
  infoGroup: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  editButton: {
    borderColor: '#AAB3B9',
    backgroundColor:"#055F68",
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  editButtonIcon: {
    marginLeft: 5,
  }
});