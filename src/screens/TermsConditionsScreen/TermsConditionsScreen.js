// src/screens/TermsConditionsScreen.js
import React, { useState, useEffect, useRef } from 'react';
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

  // Timestamp (ms) cuando el usuario aceptó la versión anterior
  const userAcceptedTs = userProfile?.termsAcceptedAt?.toDate()?.getTime();
  // Comprobamos si ya aceptó la versión vigente
  const areTermsAcceptedAndCurrent =
    userAcceptedTs &&
    currentTermsLastUpdated &&
    userAcceptedTs >= currentTermsLastUpdated.getTime();

  useEffect(() => {
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
        // 1) Traer términos + lastUpdated desde tu servicio
        const { content, lastUpdated } = await termsConditionsService.getTermsAndConditions();
        setTermsContent(content || 'No hay términos disponibles.');
        setCurrentTermsLastUpdated(lastUpdated);

        // 2) Si hay usuario, refrescar perfil y comprobar si aceptó esta versión
        if (user?.uid) {
          await refreshUserProfile();
          // Obtenemos el perfil actualizado
          const latest = await userProfileService.getUserProfile(user.uid);
          const acceptedAt =
            latest?.termsAcceptedAt?.toDate()?.getTime() || 0;
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
  }, [user?.uid, accepting]);

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
      // 1) Actualizamos termsAcceptedAt
      await userProfileService.updateUserProfile(user.uid, {
        termsAcceptedAt: new Date(),
        // 2) Además guardamos lastViewedTerms = currentTermsLastUpdated
        lastViewedTerms: currentTermsLastUpdated,
      });
      // Refrescar el perfil local
      await refreshUserProfile();
      Alert.alert('¡Éxito!', 'Has aceptado los términos.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
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
        <TouchableOpacity onPress={() => {
            // Podemos reiniciar el fetch volviendo a cargar pantalla
            setError(null);
            setLoading(true);
          }}
        >
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
            Acepto los{' '}
            <Text style={styles.highlightText}>
              Términos y Condiciones
            </Text>
            .
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            (!isChecked ||
              accepting ||
              areTermsAcceptedAndCurrent) &&
              styles.acceptButtonDisabled,
          ]}
          onPress={handleAcceptTerms}
          disabled={
            !isChecked || accepting || areTermsAcceptedAndCurrent
          }
        >
          <Text style={styles.acceptButtonText}>
            {areTermsAcceptedAndCurrent
              ? 'Términos Aceptados'
              : accepting
              ? 'Aceptando...'
              : 'Aceptar Términos'}
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
  retryButtonText: {
    color: '#007bff',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: { flex: 1 },
  termsContentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 30,
    margin: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    margin: 15,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#16222b',
  },
  acceptButton: {
    backgroundColor: '#055F68',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
  acceptButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
