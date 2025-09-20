import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import mySQLService from '../services/MySQLService';

const MySQLTestScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      setConnectionStatus('testing');
      
      // Probar conexión básica
      const response = await fetch('http://localhost:3001/api/health');
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
});

export default MySQLTestScreen;
