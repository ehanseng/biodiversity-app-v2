import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/NewAuthContext';

const LoadingScreen = () => {
  const { error, retryInitialization } = useAuth();

  const handleClearData = () => {
    Alert.alert(
      'Limpiar Datos',
      '¿Estás seguro que deseas limpiar los datos de sesión? Esto cerrará tu sesión actual y resolverá problemas de carga.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Limpiando datos desde LoadingScreen...');
              // Limpiar localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem('biodiversity_user');
                window.location.reload();
              }
            } catch (error) {
              console.error('Error limpiando datos:', error);
              Alert.alert('Error', 'No se pudieron limpiar los datos');
            }
          },
        },
      ]
    );
  };

  const handleRetry = async () => {
    try {
      await retryInitialization();
    } catch (error) {
      console.error('Error en reintento:', error);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Error de Conexión</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh-outline" size={20} color="#ffffff" />
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
              <Ionicons name="trash-outline" size={20} color="#dc3545" />
              <Text style={styles.clearButtonText}>Limpiar Datos</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.helpText}>
            Si el problema persiste, intenta refrescar la página o limpiar los datos de sesión.
            {'\n\n'}
            💡 Tip: Si acabas de actualizar la aplicación, es recomendable limpiar los datos para evitar conflictos.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d5016" />
        <Text style={styles.loadingText}>Cargando aplicación...</Text>
        <Text style={styles.subText}>Verificando sesión de usuario</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d5016',
    marginTop: 20,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d5016',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
    gap: 8,
  },
  clearButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

export default LoadingScreen;
