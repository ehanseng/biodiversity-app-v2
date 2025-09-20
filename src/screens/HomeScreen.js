import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/NewAuthContext';
import hybridTreeService from '../services/HybridTreeService';
import TreeStorageService from '../services/TreeStorageService';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';
import SimpleTreeStorage from '../services/SimpleTreeStorage';
import mySQLService from '../services/MySQLService';

const HomeScreen = ({ navigation }) => {
  const { user, profile, syncStats, forceSyncTrees, refreshProfile, getStats } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [treeStats, setTreeStats] = useState({
    totalTrees: 0,
    myTrees: 0,
    approvedTrees: 0,
    pendingTrees: 0,
    rejectedTrees: 0,
    localTrees: 0,
  });
  const [syncing, setSyncing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    console.log('🏠 [HomeScreen] Componente montado, iniciando sincronización automática...');
    
    // Ejecutar sincronización automática al cargar
    const initializeApp = async () => {
      try {
        // 1. Cargar estadísticas actualizadas
        await loadTreeStats();
        
        // 2. Refrescar perfil
        await refreshProfile();
        
      } catch (error) {
        console.error('❌ [HomeScreen] Error en inicialización:', error);
        // Si falla, al menos cargar estadísticas básicas
        await loadTreeStats();
      }
    };
    
    initializeApp();

    // Escuchar eventos de actualización
    const unsubscribeTreeCreated = eventEmitter.on(EVENTS.TREE_CREATED, () => {
      console.log('🌳 [HomeScreen] Árbol creado, actualizando stats...');
      loadTreeStats();
    });

    const unsubscribeTreesSynced = eventEmitter.on(EVENTS.TREES_SYNCED, () => {
      console.log('🔄 [HomeScreen] Árboles sincronizados, actualizando stats...');
      loadTreeStats();
    });

    const unsubscribeDataRefresh = eventEmitter.on(EVENTS.DATA_REFRESH, () => {
      console.log('🔄 [HomeScreen] Datos actualizados, recargando stats...');
      loadTreeStats();
    });

    // Cleanup listeners cuando el componente se desmonte
    return () => {
      unsubscribeTreeCreated();
      unsubscribeTreesSynced();
      unsubscribeDataRefresh();
    };
  }, []);

  // También escuchar cuando la pantalla recibe focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('🔄 [HomeScreen] Pantalla enfocada, ejecutando auto-sync...');
      await hybridTreeService.autoSync();
      await loadTreeStats();
    });

    return unsubscribe;
  }, [navigation]);

  const loadTreeStats = async () => {
    try {
      console.log('📊 [HomeScreen] Cargando estadísticas de la comunidad...');
      
      // Obtener árboles locales pendientes del usuario
      const localTrees = SimpleTreeStorage.getLocalTrees();
      const pendingLocalTrees = localTrees.filter(tree => 
        !tree.mysql_id && (tree.syncStatus !== 'synced') && tree.common_name
      );
      
      // Obtener estadísticas del servidor MySQL
      let communityStats = { flora: 0, fauna: 0, total: 0 };
      try {
        const serverTrees = await mySQLService.getAllRecords();
        console.log('🌐 [HomeScreen] Registros de la comunidad:', serverTrees.length);
        
        // Solo contar registros aprobados de la comunidad
        const approvedTrees = serverTrees.filter(tree => tree.status === 'approved');
        
        communityStats = {
          flora: approvedTrees.filter(tree => tree.type === 'flora' || !tree.type).length,
          fauna: approvedTrees.filter(tree => tree.type === 'fauna').length,
          total: approvedTrees.length,
          pending: pendingLocalTrees.length // Árboles pendientes del usuario
        };
        
        console.log('🌳 [HomeScreen] Estadísticas de la comunidad:', communityStats);
      } catch (error) {
        console.warn('⚠️ [HomeScreen] Error obteniendo datos de la comunidad:', error.message);
      }

      setTreeStats(communityStats);
    } catch (error) {
      console.error('❌ Error loading community stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 [HomeScreen] Refresh manual - ejecutando auto-sync...');
      // Ejecutar auto-sync para detectar cambios del servidor
      await hybridTreeService.autoSync();
      // Recargar estadísticas
      await loadTreeStats();
    } catch (error) {
      console.error('❌ [HomeScreen] Error en refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      console.log('🔄 [HomeScreen] Iniciando sincronización manual...');
      
      // Limpiar datos locales primero
      console.log('🧹 [HomeScreen] Limpiando datos locales...');
      const cleanResult = await hybridTreeService.cleanLocalData();
      console.log(`🧹 [HomeScreen] Limpieza: ${cleanResult.removed} elementos eliminados`);
      
      // Usar HybridTreeService para sincronizar
      const result = await hybridTreeService.syncLocalToMySQL();
      
      console.log(`✅ [HomeScreen] Sincronización completada: ${result.synced} exitosos, ${result.errors} errores`);
      
      // Recargar estadísticas siempre
      console.log('🔄 [HomeScreen] Recargando estadísticas...');
      await loadTreeStats();
      
      // Esperar un poco y recargar de nuevo para asegurar actualización
      setTimeout(async () => {
        console.log('🔄 [HomeScreen] Segunda recarga de estadísticas...');
        await loadTreeStats();
      }, 1000);
      
      if (result.synced > 0) {
        // Mostrar mensaje de éxito
        alert(`¡Sincronización exitosa! ${result.synced} árboles sincronizados.`);
      } else if (result.total === 0) {
        alert('No hay árboles pendientes de sincronizar.');
      } else {
        alert(`Sincronización completada con ${result.errors} errores.`);
      }
      
    } catch (error) {
      console.error('❌ [HomeScreen] Error in manual sync:', error);
      alert(`Error en sincronización: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'explorer':
        return ' Explorador';
      case 'scientist':
        return ' Científico';
      case 'admin':
        return ' Administrador';
      default:
        return ' Usuario';
    }
  };

  const toggleFabMenu = () => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    setFabOpen(!fabOpen);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            ¡Hola, {profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}!
          </Text>
          <Text style={styles.subtitle}>
            {profile?.full_name ? profile.full_name : (user?.email || 'Usuario sin email')}
          </Text>
          {profile?.role && (
            <Text style={styles.roleText}>
              {profile.role === 'explorer' ? '🌱 Explorador' : 
               profile.role === 'scientist' ? '🔬 Científico' : '⚙️ Administrador'}
            </Text>
          )}
        </View>

        {/* Indicador de Sincronización */}
        {treeStats.localTrees > 0 && (
          <View style={styles.syncIndicator}>
            <View style={styles.syncInfo}>
              <Ionicons 
                name={syncing ? "sync" : "cloud-upload-outline"} 
                size={20} 
                color="#ffc107" 
                style={syncing ? styles.spinning : null}
              />
              <Text style={styles.syncText}>
                {syncing 
                  ? 'Sincronizando...' 
                  : `${treeStats.localTrees} árboles pendientes de sincronizar`
                }
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleManualSync}
              disabled={syncing}
            >
              <Ionicons 
                name={syncing ? "sync" : "cloud-download-outline"} 
                size={20} 
                color={syncing ? "#6c757d" : "#ffffff"} 
              />
              <Text style={[styles.syncButtonText, syncing && styles.syncButtonTextDisabled]}>
                {syncing ? 'Sincronizando...' : 'Sincronizar Árboles'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estadísticas de la Comunidad */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>🌍 Registros de la Comunidad</Text>
          
          <View style={styles.communityStatsGrid}>
            {/* Flora */}
            <TouchableOpacity 
              style={styles.communityStatCard}
              onPress={() => navigation.navigate('Explorer', { initialFilter: 'approved' })}
            >
              <View style={styles.communityStatIcon}>
                <Text style={styles.communityStatEmoji}>🌳</Text>
              </View>
              <Text style={styles.communityStatNumber}>{treeStats.flora || 0}</Text>
              <Text style={styles.communityStatLabel}>Flora Aprobada</Text>
            </TouchableOpacity>
            
            {/* Fauna */}
            <TouchableOpacity 
              style={styles.communityStatCard}
              onPress={() => navigation.navigate('Explorer', { initialFilter: 'approved' })}
            >
              <View style={styles.communityStatIcon}>
                <Text style={styles.communityStatEmoji}>🐾</Text>
              </View>
              <Text style={styles.communityStatNumber}>{treeStats.fauna || 0}</Text>
              <Text style={styles.communityStatLabel}>Fauna Aprobada</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Explorer')}
          >
            <Ionicons name="search-outline" size={20} color="#ffffff" />
            <Text style={styles.exploreButtonText}>Ver Todos los Registros</Text>
          </TouchableOpacity>
        </View>

        {/* Botón especial para científicos y admins */}
        {(profile?.role === 'scientist' || profile?.role === 'admin') && (
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Panel de Revisión</Text>
            <TouchableOpacity 
              style={[styles.actionButton, styles.scientistButton]}
              onPress={() => navigation.navigate('ScientistApproval')}
            >
              <Ionicons name="checkmark-done-circle" size={24} color="#ffffff" />
              <Text style={styles.actionButtonText}>
                🔬 Revisión Científica
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Menú FAB Animado Definitivo */}
      <View style={styles.fabContainer}>
        {/* Botón principal (se renderiza primero) */}
        <TouchableOpacity onPress={toggleFabMenu} style={styles.fabMain}>
          <Animated.View style={[styles.fab, { transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }]}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>

        {/* Botones secundarios (se renderizan encima) */}
        <Animated.View style={[styles.secondaryFab, { zIndex: 10, transform: [{ scale: animation }, { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -120] }) }] }]}>
          <TouchableOpacity onPress={() => navigation.navigate('AddTree')}>
            <View style={styles.fab}>
              <Ionicons name="leaf" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.secondaryFab, { zIndex: 10, transform: [{ scale: animation }, { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }] }]}>
          <TouchableOpacity onPress={() => navigation.navigate('AddAnimal')}>
            <View style={styles.fab}>
              <Ionicons name="paw" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
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
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  roleText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  syncIndicator: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    margin: 15,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncText: {
    marginLeft: 10,
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  syncButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  syncButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  syncButtonTextDisabled: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
  spinning: {
    // Aquí podrías agregar una animación de rotación si quieres
  },
  statsContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  communityStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  communityStatCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
  communityStatIcon: {
    marginBottom: 10,
  },
  communityStatEmoji: {
    fontSize: 40,
  },
  communityStatNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 5,
  },
  communityStatLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsContainer: {
    padding: 15,
  },
  actionButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2d5016',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#2d5016',
  },
  scientistButton: {
    backgroundColor: '#007bff',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2d5016',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  secondaryFab: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  fabMain: {
    zIndex: 20, // Asegurar que el botón principal esté encima
  },
});

export default HomeScreen;
