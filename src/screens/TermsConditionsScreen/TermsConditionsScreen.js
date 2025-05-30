import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { termsConditionsService } from '../../services/termsConditionsService';
import { userProfileService } from '../../services/firestoreService';

export default function TermsConditionsScreen() {
  const navigation = useNavigation();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [termsContent, setTermsContent] = useState('');
  const [currentTermsLastUpdated, setCurrentTermsLastUpdated] = useState(null);
  const [isChecked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);

  // Versión aceptada por el usuario y comprobación de vigencia
  const userAcceptedTs = userProfile?.termsAcceptedAt?.toDate()?.getTime();
  const areTermsAcceptedAndCurrent =
    userAcceptedTs &&
    currentTermsLastUpdated &&
    userAcceptedTs >= currentTermsLastUpdated.getTime();

  useEffect(() => {
    // Si ya estamos aceptando, o si ya tenemos la versión actual aceptada, salimos
    if (accepting) return;
    if (areTermsAcceptedAndCurrent) {
      setLoading(false);
      setChecked(true);
      return;
    }

    const fetchTermsAndProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Traer términos
        const { content, lastUpdated } = await termsConditionsService.getTermsAndConditions();
        setTermsContent(content || 'No hay términos disponibles.');
        setCurrentTermsLastUpdated(lastUpdated);

        // 2) Si hay usuario, refrescar su perfil y comprobar timestamp
        if (user?.uid) {
          await refreshUserProfile();
          const latest = await userProfileService.getUserProfile(user.uid);
          const acceptedAt = latest?.termsAcceptedAt?.toDate()?.getTime() || 0;
          setChecked(acceptedAt >= (lastUpdated?.getTime() || 0));
        } else {
          setChecked(false);
        }
      } catch (err) {
        setError('Error cargando términos. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchTermsAndProfile();
  }, [user?.uid, accepting]); // <-- solo uid y accepting

  const handleAcceptTerms = async () => {
    if (!user?.uid) {
      return Alert.alert('Error', 'Debes iniciar sesión.');
    }
    if (!isChecked) {
      return Alert.alert('Atención', 'Marca la casilla para continuar.');
    }
    if (accepting) return;

    setAccepting(true);
    try {
      await userProfileService.updateUserProfile(user.uid, {
        termsAcceptedAt: new Date(),
      });
      await refreshUserProfile();
      Alert.alert('¡Éxito!', 'Has aceptado los términos.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo registrar tu aceptación.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16222b" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => {/* podrías reiniciar un estado para reintentar */}}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.termsContentText}>{termsContent}</Text>
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={isChecked}
            onValueChange={setChecked}
            disabled={areTermsAcceptedAndCurrent}
          />
          <Text style={styles.checkboxLabel}>
            Acepto los <Text style={styles.highlightText}>Términos y Condiciones</Text>.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.acceptButton, (!isChecked || accepting || areTermsAcceptedAndCurrent) && styles.acceptButtonDisabled]}
          onPress={handleAcceptTerms}
          disabled={!isChecked || accepting || areTermsAcceptedAndCurrent}
        >
          <Text style={styles.acceptButtonText}>
            {areTermsAcceptedAndCurrent ? 'Términos Aceptados' : accepting ? 'Aceptando...' : 'Aceptar Términos'}
          </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
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
  contentContainer: {
    padding: 20,
  },
  termsContentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 8,
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1, // Permite que el texto ocupe el espacio restante
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#16222b',
  },
  acceptButton: {
    backgroundColor: '#16222b',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  oldTermsWarning: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
  }
});