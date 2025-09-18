import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import TreeStorageService from '../services/TreeStorageService';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';

const ExplorerScreen = ({ navigation, route }) => {
  const { user, getAllTrees } = useAuth();
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(route?.params?.initialFilter || 'all'); // all, mine, approved, pending, local, rejected
  const [fabOpen, setFabOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadTrees();
  }, []);

  useEffect(() => {
    if (route?.params?.initialFilter) {
      setFilter(route.params.initialFilter);
    }
  }, [route?.params?.initialFilter]);

  useEffect(() => {
    const unsubscribeTreeCreated = eventEmitter.on(EVENTS.TREE_CREATED, () => {
      console.log(' [ExplorerScreen] Árbol creado, actualizando lista...');
      loadTrees();
    });

    const unsubscribeTreesSynced = eventEmitter.on(EVENTS.TREES_SYNCED, () => {
      console.log(' [ExplorerScreen] Árboles sincronizados, actualizando lista...');
      loadTrees();
    });

    const unsubscribeDataRefresh = eventEmitter.on(EVENTS.DATA_REFRESH_NEEDED, () => {
      console.log(' [ExplorerScreen] Actualización solicitada, recargando lista...');
      loadTrees();
    });

    return () => {
      unsubscribeTreeCreated();
      unsubscribeTreesSynced();
      unsubscribeDataRefresh();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log(' [ExplorerScreen] Pantalla enfocada, actualizando lista...');
      loadTrees();
    });

    return unsubscribe;
  }, [navigation]);

  const loadTrees = async () => {
    try {
      setLoading(true);
      console.log(' [ExplorerScreen] Cargando árboles...');
      console.log(' [ExplorerScreen] User ID:', user?.id);
      
      const allTrees = await getAllTrees();
      console.log(' [ExplorerScreen] Árboles obtenidos:', allTrees.length);
      console.log(' [ExplorerScreen] Primer árbol:', allTrees[0]);
      
      setTrees(allTrees);
    } catch (error) {
      console.error(' [ExplorerScreen] Error loading trees:', error);
      Alert.alert('Error', 'No se pudieron cargar los árboles');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrees();
    setRefreshing(false);
  };

  const getFilteredTrees = () => {
    switch (filter) {
      case 'mine':
        return trees.filter(tree => 
          tree.user_id === user.id || 
          (tree.source === 'local' && tree.canEdit)
        );
      case 'approved':
        return trees.filter(tree => {
          const isOwn = tree.user_id === user.id || (tree.source === 'local' && tree.canEdit);
          return isOwn && tree.approval_status === 'approved';
        });
      case 'pending':
        return trees.filter(tree => {
          const isOwn = tree.user_id === user.id || (tree.source === 'local' && tree.canEdit);
          return isOwn && tree.approval_status === 'pending';
        });
      case 'rejected':
        return trees.filter(tree => {
          const isOwn = tree.user_id === user.id || (tree.source === 'local' && tree.canEdit);
          return isOwn && tree.approval_status === 'rejected';
        });
      case 'local':
        return trees.filter(tree => 
          tree.source === 'local'
        );
      default: // 'all'
        return trees.filter(tree => 
          tree.approval_status === 'approved'
        );
    }
  };

  const getStatusColor = (tree) => {
    if (tree.source === 'local') {
      switch (tree.syncStatus) {
        case 'pending': return '#ffc107';
        case 'synced': return '#28a745';
        case 'error': return '#dc3545';
        default: return '#6c757d';
      }
    } else {
      switch (tree.approval_status || tree.status) {
        case 'approved': return '#28a745';
        case 'pending': return '#ffc107';
        case 'rejected': return '#dc3545';
        default: return '#6c757d';
      }
    }
  };

  const getStatusText = (tree) => {
    if (tree.source === 'local') {
      return '📱 Local';
    } else {
      switch (tree.approval_status || tree.status) {
        case 'approved': return '✅ Aprobado';
        case 'pending': return '⏳ Pendiente';
        case 'rejected': return '❌ Rechazado';
        default: return '⏳ Pendiente';
      }
    }
  };

  const canEditTree = (tree) => {
    return tree.canEdit || (tree.user_id === user.id);
  };

  const handleTreePress = (tree) => {
    if (canEditTree(tree)) {
      // Navegar a editar si es propio
      navigation.navigate('EditTree', { tree });
    } else {
      // Mostrar detalles si es de otro usuario
      showTreeDetails(tree);
    }
  };

  const showTreeDetails = (tree) => {
    const creatorName = tree.profiles?.full_name || tree.createdBy || 'Usuario desconocido';
    
    Alert.alert(
      tree.common_name,
      ` ${tree.scientific_name || 'Sin nombre científico'}

 ${tree.location_description || 'Ubicación no especificada'}

 Altura: ${tree.height || 'No especificada'} m
 Diámetro: ${tree.diameter || 'No especificado'} cm
 Estado: ${tree.health_status || 'No especificado'}

 Registrado por: ${creatorName}
 Fecha: ${new Date(tree.created_at || tree.createdAt).toLocaleDateString()}

${tree.description || ''}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        ...(tree.latitude && tree.longitude ? [
          { text: 'Ver en Mapa', onPress: () => navigation.navigate('Map', { 
            focusTree: { 
              latitude: tree.latitude, 
              longitude: tree.longitude,
              title: tree.common_name 
            }
          })}
        ] : [])
      ]
    );
  };

  const renderTreeItem = ({ item: tree }) => {
    const isOwn = canEditTree(tree);
    const creatorName = tree.profiles?.full_name || tree.createdBy || 'Usuario';
    
    return (
      <TouchableOpacity
        style={[styles.treeCard, isOwn && styles.ownTreeCard]}
        onPress={() => handleTreePress(tree)}
      >
        <View style={styles.treeHeader}>
          <View style={styles.treeInfo}>
            <Text style={styles.treeName}>{tree.common_name}</Text>
            {tree.scientific_name && (
              <Text style={styles.scientificName}>{tree.scientific_name}</Text>
            )}
          </View>
          
          <View style={styles.treeActions}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tree) }]}>
              <Text style={styles.statusText}>{getStatusText(tree)}</Text>
            </View>
            
            {isOwn ? (
              <Ionicons name="create-outline" size={20} color="#007bff" />
            ) : (
              <Ionicons name="eye-outline" size={20} color="#6c757d" />
            )}
          </View>
        </View>

        <View style={styles.treeDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6c757d" />
            <Text style={styles.detailText}>
              {tree.location_description || 'Ubicación no especificada'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#6c757d" />
            <Text style={styles.detailText}>
              {isOwn ? 'Tuyo' : `Por ${creatorName}`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6c757d" />
            <Text style={styles.detailText}>
              {new Date(tree.created_at || tree.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {tree.description && (
          <Text style={styles.description} numberOfLines={2}>
            {tree.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ filterKey, title, count }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterKey && styles.activeFilter]}
      onPress={() => setFilter(filterKey)}
    >
      <Text style={[styles.filterText, filter === filterKey && styles.activeFilterText]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  const filteredTrees = getFilteredTrees();
  const myTreesCount = trees.filter(tree => canEditTree(tree)).length;
  
  // Contar solo MIS árboles aprobados
  const approvedCount = trees.filter(tree => {
    const isOwn = tree.user_id === user.id || (tree.source === 'local' && tree.canEdit);
    return isOwn && tree.approval_status === 'approved';
  }).length;
  
  // Contar solo MIS árboles pendientes
  const pendingCount = trees.filter(tree => {
    const isOwn = tree.user_id === user.id || (tree.source === 'local' && tree.canEdit);
    return isOwn && tree.approval_status === 'pending';
  }).length;
  
  // Contar árboles locales (no enviados al servidor)
  const localCount = trees.filter(tree => 
    tree.source === 'local'
  ).length;
  
  // Contar solo MIS árboles rechazados
  const rejectedCount = trees.filter(tree => {
    const isOwn = tree.user_id === user.id || (tree.source === 'local' && tree.canEdit);
    return isOwn && tree.approval_status === 'rejected';
  }).length;
  
  // Contador para "Todos" - solo árboles aprobados de cualquier usuario
  const allCount = trees.filter(tree => 
    tree.approval_status === 'approved'
  ).length;

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorador de Árboles</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTrees.length} árboles encontrados
        </Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <FilterButton filterKey="all" title="Todos" count={allCount} />
        <FilterButton filterKey="mine" title="Míos" count={myTreesCount} />
        <FilterButton filterKey="approved" title="Aprobados" count={approvedCount} />
        <FilterButton filterKey="pending" title="Pendientes" count={pendingCount} />
        <FilterButton filterKey="rejected" title="Rechazados" count={rejectedCount} />
        <FilterButton filterKey="local" title="Locales" count={localCount} />
      </View>

      {/* Lista de árboles */}
      <FlatList
        data={filteredTrees}
        renderItem={renderTreeItem}
        keyExtractor={(item) => item.id || item.databaseId || `local-${item.createdAt}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>No hay árboles</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'mine' 
                ? 'Aún no has registrado ningún árbol'
                : 'No se encontraron árboles con este filtro'
              }
            </Text>
            {filter === 'mine' && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddTree')}
              >
                <Text style={styles.addButtonText}>Agregar Primer Árbol</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#2d5016',
  },
  filterText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 15,
  },
  treeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ownTreeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  treeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  treeInfo: {
    flex: 1,
  },
  treeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6c757d',
  },
  treeActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  treeDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#2d5016',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  fab: {
    backgroundColor: '#2d5016',
    width: 56,
    height: 56,
    borderRadius: 28,
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
  },
  secondaryFab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});

export default ExplorerScreen;
