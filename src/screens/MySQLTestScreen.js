import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import mySQLService from '../services/MySQLService';

const MySQLTestScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [currentURL, setCurrentURL] = useState(mySQLService.getCurrentURL());
  const [showURLConfig, setShowURLConfig] = useState(false);
  const [newURL, setNewURL] = useState('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      setConnectionStatus('testing');
      
      // Probar conexión básica usando la URL actual del servicio
      const healthURL = `${currentURL.replace('/api', '')}/api/health`;
      console.log('🔍 Probando conexión a:', healthURL);
      
      const response = await fetch(healthURL);
      const data = await response.json();
      
      if (data.status === 'OK') {
        setConnectionStatus('connected');
        loadRecords();
        loadStats();
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('❌ Error probando conexión:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const changeServerURL = () => {
    if (newURL.trim()) {
      // Asegurar que la URL termine con /api
      let formattedURL = newURL.trim();
      if (!formattedURL.endsWith('/api')) {
        formattedURL = formattedURL.replace(/\/$/, '') + '/api';
      }
      
      mySQLService.setAPIURL(formattedURL);
      setCurrentURL(formattedURL);
      setShowURLConfig(false);
      setNewURL('');
      
      Alert.alert('✅ URL Actualizada', `Servidor cambiado a:\n${formattedURL}`, [
        { text: 'Probar Conexión', onPress: testConnection }
      ]);
    }
  };

  const resetToLocal = () => {
    const localURL = 'http://localhost:3001/api';
    mySQLService.setAPIURL(localURL);
    setCurrentURL(localURL);
    setShowURLConfig(false);
    
    Alert.alert('🏠 Servidor Local', 'Cambiado a servidor local', [
      { text: 'Probar Conexión', onPress: testConnection }
    ]);
  };

  const loadRecords = async () => {
    try {
      const data = await mySQLService.getAllRecords();
      setRecords(data);
      console.log('📊 Registros cargados desde MySQL:', data.length);
    } catch (error) {
      console.error('❌ Error cargando registros:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros de MySQL');
    }
  };

  const loadStats = async () => {
    try {
      const data = await mySQLService.getStats();
      setStats(data);
      console.log('📈 Estadísticas cargadas:', data);
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
    }
  };

  const testLogin = async () => {
    try {
      setLoading(true);
      const result = await mySQLService.login('explorer@vibo.co', 'explorer123');
      
      if (result.success) {
        Alert.alert('✅ Login Exitoso', `Bienvenido ${result.user.full_name}`);
        console.log('👤 Usuario logueado:', result.user);
      } else {
        Alert.alert('❌ Error', 'Login fallido');
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestRecord = async () => {
    try {
      setLoading(true);
      const testRecord = {
        user_id: 1,
        type: 'flora',
        common_name: 'Árbol de Prueba MySQL',
        scientific_name: 'Testus mysqlius',
        description: 'Árbol creado desde la app para probar MySQL',
        latitude: 4.6100,
        longitude: -74.0820,
        location_description: 'Creado desde MySQLTestScreen',
        height_meters: 10.5,
        diameter_cm: 30.0,
        health_status: 'Excelente',
        image_url: 'https://picsum.photos/300/200?random=999'
      };

      const result = await mySQLService.createRecord(testRecord);
      
      if (result.success) {
        Alert.alert('✅ Registro Creado', `ID: ${result.record.id}`);
        loadRecords(); // Recargar lista
        loadStats(); // Recargar estadísticas
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const migrateFromLocalStorage = async () => {
    try {
      setLoading(true);
      const result = await mySQLService.migrateFromLocalStorage();
      
      if (result.success) {
        Alert.alert(
          '🎉 Migración Completada', 
          `Migrados: ${result.migrated}\nErrores: ${result.errors || 0}\nTotal: ${result.total || 0}`
        );
        loadRecords();
        loadStats();
      } else {
        Alert.alert('❌ Error en Migración', result.error);
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return { name: 'checkmark-circle', color: '#28a745' };
      case 'error': return { name: 'close-circle', color: '#dc3545' };
      case 'testing': return { name: 'time', color: '#ffc107' };
      default: return { name: 'help-circle', color: '#6c757d' };
    }
  };

  const connectionIcon = getConnectionIcon();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prueba MySQL</Text>
      </View>

      {/* Configuración de Servidor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Configuración de Servidor</Text>
        <View style={styles.serverCard}>
          <Text style={styles.serverLabel}>Servidor Actual:</Text>
          <Text style={styles.serverURL}>{currentURL}</Text>
          
          <View style={styles.serverButtons}>
            <TouchableOpacity 
              style={[styles.serverButton, { backgroundColor: '#007bff' }]}
              onPress={() => setShowURLConfig(true)}
            >
              <Ionicons name="settings" size={16} color="#ffffff" />
              <Text style={styles.serverButtonText}>Cambiar Servidor</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.serverButton, { backgroundColor: '#6c757d' }]}
              onPress={resetToLocal}
            >
              <Ionicons name="home" size={16} color="#ffffff" />
              <Text style={styles.serverButtonText}>Local</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Estado de Conexión */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 Estado de Conexión</Text>
        <View style={styles.connectionCard}>
          <Ionicons 
            name={connectionIcon.name} 
            size={32} 
            color={connectionIcon.color} 
          />
          <Text style={[styles.connectionText, { color: connectionIcon.color }]}>
            {connectionStatus === 'connected' && 'Conectado a MySQL'}
            {connectionStatus === 'error' && 'Error de Conexión'}
            {connectionStatus === 'testing' && 'Probando Conexión...'}
            {connectionStatus === 'unknown' && 'Estado Desconocido'}
          </Text>
          <TouchableOpacity style={styles.testButton} onPress={testConnection}>
            <Text style={styles.testButtonText}>Probar Conexión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estadísticas */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estadísticas MySQL</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.flora?.total || 0}</Text>
              <Text style={styles.statLabel}>🌳 Flora</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.fauna?.total || 0}</Text>
              <Text style={styles.statLabel}>🦋 Fauna</Text>
            </View>
          </View>
        </View>
      )}

      {/* Registros */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Registros MySQL ({records.length})</Text>
        {records.slice(0, 5).map((record, index) => (
          <View key={record.id} style={styles.recordCard}>
            <Text style={styles.recordName}>
              {record.type === 'fauna' ? '🦋' : '🌳'} {record.common_name}
            </Text>
            <Text style={styles.recordDetails}>
              {record.scientific_name} • {record.status}
            </Text>
          </View>
        ))}
      </View>

      {/* Acciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Acciones de Prueba</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#007bff' }]}
          onPress={testLogin}
          disabled={loading}
        >
          <Ionicons name="log-in" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Probar Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#28a745' }]}
          onPress={createTestRecord}
          disabled={loading}
        >
          <Ionicons name="add-circle" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Crear Registro de Prueba</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#ffc107' }]}
          onPress={migrateFromLocalStorage}
          disabled={loading}
        >
          <Ionicons name="sync" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Migrar desde localStorage</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#6c757d' }]}
          onPress={() => {
            loadRecords();
            loadStats();
          }}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Recargar Datos</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}

      {/* Modal de Configuración de URL */}
      <Modal
        visible={showURLConfig}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowURLConfig(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🌐 Configurar Servidor</Text>
            
            <Text style={styles.modalLabel}>URL del Servidor:</Text>
            <TextInput
              style={styles.modalInput}
              value={newURL}
              onChangeText={setNewURL}
              placeholder="https://mi-servidor.com:3001"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Text style={styles.modalHint}>
              💡 Ejemplos:{'\n'}
              • https://mi-servidor.com:3001{'\n'}
              • http://192.168.1.100:3001{'\n'}
              • https://biodiversity-api.herokuapp.com
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => {
                  setShowURLConfig(false);
                  setNewURL('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#007bff' }]}
                onPress={changeServerURL}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2d5016',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 10,
  },
  connectionCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectionText: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
  },
  testButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10,
  },
  testButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5016',
  },
  recordDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  // Estilos para configuración de servidor
  serverCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serverLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  serverURL: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5016',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  serverButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  serverButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
  },
  // Estilos para modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d5016',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5016',
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  modalHint: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MySQLTestScreen;
