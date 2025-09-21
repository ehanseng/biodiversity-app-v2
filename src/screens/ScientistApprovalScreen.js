import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import SafeImage from '../components/SafeImage';
import { Ionicons } from '@expo/vector-icons';
// Supabase removido - usando datos mock
import { useAuth } from '../contexts/SimpleAuthContext';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';
import webNotifications from '../utils/WebNotifications';

const ScientistApprovalScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const [trees, setTrees] = useState([]);
  const [allTrees, setAllTrees] = useState([]); // Guardar todos los árboles para filtrar localmente
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  useEffect(() => {
    if (profile?.role === 'scientist' || profile?.role === 'admin') {
      loadTrees();
    }
  }, [profile]);

  useEffect(() => {
    // Filtrar localmente cuando cambia el filtro
    filterTrees();
  }, [filter, allTrees]);

  const loadTrees = async () => {
    try {
      setLoading(true);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos mock de árboles para aprobación
      const mockTrees = [
        {
          id: 1,
          common_name: 'Ceiba',
          scientific_name: 'Ceiba pentandra',
          height_meters: 25,
          diameter_cm: 80,
          status: 'pending',
          user_id: '1',
          created_at: new Date().toISOString(),
          profiles: {
            full_name: 'Explorer Usuario',
            email: 'explorer@vibo.co'
          }
        },
        {
          id: 2,
          common_name: 'Guayacán',
          scientific_name: 'Tabebuia chrysantha',
          height_meters: 15,
          diameter_cm: 45,
          status: 'approved',
          user_id: '1',
          created_at: new Date().toISOString(),
          profiles: {
            full_name: 'Explorer Usuario',
            email: 'explorer@vibo.co'
          }
        }
      ];
      
      setAllTrees(mockTrees);
    } catch (error) {
      console.error('Error loading trees:', error);
      Alert.alert('Error', 'No se pudieron cargar los árboles');
    } finally {
      setLoading(false);
    }
  };

  const filterTrees = () => {
    let filtered = [...allTrees];
    
    console.log(' [ScientistApproval] Filtrando árboles:', {
      total: allTrees.length,
      filter: filter,
      pending: allTrees.filter(t => t.approval_status === 'pending').length,
      approved: allTrees.filter(t => t.approval_status === 'approved').length,
      rejected: allTrees.filter(t => t.approval_status === 'rejected').length
    });
    
    // Debug: mostrar algunos árboles para verificar estructura
    if (allTrees.length > 0) {
      console.log(' [ScientistApproval] Muestra de árboles:', 
        allTrees.slice(0, 3).map(t => ({ id: t.id, name: t.common_name, status: t.approval_status }))
      );
    }
    
    if (filter === 'pending') {
      filtered = filtered.filter(tree => tree.approval_status === 'pending');
    } else if (filter === 'approved') {
      filtered = filtered.filter(tree => tree.approval_status === 'approved');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(tree => tree.approval_status === 'rejected');
    }
    // Si es 'all', no filtramos
    
    console.log(' [ScientistApproval] Árboles filtrados:', filtered.length);
    
    // Debug: mostrar árboles filtrados
    if (filtered.length > 0) {
      console.log(' [ScientistApproval] Muestra filtrada:', 
        filtered.slice(0, 3).map(t => ({ id: t.id, name: t.common_name, status: t.approval_status }))
      );
    }
    
    setTrees(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrees();
    setRefreshing(false);
  };

  const approveTree = async (tree) => {
    try {
      const { error } = await supabase
        .from('trees')
        .update({ 
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', tree.id);

      if (error) throw error;

      // Actualizar el árbol localmente en allTrees
      const updatedAllTrees = allTrees.map(t => 
        t.id === tree.id 
          ? { ...t, approval_status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }
          : t
      );
      setAllTrees(updatedAllTrees);

      // Mostrar notificación
      webNotifications.showSuccess(
        ' Árbol Aprobado',
        `"${tree.common_name}" de ${tree.profiles?.full_name} ha sido aprobado`
      );

      // Emitir evento para actualizar otras pantallas
      eventEmitter.emit(EVENTS.TREE_UPDATED, { tree: { ...tree, approval_status: 'approved' }, action: 'approved' });
      
    } catch (error) {
      console.error('Error approving tree:', error);
      Alert.alert('Error', 'No se pudo aprobar el árbol');
    }
  };

  const rejectTree = async (tree) => {
    console.log(' [ScientistApproval] Iniciando rechazo de árbol:', tree.id, tree.common_name);
    
    // Usar window.confirm en web, Alert.alert en móvil
    const confirmReject = Platform.OS === 'web' 
      ? window.confirm(`¿Estás seguro de que quieres rechazar "${tree.common_name}"?`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Rechazar Árbol',
            `¿Estás seguro de que quieres rechazar "${tree.common_name}"?`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Rechazar', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });

    if (!confirmReject) {
      console.log(' [ScientistApproval] Rechazo cancelado por el usuario');
      return;
    }

    try {
      console.log(' [ScientistApproval] Ejecutando rechazo en BD...');
      
      const { error } = await supabase
        .from('trees')
        .update({ 
          approval_status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', tree.id);

      if (error) {
        console.error(' [ScientistApproval] Error en BD:', error);
        throw error;
      }

      console.log(' [ScientistApproval] Actualización en BD exitosa');

      // Actualizar el árbol localmente en allTrees
      console.log(' [ScientistApproval] Actualizando estado local...');
      console.log(' [ScientistApproval] AllTrees antes:', allTrees.length);
      
      const updatedAllTrees = allTrees.map(t => {
        if (t.id === tree.id) {
          console.log(' [ScientistApproval] Actualizando árbol:', t.id, 'de', t.approval_status, 'a rejected');
          return { ...t, approval_status: 'rejected', approved_by: user.id, approved_at: new Date().toISOString() };
        }
        return t;
      });
      
      console.log(' [ScientistApproval] AllTrees después:', updatedAllTrees.length);
      console.log(' [ScientistApproval] Árbol actualizado encontrado:', 
        updatedAllTrees.find(t => t.id === tree.id)?.approval_status
      );
      
      setAllTrees(updatedAllTrees);

      // Mostrar notificación
      webNotifications.showWarning(
        ' Árbol Rechazado',
        `"${tree.common_name}" de ${tree.profiles?.full_name} ha sido rechazado`
      );

      // Emitir evento para actualizar otras pantallas
      eventEmitter.emit(EVENTS.TREE_UPDATED, { tree: { ...tree, approval_status: 'rejected' }, action: 'rejected' });
      
      console.log(' [ScientistApproval] Rechazo completado exitosamente');
      
    } catch (error) {
      console.error(' [ScientistApproval] Error completo al rechazar:', error);
      Alert.alert('Error', 'No se pudo rechazar el árbol: ' + error.message);
    }
  };

  const changeToPending = async (tree) => {
    // Usar window.confirm en web, Alert.alert en móvil
    const confirmChange = Platform.OS === 'web' 
      ? window.confirm(`¿Quieres cambiar "${tree.common_name}" de ${tree.approval_status === 'approved' ? 'aprobado' : 'rechazado'} a pendiente?`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Cambiar a Pendiente',
            `¿Quieres cambiar "${tree.common_name}" de ${tree.approval_status === 'approved' ? 'aprobado' : 'rechazado'} a pendiente?`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Cambiar a Pendiente', onPress: () => resolve(true) }
            ]
          );
        });

    if (!confirmChange) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trees')
        .update({ 
          approval_status: 'pending',
          approved_by: null,
          approved_at: null
        })
        .eq('id', tree.id);

      if (error) throw error;

      // Actualizar el árbol localmente en allTrees
      const updatedAllTrees = allTrees.map(t => 
        t.id === tree.id 
          ? { ...t, approval_status: 'pending', approved_by: null, approved_at: null }
          : t
      );
      setAllTrees(updatedAllTrees);

      webNotifications.showInfo(
        '⏳ Estado Cambiado',
        `"${tree.common_name}" ahora está pendiente de revisión`
      );

      eventEmitter.emit(EVENTS.TREE_UPDATED, { tree: { ...tree, approval_status: 'pending' }, action: 'pending' });
    } catch (error) {
      console.error('Error changing status:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const renderTreeItem = ({ item: tree }) => (
    <View style={styles.treeCard}>
      <View style={styles.treeHeader}>
        <View style={styles.treeInfo}>
          <Text style={styles.treeName}>{tree.common_name}</Text>
          <Text style={styles.scientificName}>{tree.scientific_name}</Text>
          <Text style={styles.submitter}>
            {tree.profiles?.full_name || 'Usuario desconocido'}
          </Text>
          <Text style={styles.location}>
            {tree.location_description || 'Sin ubicación'}
          </Text>
        </View>
        
        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText,
            tree.approval_status === 'approved' ? styles.approved : 
            tree.approval_status === 'rejected' ? styles.rejected : styles.pending
          ]}>
            {tree.approval_status === 'approved' ? ' Aprobado' :
             tree.approval_status === 'rejected' ? ' Rechazado' : ' Pendiente'}
          </Text>
        </View>
      </View>

      {tree.description && (
        <Text style={styles.description} numberOfLines={2}>
          {tree.description}
        </Text>
      )}

      <View style={styles.treeDetails}>
        {tree.height && (
          <Text style={styles.detail}> {tree.height}m</Text>
        )}
        {tree.diameter && (
          <Text style={styles.detail}> {tree.diameter}cm</Text>
        )}
        {tree.health_status && (
          <Text style={styles.detail}> {tree.health_status}</Text>
        )}
      </View>

      <View style={styles.actionButtons}>
        {tree.approval_status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => approveTree(tree)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Aprobar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => rejectTree(tree)}
            >
              <Ionicons name="close-circle" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </>
        )}

        {tree.approval_status === 'approved' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.pendingButton]}
              onPress={() => changeToPending(tree)}
            >
              <Ionicons name="time" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Marcar Pendiente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => rejectTree(tree)}
            >
              <Ionicons name="close-circle" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </>
        )}

        {tree.approval_status === 'rejected' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => approveTree(tree)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Aprobar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.pendingButton]}
              onPress={() => changeToPending(tree)}
            >
              <Ionicons name="time" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Marcar Pendiente</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.timestamp}>
        {new Date(tree.created_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </View>
  );

  const FilterButton = ({ filterKey, title, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterKey && styles.activeFilter
      ]}
      onPress={() => setFilter(filterKey)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterKey && styles.activeFilterText
      ]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  // Solo permitir acceso a científicos y admins
  if (profile?.role !== 'scientist' && profile?.role !== 'admin') {
    return (
      <View style={styles.noAccessContainer}>
        <Ionicons name="lock-closed" size={64} color="#999" />
        <Text style={styles.noAccessText}>
          Solo científicos y administradores pueden acceder a esta sección
        </Text>
      </View>
    );
  }

  const pendingCount = allTrees.filter(t => t.approval_status === 'pending').length;
  const approvedCount = allTrees.filter(t => t.approval_status === 'approved').length;
  const rejectedCount = allTrees.filter(t => t.approval_status === 'rejected').length;
  const totalCount = allTrees.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}> Revisión Científica</Text>
      </View>

      <View style={styles.filtersContainer}>
        <FilterButton filterKey="pending" title="Pendientes" count={pendingCount} />
        <FilterButton filterKey="approved" title="Aprobados" count={approvedCount} />
        <FilterButton filterKey="rejected" title="Rechazados" count={rejectedCount} />
        <FilterButton filterKey="all" title="Todos" count={totalCount} />
      </View>

      <View style={styles.listWrapper}>
        {/* Debug info */}
        <Text style={styles.debugInfo}>
          Mostrando {trees.length} árboles de {allTrees.length} totales (Filtro: {filter})
        </Text>
        
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={[
            styles.listContainer,
            { minHeight: trees.length * 200 } // Forzar altura mínima
          ]}
          showsVerticalScrollIndicator={true}
          style={[
            styles.flatList,
            Platform.OS === 'web' && {
              height: '100%',
              maxHeight: 'calc(100vh - 200px)', // Altura específica para web
              overflowY: 'scroll'
            }
          ]}
          nestedScrollEnabled={true}
        >
          {trees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={64} color="#999" />
              <Text style={styles.emptyText}>
                {filter === 'pending' ? 'No hay árboles pendientes de revisión' :
                 filter === 'approved' ? 'No hay árboles aprobados' :
                 filter === 'rejected' ? 'No hay árboles rechazados' :
                 'No hay árboles para revisar'}
              </Text>
            </View>
          ) : (
            trees.map((tree, index) => (
              <View key={tree.id} style={styles.treeItemWrapper}>
                <Text style={styles.itemDebug}>Elemento {index + 1} de {trees.length}</Text>
                {renderTreeItem({ item: tree })}
              </View>
            ))
          )}
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#2d5016',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 50, // Espacio extra al final
  },
  treeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  treeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
    color: '#666',
    marginBottom: 4,
  },
  submitter: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approved: {
    color: '#28a745',
  },
  rejected: {
    color: '#dc3545',
  },
  pending: {
    color: '#ffc107',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  treeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  detail: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  pendingButton: {
    backgroundColor: '#ffc107',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
  noAccessContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  noAccessText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  flatList: {
    flex: 1,
  },
  debugInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  treeItemWrapper: {
    marginBottom: 15,
  },
  itemDebug: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  endMarker: {
    height: 20,
    backgroundColor: '#f8f9fa',
  },
  endText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  }
});

export default ScientistApprovalScreen;
