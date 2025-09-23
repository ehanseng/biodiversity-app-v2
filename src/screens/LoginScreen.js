import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/SimpleAuthContext';
import usePageTitle from '../hooks/usePageTitle';
import SimpleToast from '../utils/SimpleToast';

const LoginScreen = ({ navigation }) => {
  usePageTitle('Iniciar Sesión'); // Actualizar título de la página
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn } = useAuth();


  const handleLogin = async () => {
    console.log('🔐 Intentando login con:', { email, passwordLength: password.length });
    
    if (!email || !password) {
      const message = 'Por favor completa todos los campos antes de continuar';
      setErrorMessage(message);
      
      SimpleToast.warning('Campos requeridos', message);
      return;
    }

    setLoading(true);
    setErrorMessage(''); // Limpiar errores previos
    
    try {
      const result = await signIn(email, password);
      console.log('📊 Resultado del login:', result);
      
      if (result.error) {
        console.error('❌ Error en login:', result.error);
        
        // Mostrar error tanto en pantalla como en notificación
        setErrorMessage(result.error);
        SimpleToast.error('Error de autenticación', result.error);
      } else {
        console.log('✅ Login exitoso');
        // El AuthContext se encarga de la navegación automática
      }
    } catch (error) {
      console.error('❌ Error inesperado en login:', error);
      
      // Si el error viene del servidor, mostrar el mensaje específico
      let errorMsg = 'Ocurrió un error inesperado. Intenta de nuevo.';
      if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      SimpleToast.error('Error de conexión', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🌳 Biodiversidad</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage(''); // Limpiar error al escribir
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage(''); // Limpiar error al escribir
            }}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* Mensaje de error en pantalla */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#dc3545" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              ¿No tienes cuenta? Regístrate aquí
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2d5016',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2d5016',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#2d5016',
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

export default LoginScreen;
