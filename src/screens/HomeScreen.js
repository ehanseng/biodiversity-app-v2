import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/SimpleAuthContext';
import SimpleTreeService from '../services/SimpleTreeService';
import SimpleAnimalService from '../services/SimpleAnimalService';
import RankingCard from '../components/RankingCard';
import ScientistRankingCard from '../components/ScientistRankingCard';
import RankingService from '../services/RankingService';
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
  const [scientistStats, setScientistStats] = useState({
    treesApproved: 0,
    animalsApproved: 0,
    totalApprovals: 0,
    scientistPoints: 0,
    position: 0,
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
        await Promise.all([
          loadTreeStats(),
          loadScientistStats()
        ]);
        
        // 2. Usuario ya está cargado en el contexto simple
        
      } catch (error) {
        console.error('❌ [HomeScreen] Error en inicialización:', error);
        // Si falla, al menos cargar estadísticas básicas
        await Promise.all([
          loadTreeStats(),
          loadScientistStats()
        ]);
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
      
      // Calcular estadísticas según el rol del usuario
      const stats = {
        totalTrees: allTrees.length,
        myTrees: myTrees.length,
        approvedTrees: myTrees.filter(tree => tree.status === 'approved').length,
        pendingTrees: myTrees.filter(tree => tree.status === 'pending').length,
        rejectedTrees: allTrees.filter(tree => tree.status === 'rejected').length,
        localTrees: 0, // Ya no usamos localStorage
        // Para exploradores y científicos no aprobados: árboles aprobados, para científicos aprobados: todos sus árboles
        flora: (user?.role === 'explorer' || (user?.role === 'scientist' && user?.scientist_approval_status === 'pending'))
          ? myTrees.filter(tree => tree.status === 'approved').length 
          : myTrees.length,
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

  const loadScientistStats = async () => {
    try {
      if (!user?.id || user?.role !== 'scientist' || user?.scientist_approval_status !== 'approved') {
        return; // Solo cargar para científicos aprobados
      }

      console.log('🧪 [HomeScreen] Cargando estadísticas de científico...');
      
      const ranking = await RankingService.getScientistsRanking();
      const currentScientist = ranking.find(scientist => scientist.id === user.id);
      
      if (currentScientist) {
        setScientistStats({
          treesApproved: currentScientist.trees_approved || 0,
          animalsApproved: currentScientist.animals_approved || 0,
          totalApprovals: currentScientist.total_approvals || 0,
          scientistPoints: currentScientist.scientist_points || 0,
          position: currentScientist.position || 0,
        });
        console.log('✅ [HomeScreen] Estadísticas de científico cargadas:', currentScientist);
      } else {
        // Si no está en el ranking, significa que no tiene aprobaciones
        setScientistStats({
          treesApproved: 0,
          animalsApproved: 0,
          totalApprovals: 0,
          scientistPoints: 0,
          position: 0,
        });
        console.log('ℹ️ [HomeScreen] Científico no encontrado en ranking (sin aprobaciones)');
      }
      
    } catch (error) {
      console.error('❌ [HomeScreen] Error cargando estadísticas de científico:', error);
      setScientistStats({
        treesApproved: 0,
        animalsApproved: 0,
        totalApprovals: 0,
        scientistPoints: 0,
        position: 0,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 [HomeScreen] Refresh manual - recargando estadísticas...');
      // Recargar estadísticas
      await Promise.all([
        loadTreeStats(),
        loadScientistStats()
      ]);
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
               user.role === 'scientist' ? '🧪 Científico' : '⚙️ Administrador'}
            </Text>
          )}
        </View>

        {/* Mensaje para científicos en espera de aprobación */}
        {user?.role === 'scientist' && user?.scientist_approval_status === 'pending' && (
          <View style={styles.pendingApprovalContainer}>
            <View style={styles.pendingApprovalCard}>
              <View style={styles.pendingIconContainer}>
                <Text style={styles.pendingIcon}>🧪</Text>
              </View>
              <View style={styles.pendingContent}>
                <Text style={styles.pendingTitle}>Científico en Espera de Aprobación</Text>
                <Text style={styles.pendingMessage}>
                  Te has registrado como científico y tu cuenta está siendo revisada por un administrador. 
                  Mientras tanto, puedes usar la aplicación como explorador.
                </Text>
                <Text style={styles.pendingNote}>
                  Una vez aprobado, tendrás acceso completo a las funciones de científico.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sección de Puntos de Explorador - Para exploradores y científicos no aprobados */}
        {(user?.role === 'explorer' || (user?.role === 'scientist' && user?.scientist_approval_status === 'pending')) && (
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
        )}

        {/* Sección de Puntos de Científico - Solo para científicos aprobados */}
        {user?.role === 'scientist' && user?.scientist_approval_status === 'approved' && (
          <View style={styles.scientistPointsContainer}>
            <View style={styles.scientistPointsCard}>
              <View style={styles.scientistIconContainer}>
                <Text style={styles.scientistIcon}>🧪</Text>
              </View>
              <View style={styles.scientistPointsInfo}>
                <Text style={styles.scientistPointsTitle}>Puntos de Científico</Text>
                <Text style={styles.scientistPointsNumber}>{scientistStats.scientistPoints}</Text>
                <Text style={styles.scientistPointsSubtitle}>
                  {scientistStats.treesApproved} plantas × 10 + {scientistStats.animalsApproved} animales × 15
                </Text>
              </View>
              <View style={styles.scientistBadge}>
                <Text style={styles.scientistBadgeText}>
                  {scientistStats.position > 0 ? `#${scientistStats.position} en ranking` : 'Sin ranking'}
                </Text>
                <Text style={styles.scientistRankText}>
                  {scientistStats.totalApprovals} aprobaciones
                </Text>
              </View>
            </View>
          </View>
        )}

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

        {/* Estadísticas de Registros - Para exploradores y científicos (aprobados ven "creados", no aprobados ven "aprobados") */}
        {(user?.role === 'explorer' || user?.role === 'scientist') && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>
              {(user?.role === 'explorer' || (user?.role === 'scientist' && user?.scientist_approval_status === 'pending')) 
                ? '🌱 Mis Registros Aprobados' 
                : '📝 Mis Registros Creados'}
            </Text>
            
            <View style={styles.communityStatsGrid}>
              {/* Flora */}
              <TouchableOpacity 
                style={styles.communityStatCard}
                onPress={() => navigation.navigate('Explorer', { 
                  initialFilter: (user?.role === 'explorer' || (user?.role === 'scientist' && user?.scientist_approval_status === 'pending')) 
                    ? 'approved' 
                    : 'mine' 
                })}
              >
                <View style={styles.communityStatIcon}>
                  <Text style={styles.communityStatEmoji}>🌳</Text>
                </View>
                <Text style={styles.communityStatNumber}>{treeStats.flora || 0}</Text>
                <Text style={styles.communityStatLabel}>
                  {(user?.role === 'explorer' || (user?.role === 'scientist' && user?.scientist_approval_status === 'pending')) 
                    ? 'Mis Árboles Aprobados' 
                    : 'Árboles Registrados'}
                </Text>
              </TouchableOpacity>
              
              {/* Fauna */}
              <TouchableOpacity 
                style={styles.communityStatCard}
                onPress={() => navigation.navigate('AnimalExplorer', { 
                  initialFilter: (user?.role === 'explorer' || (user?.role === 'scientist' && user?.scientist_approval_status === 'pending')) 
                    ? 'approved' 
                    : 'mine' 
                })}
              >
                <View style={styles.communityStatIcon}>
                  <Text style={styles.communityStatEmoji}>🐾</Text>
                </View>
                <Text style={styles.communityStatNumber}>{treeStats.fauna || 0}</Text>
                <Text style={styles.communityStatLabel}>
                  {(user?.role === 'explorer' || (user?.role === 'scientist' && user?.scientist_approval_status === 'pending')) 
                    ? 'Mis Animales Aprobados' 
                    : 'Animales Registrados'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Ranking de Exploradores */}
        <RankingCard />

        {/* Ranking de Científicos */}
        <ScientistRankingCard />

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
          <TouchableOpacity onPress={() => {
            toggleFabMenu();
            setTimeout(() => navigation.navigate('AddTree'), 200);
          }}>
            <View style={styles.fab}>
              <Ionicons name="leaf" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.secondaryFab, { zIndex: 10, transform: [{ scale: animation }, { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }] }]}>
          <TouchableOpacity onPress={() => {
            toggleFabMenu();
            setTimeout(() => navigation.navigate('AddAnimal'), 200);
          }}>
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
  // Estilos para sección de puntos de científico
  scientistPointsContainer: {
    padding: 15,
    paddingBottom: 0,
  },
  scientistPointsCard: {
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
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  scientistIconContainer: {
    backgroundColor: '#e3f2fd',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  scientistIcon: {
    fontSize: 40,
  },
  scientistPointsInfo: {
    flex: 1,
  },
  scientistPointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 5,
  },
  scientistPointsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 3,
  },
  scientistPointsSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  scientistBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007bff',
    alignItems: 'center',
  },
  scientistBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 2,
  },
  scientistRankText: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
  },
  // Estilos para mensaje de perfil en revisión
  pendingApprovalContainer: {
    padding: 15,
    paddingBottom: 0,
  },
  pendingApprovalCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingIconContainer: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  pendingIcon: {
    fontSize: 24,
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  pendingMessage: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: 8,
  },
  pendingNote: {
    fontSize: 12,
    color: '#6c5700',
    fontStyle: 'italic',
    lineHeight: 16,
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
