import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import SafeImage from '../components/SafeImage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/SimpleAuthContext';
import SimpleTreeService from '../services/SimpleTreeService';
import SimpleAnimalService from '../services/SimpleAnimalService';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';

const ExplorerScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]); // Cambio: trees -> records para incluir árboles y animales
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(route?.params?.initialFilter || 'all'); // all, mine, approved, pending, rejected
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
    const unsubscribeTreeCreated = eventEmitter.on(EVENTS.TREE_CREATED, (newTree) => {
      console.log('📨 [ExplorerScreen] Evento TREE_CREATED recibido:', newTree);
      console.log('🔄 [ExplorerScreen] Actualizando lista de árboles...');
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
      console.log('🌳 [ExplorerScreen] Cargando registros de biodiversidad desde MySQL remoto...');
      console.log('👤 [ExplorerScreen] User ID:', user?.id);
      
      // Cargar árboles y animales en paralelo
      const treeService = new SimpleTreeService();
      const animalService = new SimpleAnimalService();
      
      const [allTrees, allAnimals] = await Promise.all([
        treeService.getAllTrees(),
        animalService.getAllAnimals()
      ]);
      
      console.log('🌳 [ExplorerScreen] Árboles obtenidos:', allTrees.length);
      console.log('🦋 [ExplorerScreen] Animales obtenidos:', allAnimals.length);
      
      // Combinar y agregar tipo a cada registro
      const allRecords = [
        ...allTrees.map(tree => ({ ...tree, type: 'flora' })),
        ...allAnimals.map(animal => ({ ...animal, type: 'fauna' }))
      ];

      // Deduplicar registros por ID y tipo para evitar duplicados
      const uniqueRecords = allRecords.reduce((acc, current) => {
        const key = `${current.type}-${current.id}`;
        if (!acc.find(item => `${item.type}-${item.id}` === key)) {
          acc.push(current);
        }
        return acc;
      }, []);

      // Ordenar por fecha de creación (más recientes primero)
      uniqueRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log('📊 [ExplorerScreen] Total registros combinados:', allRecords.length);
      console.log('🔄 [ExplorerScreen] Registros únicos después de deduplicar:', uniqueRecords.length);
      
      // Debug: mostrar algunos registros con sus estados
      uniqueRecords.slice(0, 5).forEach((record, index) => {
        console.log(`📝 [ExplorerScreen] Record ${index + 1}:`, {
          id: record.id,
          type: record.type,
          user_id: record.user_id,
          status: record.status,
          approval_status: record.approval_status,
          normalizedStatus: record.status || record.approval_status || 'pending'
        });
      });
      
      setRecords(uniqueRecords);
    } catch (error) {
      console.log('❌ [ExplorerScreen] Error loading records:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros de biodiversidad');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrees();
    setRefreshing(false);
  };

  // Función helper para determinar si un registro es mío (reutilizable)
  const isMyRecord = (record) => {
    const userId = parseInt(user?.id);
    const recordUserId = parseInt(record.user_id);
    return userId && recordUserId === userId;
  };
  
  // Función helper para obtener el estado normalizado (árboles usan approval_status, animales usan status)
  const getRecordStatus = (record) => {
    return record.status || record.approval_status || 'pending';
  };

  const filteredTrees = useMemo(() => {
    console.log(`🔍 [ExplorerScreen] Filtrando por: ${filter}`);
    console.log(`📊 [ExplorerScreen] Total registros antes de filtrar: ${records.length}`);
    console.log(`👤 [ExplorerScreen] User ID: ${user?.id}`);
    
    // Crear una copia limpia de los registros para evitar mutaciones
    const cleanRecords = [...records];
    let filtered = [];
    
    switch (filter) {
      case 'all':
        // Todos = Registros aprobados de todos los usuarios del sistema
        console.log(`🔍 [ExplorerScreen] Filtrando TODOS los aprobados`);
        
        filtered = cleanRecords.filter(record => {
          const status = getRecordStatus(record);
          const isApproved = status === 'approved';
          
          if (!isApproved) {
            console.log(`📝 [ExplorerScreen] Record ${record.id} NO aprobado: status=${status}, approval_status=${record.approval_status}, raw_status=${record.status}`);
          }
          
          return isApproved;
        });
        
        console.log(`🎯 [ExplorerScreen] Registros aprobados encontrados: ${filtered.length}`);
        break;
        
      case 'mine':
        // Míos = Todos los registros de ese usuario (aprobados, pendientes, rechazados)
        filtered = cleanRecords.filter(record => isMyRecord(record));
        break;
        
      case 'approved':
        // Aprobados = Solo registros aprobados de ese usuario
        filtered = cleanRecords.filter(record => isMyRecord(record) && getRecordStatus(record) === 'approved');
        break;
        
      case 'pending':
        // Pendientes = Registros pendientes de ese usuario
        console.log(`🔍 [ExplorerScreen] Filtrando PENDIENTES para usuario: ${user?.id}`);
        
        filtered = cleanRecords.filter(record => {
          const isMine = isMyRecord(record);
          const status = getRecordStatus(record);
          const isPending = status === 'pending';
          
          // Log detallado para cada registro
          console.log(`📝 [ExplorerScreen] Record ${record.id} (${record.type}):`, {
            user_id: record.user_id,
            isMine,
            status,
            approval_status: record.approval_status,
            raw_status: record.status,
            isPending,
            shouldInclude: isMine && isPending
          });
          
          return isMine && isPending;
        });
        
        console.log(`🎯 [ExplorerScreen] Registros pendientes encontrados: ${filtered.length}`);
        break;
        
      case 'rejected':
        // Rechazados = Registros rechazados de ese usuario
        filtered = cleanRecords.filter(record => isMyRecord(record) && getRecordStatus(record) === 'rejected');
        break;
        
      default:
        // Por defecto, mostrar todos los aprobados
        filtered = cleanRecords.filter(record => getRecordStatus(record) === 'approved');
        break;
    }
    
    console.log(`✅ [ExplorerScreen] Registros filtrados (${filter}): ${filtered.length}`);
    
    // Debug: mostrar los primeros registros filtrados con detalles completos
    if (filtered.length > 0) {
      console.log(`🔍 [ExplorerScreen] Primeros registros del filtro "${filter}":`);
      filtered.slice(0, 3).forEach((record, index) => {
        console.log(`📝 [ExplorerScreen] #${index + 1}:`, {
          id: record.id,
          type: record.type,
          name: record.common_name,
          user_id: record.user_id,
          status: record.status,
          approval_status: record.approval_status,
          normalizedStatus: getRecordStatus(record),
          isMine: isMyRecord(record)
        });
      });
    }
    
    return filtered;
  }, [records, filter, user?.id]);

  const getStatusColor = (record) => {
    const status = getRecordStatus(record);
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (record) => {
    const status = getRecordStatus(record);
    switch (status) {
      case 'approved': return '✅ Aprobado';
      case 'pending': return '⏳ Pendiente';
      case 'rejected': return '❌ Rechazado';
      default: return '❓ Desconocido';
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
      `${tree.scientific_name || 'Sin nombre científico'}

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
    
    // Debug: Log de imagen
    if (tree.image_url) {
      console.log('🖼️ [ExplorerScreen] Imagen para', tree.common_name, ':', tree.image_url?.substring(0, 50) + '...');
    }
    
    return (
      <TouchableOpacity
        style={[styles.treeCard, isOwn && styles.ownTreeCard]}
        onPress={() => handleTreePress(tree)}
      >
        <View style={styles.treeCardContent}>
          {/* Imagen del registro */}
          <View style={styles.treeImageContainer}>
            <SafeImage
              source={{ 
                uri: tree.image_url && !tree.image_url.startsWith('blob:') 
                  ? tree.image_url 
                  : 'https://picsum.photos/300/200?random=default' 
              }}
              style={styles.treeImage}
              resizeMode="cover"
              onError={() => {
                console.log('📷 [ExplorerScreen] Imagen no disponible para:', tree.common_name);
              }}
            />
            {/* Icono indicador de tipo */}
            <View style={[styles.typeIndicator, { backgroundColor: tree.type === 'fauna' ? '#FF6B6B' : '#228B22' }]}>
              <Text style={styles.typeIcon}>
                {tree.type === 'fauna' ? '🦋' : '🌳'}
              </Text>
            </View>
          </View>
          
          {/* Contenido del árbol */}
          <View style={styles.treeContent}>
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
                  {tree.location_description || tree.habitat || 'Ubicación no especificada'}
                </Text>
              </View>
              
              {tree.type === 'fauna' && tree.animal_class && (
                <View style={styles.detailRow}>
                  <Ionicons name="paw-outline" size={16} color="#6c757d" />
                  <Text style={styles.detailText}>
                    {tree.animal_class}
                  </Text>
                </View>
              )}
              
              {tree.type === 'flora' && (tree.height_meters || tree.diameter_cm) && (
                <View style={styles.detailRow}>
                  <Ionicons name="resize-outline" size={16} color="#6c757d" />
                  <Text style={styles.detailText}>
                    {tree.height_meters ? `${tree.height_meters}m` : ''} {tree.diameter_cm ? `⌀${tree.diameter_cm}cm` : ''}
                  </Text>
                </View>
              )}
              
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ filterKey, title, count, iconName, iconColor }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterKey && styles.activeFilter]}
      onPress={() => setFilter(filterKey)}
    >
      <View style={styles.filterButtonContent}>
        <Ionicons 
          name={iconName} 
          size={20} 
          color={filter === filterKey ? '#fff' : (iconColor || '#6c757d')} 
        />
        <Text style={[styles.filterText, filter === filterKey && styles.activeFilterText]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );


  // Contadores actualizados para registros híbridos (árboles + animales)
  const allCount = records.filter(record => getRecordStatus(record) === 'approved').length;
  const myRecordsCount = records.filter(record => isMyRecord(record)).length;
  const approvedCount = records.filter(record => isMyRecord(record) && getRecordStatus(record) === 'approved').length;
  const pendingCount = records.filter(record => isMyRecord(record) && getRecordStatus(record) === 'pending').length;
  const rejectedCount = records.filter(record => isMyRecord(record) && getRecordStatus(record) === 'rejected').length;

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorador de Biodiversidad</Text>
        <Text style={styles.headerSubtitle}>{records.length} registros encontrados</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <FilterButton 
          filterKey="all" 
          title="Todos" 
          count={allCount} 
          iconName="globe-outline" 
          iconColor="#17a2b8" 
        />
        <FilterButton 
          filterKey="mine" 
          title="Míos" 
          count={myRecordsCount} 
          iconName="person-outline" 
          iconColor="#6f42c1" 
        />
        <FilterButton 
          filterKey="approved" 
          title="Aprobados" 
          count={approvedCount} 
          iconName="checkmark-circle-outline" 
          iconColor="#28a745" 
        />
        <FilterButton 
          filterKey="pending" 
          title="Pendientes" 
          count={pendingCount} 
          iconName="time-outline" 
          iconColor="#ffc107" 
        />
        <FilterButton 
          filterKey="rejected" 
          title="Rechazados" 
          count={rejectedCount} 
          iconName="close-circle-outline" 
          iconColor="#dc3545" 
        />
      </View>

      {/* Lista de árboles */}
      <FlatList
        data={filteredTrees}
        renderItem={renderTreeItem}
        keyExtractor={(item) => `${item.type || 'unknown'}-${item.id || item.databaseId || Math.random()}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="earth-outline" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>No hay registros</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'mine' 
                ? 'Aún no has registrado ningún elemento de biodiversidad'
                : 'No se encontraron registros con este filtro'
              }
            </Text>
            {filter === 'mine' && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={toggleFabMenu}
              >
                <Text style={styles.addButtonText}>Hacer Primer Registro</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

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
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#2d5016',
  },
  filterButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '700',
    marginTop: 4,
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
  treeCardContent: {
    flexDirection: 'row',
    flex: 1,
  },
  treeImageContainer: {
    marginRight: 12,
  },
  treeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  treeContent: {
    flex: 1,
  },
  typeIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  typeIcon: {
    fontSize: 12,
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

export default ExplorerScreen;
