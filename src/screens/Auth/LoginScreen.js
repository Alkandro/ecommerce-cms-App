// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { signIn, authError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }
    try {
      await signIn(email.trim(), password);
      // La navegación se gestionará vía listener onAuthStateChanged
    } catch (e) {
      console.error('Error al iniciar sesión:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Icon name="cart-outline" size={64} color="#000" style={styles.logo} />
      <Text style={styles.title}>Bienvenido</Text>

      <View style={styles.inputContainer}>
        <Icon name="email-outline" size={24} color="#4F5B66" />
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          placeholderTextColor="#4F5B66"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock-outline" size={24} color="#4F5B66" />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#4F5B66"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
          <Icon
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={24}
            color="#4F5B66"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      {authError && <Text style={styles.errorText}>{authError}</Text>}

      <TouchableOpacity
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotContainer}
      >
        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ACCENT = '#055F68';
const BORDER = '#AAB3B9';
const INPUT_BG = '#FFFFFF';
const PLACEHOLDER = '#4F5B66';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F9F8F4',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SCREEN_WIDTH - 48,
    height: 56,
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
    color: '#000',
  },
  button: {
    width: SCREEN_WIDTH - 48,
    height: 56,
    backgroundColor: ACCENT,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotContainer: {
    marginTop: 16,
  },
  forgotText: {
    color: ACCENT,
    fontSize: 14,
  },
  separator: {
    width: SCREEN_WIDTH - 48,
    height: 1,
    backgroundColor: '#D0D5DD',
    marginVertical: 24,
  },
  registerContainer: {
    flexDirection: 'row',
  },
  registerText: {
    fontSize: 14,
    color: '#4F5B66',
  },
  registerLink: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});
