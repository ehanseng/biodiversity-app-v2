import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import TreeStorageService from '../services/TreeStorageService';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';

const HomeScreen = ({ navigation }) => {
  const { user, profile, syncStats, forceSyncTrees, refreshProfile } = useAuth();
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
    loadTreeStats();
  }, [syncStats]);

  // Cargar stats cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      console.log('👤 Usuario disponible, cargando stats iniciales...');
      loadTreeStats();
    }
  }, [user?.id]);

  // Escuchar eventos de cambios en árboles
  useEffect(() => {
    const unsubscribeTreeCreated = eventEmitter.on(EVENTS.TREE_CREATED, () => {
      console.log(' [HomeScreen] Árbol creado, actualizando stats...');
      loadTreeStats();
    });

    const unsubscribeTreesSynced = eventEmitter.on(EVENTS.TREES_SYNCED, () => {
      console.log(' [HomeScreen] Árboles sincronizados, actualizando stats...');
      loadTreeStats();
    });

    const unsubscribeDataRefresh = eventEmitter.on(EVENTS.DATA_REFRESH_NEEDED, () => {
      console.log(' [HomeScreen] Actualización solicitada, recargando stats...');
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
    const unsubscribe = navigation.addListener('focus', () => {
      console.log(' [HomeScreen] Pantalla enfocada, actualizando stats...');
      loadTreeStats();
    });

    return unsubscribe;
  }, [navigation]);

  const loadTreeStats = async () => {
    try {
      console.log('📊 Cargando estadísticas de árboles para usuario:', user?.id);
      const allTrees = await TreeStorageService.getAllTrees(user?.id);
      console.log('🌳 Árboles obtenidos:', allTrees.length);
      
      // Calcular estadísticas usando la lógica simplificada
      const myTrees = allTrees.filter(tree => 
        tree.user_id === user?.id || (tree.source === 'local' && tree.canEdit)
      ).length;
      
      // Todos los árboles aprobados (de cualquier usuario) para "Todos"
      const totalApprovedTrees = allTrees.filter(tree => 
        tree.approval_status === 'approved'
      ).length;
      
      // Solo MIS árboles aprobados
      const myApprovedTrees = allTrees.filter(tree => {
        const isMine = tree.user_id === user?.id || (tree.source === 'local' && tree.canEdit);
        return isMine && tree.approval_status === 'approved';
      }).length;
      
      // Solo MIS árboles pendientes
      const myPendingTrees = allTrees.filter(tree => {
        const isMine = tree.user_id === user?.id || (tree.source === 'local' && tree.canEdit);
        return isMine && tree.approval_status === 'pending';
      }).length;
      
      // Solo MIS árboles rechazados
      const myRejectedTrees = allTrees.filter(tree => {
        const isMine = tree.user_id === user?.id || (tree.source === 'local' && tree.canEdit);
        return isMine && tree.approval_status === 'rejected';
      }).length;
      
      // Árboles locales (no enviados al servidor)
      const localTrees = allTrees.filter(tree => 
        tree.source === 'local'
      ).length;

      const newStats = {
        totalTrees: totalApprovedTrees, // Solo árboles aprobados en "Todos"
        myTrees: myTrees,
        approvedTrees: myApprovedTrees, // Solo mis árboles aprobados
        pendingTrees: myPendingTrees, // Solo mis árboles pendientes
        rejectedTrees: myRejectedTrees, // Solo mis árboles rechazados
        localTrees: localTrees,
      };

      console.log('📈 Estadísticas calculadas:', newStats);
      setTreeStats(newStats);
    } catch (error) {
      console.error('❌ Error loading tree stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTreeStats();
    setRefreshing(false);
  };

  const handleManualSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      const success = await forceSyncTrees();
      if (success) {
        await loadTreeStats();
      }
    } catch (error) {
      console.error('Error in manual sync:', error);
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
      useNativeDriver: true,
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

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>📊 Estadísticas</Text>
          
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={[styles.statCard, { borderLeftColor: '#28a745' }]}
              onPress={() => navigation.navigate('Explorer', { initialFilter: 'all' })}
            >
              <Text style={styles.statNumber}>{treeStats.totalTrees}</Text>
              <Text style={styles.statLabel}>Aprobados (Todos)</Text>
            </TouchableOpacity>
            
            {/* Mostrar estadísticas de "mis árboles" para exploradores, científicos y admins */}
            {(profile?.role === 'explorer' || profile?.role === 'scientist' || profile?.role === 'admin') && (
              <>
                <TouchableOpacity 
                  style={[styles.statCard, { borderLeftColor: '#007bff' }]}
                  onPress={() => navigation.navigate('Explorer', { initialFilter: 'mine' })}
                >
                  <Text style={styles.statNumber}>{treeStats.myTrees}</Text>
                  <Text style={styles.statLabel}>Mis Árboles</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.statCard, { borderLeftColor: '#28a745' }]}
                  onPress={() => navigation.navigate('Explorer', { initialFilter: 'approved' })}
                >
                  <Text style={styles.statNumber}>{treeStats.approvedTrees}</Text>
                  <Text style={styles.statLabel}>Mis Aprobados</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.statCard, { borderLeftColor: '#ffc107' }]}
                  onPress={() => navigation.navigate('Explorer', { initialFilter: 'pending' })}
                >
                  <Text style={styles.statNumber}>{treeStats.pendingTrees}</Text>
                  <Text style={styles.statLabel}>Mis Pendientes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.statCard, { borderLeftColor: '#dc3545' }]}
                  onPress={() => navigation.navigate('Explorer', { initialFilter: 'rejected' })}
                >
                  <Text style={styles.statNumber}>{treeStats.rejectedTrees}</Text>
                  <Text style={styles.statLabel}>Mis Rechazados</Text>
                </TouchableOpacity>
                
                {treeStats.localTrees > 0 && (
                  <TouchableOpacity 
                    style={[styles.statCard, { borderLeftColor: '#6f42c1' }]}
                    onPress={() => navigation.navigate('Explorer', { initialFilter: 'local' })}
                  >
                    <Text style={styles.statNumber}>{treeStats.localTrees}</Text>
                    <Text style={styles.statLabel}>Locales</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
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

      {/* Menú FAB Animado */}
      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('AddAnimal')}>
          <Animated.View style={[styles.fab, styles.secondaryFab, { transform: [{ scale: animation }, { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }] }]}>
            <Ionicons name="paw" size={24} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AddTree')}>
          <Animated.View style={[styles.fab, styles.secondaryFab, { transform: [{ scale: animation }, { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -120] }) }] }]}>
            <Ionicons name="leaf" size={24} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFabMenu}>
          <Animated.View style={[styles.fab, { transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }]}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
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
  },
  fab: {
    backgroundColor: '#2d5016',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
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
  secondaryFab: {
    backgroundColor: '#007bff',
  },
});

export default HomeScreen;
