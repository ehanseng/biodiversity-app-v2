import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/SimpleAuthContext';
import SimpleTreeService from '../services/SimpleTreeService';
import SimpleAnimalService from '../services/SimpleAnimalService';
import RankingCard from '../components/RankingCard';
import usePageTitle from '../hooks/usePageTitle';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  usePageTitle('Home'); // Actualizar título de la página
  const [refreshing, setRefreshing] = useState(false);
  const [treeStats, setTreeStats] = useState({
    totalTrees: 0,
    myTrees: 0,
    approvedTrees: 0,
    pendingTrees: 0,
    rejectedTrees: 0,
    localTrees: 0,
    flora: 0,
    fauna: 0,
    explorerPoints: 0,
  });
  const [syncing, setSyncing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];
  const scrollIndicatorAnimation = useState(new Animated.Value(0))[0];

  // Animación continua para el indicador de scroll
  useEffect(() => {
    const startScrollAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scrollIndicatorAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scrollIndicatorAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startScrollAnimation();
  }, [scrollIndicatorAnimation]);

  useEffect(() => {
    console.log('🏠 [HomeScreen] Componente montado, iniciando sincronización automática...');
    
    // Ejecutar sincronización automática al cargar
    const initializeApp = async () => {
      try {
        // 1. Cargar estadísticas actualizadas
        await loadTreeStats();
        
        // 2. Usuario ya está cargado en el contexto simple
        
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
      console.log('🔄 [HomeScreen] Pantalla enfocada, recargando estadísticas...');
      await loadTreeStats();
    });

    return unsubscribe;
  }, [navigation]);

  const loadTreeStats = async () => {
    try {
      console.log('📊 [HomeScreen] Cargando estadísticas desde MySQL remoto...');
      
      const treeService = new SimpleTreeService();
      
      // Obtener todos los árboles del servidor
      const allTrees = await treeService.getAllTrees();
      console.log('🌐 [HomeScreen] Árboles totales del servidor:', allTrees.length);
      
      // Obtener árboles del usuario actual
      let myTrees = [];
      if (user?.id) {
        myTrees = await treeService.getTreesByUser(user.id);
        console.log('👤 [HomeScreen] Mis árboles:', myTrees.length);
        console.log('👤 [HomeScreen] Mis árboles aprobados:', myTrees.filter(tree => tree.status === 'approved').length);
        console.log('👤 [HomeScreen] Estados de mis árboles:', myTrees.map(tree => tree.status));
      }
      
      // Calcular estadísticas
      const stats = {
        totalTrees: allTrees.length,
        myTrees: myTrees.length,
        approvedTrees: allTrees.filter(tree => tree.status === 'approved').length,
        pendingTrees: allTrees.filter(tree => tree.status === 'pending').length,
        rejectedTrees: allTrees.filter(tree => tree.status === 'rejected').length,
        localTrees: 0, // Ya no usamos localStorage
        // Calcular flora y fauna aprobada del usuario actual
        flora: myTrees.filter(tree => tree.status === 'approved').length, // Árboles aprobados del usuario
        fauna: 0 // Por ahora solo tenemos árboles, fauna será 0
      };
      
      // Calcular puntos de explorador: árboles x 10 + animales x 15 (consistente con ranking)
      const explorerPoints = (stats.flora * 10) + (stats.fauna * 15);
      stats.explorerPoints = explorerPoints;
      
      console.log('📊 [HomeScreen] Estadísticas calculadas:', stats);
      setTreeStats(stats);
      
    } catch (error) {
      console.error('❌ [HomeScreen] Error cargando estadísticas:', error);
      // Estadísticas por defecto en caso de error
      setTreeStats({
        totalTrees: 0,
        myTrees: 0,
        approvedTrees: 0,
        pendingTrees: 0,
        rejectedTrees: 0,
        localTrees: 0,
        flora: 0,
        fauna: 0,
        explorerPoints: 0
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 [HomeScreen] Refresh manual - recargando estadísticas...');
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
      console.log('🔄 [HomeScreen] Recargando datos desde servidor...');
      
      // Simplemente recargar estadísticas desde el servidor
      await loadTreeStats();
      
      console.log('✅ [HomeScreen] Datos actualizados exitosamente');
      alert('¡Datos actualizados desde el servidor!');
      
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
            ¡Hola, {user?.full_name || user?.email?.split('@')[0] || 'Usuario'}!
          </Text>
          {user?.role && (
            <Text style={styles.roleText}>
              {user.role === 'explorer' ? '🌱 Explorador' : 
               user.role === 'scientist' ? '🔬 Científico' : '⚙️ Administrador'}
            </Text>
          )}
        </View>

        {/* Sección de Puntos de Explorador */}
        <View style={styles.explorerPointsContainer}>
          <View style={styles.explorerPointsCard}>
            <View style={styles.explorerIconContainer}>
              <Text style={styles.explorerIcon}>🧭</Text>
            </View>
            <View style={styles.explorerPointsInfo}>
              <Text style={styles.explorerPointsTitle}>Puntos de Explorador</Text>
              <Text style={styles.explorerPointsNumber}>{treeStats.explorerPoints}</Text>
              <Text style={styles.explorerPointsSubtitle}>
                {treeStats.flora} árboles × 10 + {treeStats.fauna} animales × 15
              </Text>
            </View>
            <View style={styles.explorerBadge}>
              <Text style={styles.explorerBadgeText}>
                {treeStats.explorerPoints >= 100 ? '🏆 Experto' : 
                 treeStats.explorerPoints >= 50 ? '🥇 Avanzado' : 
                 treeStats.explorerPoints >= 20 ? '🥈 Intermedio' : '🥉 Novato'}
              </Text>
            </View>
          </View>
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
          <Text style={styles.sectionTitle}>🌱 Mis Registros Aprobados</Text>
          
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
              <Text style={styles.communityStatLabel}>Mis Árboles Aprobados</Text>
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
              <Text style={styles.communityStatLabel}>Mis Animales Aprobados</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ranking de Exploradores */}
        <RankingCard />

        {/* Indicador animado hacia abajo */}
        <View style={styles.scrollIndicatorContainer}>
          <Text style={styles.scrollIndicatorText}>Explora por categoría</Text>
          <Animated.View style={[
            styles.scrollIndicator,
            {
              transform: [{
                translateY: scrollIndicatorAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 8]
                })
              }]
            }
          ]}>
            <Ionicons name="chevron-down" size={24} color="#2d5016" />
          </Animated.View>
        </View>

        {/* Botón especial para científicos y admins */}
        {(user?.role === 'scientist' || user?.role === 'admin') && (
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
  explorerPointsContainer: {
    padding: 15,
    paddingBottom: 0,
  },
  explorerPointsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    borderLeftWidth: 5,
    borderLeftColor: '#ffd700',
  },
  explorerIconContainer: {
    marginRight: 15,
  },
  explorerIcon: {
    fontSize: 40,
  },
  explorerPointsInfo: {
    flex: 1,
  },
  explorerPointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5016',
    marginBottom: 5,
  },
  explorerPointsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 3,
  },
  explorerPointsSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  explorerBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  explorerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d5016',
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
  scrollIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginTop: 5,
  },
  scrollIndicatorText: {
    fontSize: 16,
    color: '#2d5016',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
