import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import SafeImage from '../components/SafeImage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/SimpleAuthContext';
import SimpleTreeService from '../services/SimpleTreeService';
import SimpleAnimalService from '../services/SimpleAnimalService';
import RankingService from '../services/RankingService';
import CustomHeader from '../components/CustomHeader';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';

const ScientistApprovalScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]); // Guardar todos los registros para filtrar localmente
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [processingRecords, setProcessingRecords] = useState(new Set());

  useEffect(() => {
    if (profile?.role === 'scientist' || profile?.role === 'admin') {
      loadTrees();
    }
  }, [profile]);

  useEffect(() => {
    // Filtrar localmente cuando cambia el filtro
    filterRecords();
  }, [filter, allRecords]);

  const loadTrees = async () => {
    try {
      setLoading(true);
      console.log('🧪 [ScientistApproval] Cargando registros para revisión...');
      
      // Cargar árboles y animales en paralelo
      const treeService = new SimpleTreeService();
      const animalService = new SimpleAnimalService();
      
      const [treesData, animalsData] = await Promise.all([
        treeService.getAllTrees(),
        animalService.getAllAnimals()
      ]);
      
      console.log('🌳 [ScientistApproval] Árboles obtenidos:', treesData.length);
      console.log('🦋 [ScientistApproval] Animales obtenidos:', animalsData.length);
      
      // Combinar y marcar tipo
      const combinedRecords = [
        ...treesData.map(tree => ({ ...tree, type: 'flora', icon: '🌳' })),
        ...animalsData.map(animal => ({ ...animal, type: 'fauna', icon: '🦋' }))
      ];
      
      // Ordenar por fecha de creación (más recientes primero)
      combinedRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      console.log('📊 [ScientistApproval] Total registros combinados:', combinedRecords.length);
      setAllRecords(combinedRecords);
      
    } catch (error) {
      console.error('❌ [ScientistApproval] Error cargando registros:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros para revisión');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...allRecords];
    
    console.log('🔍 [ScientistApproval] Filtrando registros:', {
      total: allRecords.length,
      filter: filter,
      pending: allRecords.filter(r => (r.status === 'pending' || r.approval_status === 'pending')).length,
      approved: allRecords.filter(r => (r.status === 'approved' || r.approval_status === 'approved')).length,
      rejected: allRecords.filter(r => (r.status === 'rejected' || r.approval_status === 'rejected')).length
    });
    
    if (filter === 'pending') {
      filtered = filtered.filter(record => record.status === 'pending' || record.approval_status === 'pending');
    } else if (filter === 'approved') {
      filtered = filtered.filter(record => record.status === 'approved' || record.approval_status === 'approved');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(record => record.status === 'rejected' || record.approval_status === 'rejected');
    }
    // Si es 'all', no filtramos
    
    console.log('✅ [ScientistApproval] Registros filtrados:', filtered.length);
    setRecords(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrees();
    setRefreshing(false);
  };

  const approveRecord = async (record) => {
    try {
      console.log('✅ [ScientistApproval] Aprobando registro:', record.common_name, record.type);
      
      // Determinar qué endpoint usar según el tipo
      const endpoint = record.type === 'flora' ? 'simple-trees-endpoint.php' : 'simple-animals-endpoint.php';
      const response = await fetch(`https://explora.ieeetadeo.org/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: record.id,
          status: 'approved'
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Actualizar el registro localmente
      const updatedAllRecords = allRecords.map(r => 
        r.id === record.id && r.type === record.type
          ? { ...r, status: 'approved', approval_status: 'approved' }
          : r
      );
      setAllRecords(updatedAllRecords);

      // Actualizar puntos del usuario automáticamente
      if (record.user_id) {
        try {
          await RankingService.updateUserPoints(record.user_id);
          console.log('🏆 [ScientistApproval] Puntos actualizados para usuario:', record.user_id);
        } catch (pointsError) {
          console.warn('⚠️ [ScientistApproval] Error actualizando puntos:', pointsError);
        }
      }

      Alert.alert(
        '✅ Registro Aprobado',
        `"${record.common_name}" ha sido aprobado exitosamente`
      );
      
    } catch (error) {
      console.error('❌ [ScientistApproval] Error aprobando registro:', error);
      Alert.alert('Error', 'No se pudo aprobar el registro');
    }
  };

  const rejectRecord = async (record) => {
    console.log('🔴 [ScientistApproval] Iniciando rechazo de registro:', record);
    
    const confirmReject = Platform.OS === 'web' 
      ? window.confirm(`¿Estás seguro de que quieres rechazar "${record.common_name}"?`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Rechazar Registro',
            `¿Estás seguro de que quieres rechazar "${record.common_name}"?`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Rechazar', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });

    console.log('🔴 [ScientistApproval] Confirmación de rechazo:', confirmReject);
    if (!confirmReject) return;

    // Marcar como procesando
    const recordKey = `${record.type}-${record.id}`;
    setProcessingRecords(prev => new Set([...prev, recordKey]));

    try {
      console.log('❌ [ScientistApproval] Rechazando registro:', record.common_name, record.type);
      
      // Determinar qué endpoint usar según el tipo
      const endpoint = record.type === 'flora' ? 'simple-trees-endpoint.php' : 'simple-animals-endpoint.php';
      const response = await fetch(`https://explora.ieeetadeo.org/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: record.id,
          status: 'rejected'
        })
      });

      console.log('🔴 [ScientistApproval] Respuesta del servidor:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 [ScientistApproval] Error del servidor:', errorText);
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🔴 [ScientistApproval] Resultado del rechazo:', result);

      // Actualizar el registro localmente
      const updatedAllRecords = allRecords.map(r => 
        r.id === record.id && r.type === record.type
          ? { ...r, status: 'rejected', approval_status: 'rejected' }
          : r
      );
      setAllRecords(updatedAllRecords);
      console.log('🔴 [ScientistApproval] Registro actualizado localmente');

      Alert.alert(
        '❌ Registro Rechazado',
        `"${record.common_name}" ha sido rechazado exitosamente`
      );
      
    } catch (error) {
      console.error('❌ [ScientistApproval] Error rechazando registro:', error);
      Alert.alert('Error', 'No se pudo rechazar el registro');
    } finally {
      // Quitar del estado de procesando
      setProcessingRecords(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordKey);
        return newSet;
      });
    }
  };

  const changeToPending = async (record) => {
    const currentStatus = record.status || record.approval_status;
    const statusText = currentStatus === 'approved' ? 'aprobado' : 'rechazado';
    
    const confirmChange = Platform.OS === 'web' 
      ? window.confirm(`¿Quieres cambiar "${record.common_name}" de ${statusText} a pendiente?`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Cambiar a Pendiente',
            `¿Quieres cambiar "${record.common_name}" de ${statusText} a pendiente?`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Cambiar a Pendiente', onPress: () => resolve(true) }
            ]
          );
        });

    if (!confirmChange) return;

    try {
      console.log('⏳ [ScientistApproval] Cambiando a pendiente:', record.common_name, record.type);
      
      // Determinar qué endpoint usar según el tipo
      const endpoint = record.type === 'flora' ? 'simple-trees-endpoint.php' : 'simple-animals-endpoint.php';
      const response = await fetch(`https://explora.ieeetadeo.org/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: record.id,
          status: 'pending'
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Actualizar el registro localmente
      const updatedAllRecords = allRecords.map(r => 
        r.id === record.id && r.type === record.type
          ? { ...r, status: 'pending', approval_status: 'pending' }
          : r
      );
      setAllRecords(updatedAllRecords);

      Alert.alert(
        '⏳ Estado Cambiado',
        `"${record.common_name}" ahora está pendiente de revisión`
      );
      
    } catch (error) {
      console.error('❌ [ScientistApproval] Error cambiando estado:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const renderRecordItem = ({ item: record }) => {
    const currentStatus = record.status || record.approval_status || 'pending';
    
    return (
      <View style={styles.recordCard}>
        <View style={styles.recordMainContent}>
          {/* Foto lateral cuadrada */}
          {record.image_url && (
            <SafeImage 
              source={{ uri: record.image_url }} 
              style={styles.recordImageSide}
              resizeMode="cover"
            />
          )}
          
          {/* Contenido principal */}
          <View style={styles.recordContent}>
            <View style={styles.recordHeader}>
              <View style={styles.recordInfo}>
                <View style={styles.recordTitle}>
                  <Text style={styles.recordIcon}>{record.icon}</Text>
                  <View style={styles.recordNames}>
                    <Text style={styles.recordName}>{record.common_name}</Text>
                    <Text style={styles.scientificName}>{record.scientific_name}</Text>
                  </View>
                </View>
                <Text style={styles.submitter}>
                  {record.user_name || 'Usuario desconocido'}
                </Text>
              </View>
              
              <View style={[
                styles.statusBadge,
                currentStatus === 'approved' ? styles.approvedBadge : 
                currentStatus === 'rejected' ? styles.rejectedBadge : styles.pendingBadge
              ]}>
                <Text style={styles.statusText}>
                  {currentStatus === 'approved' ? '✅ Aprobado' :
                   currentStatus === 'rejected' ? '❌ Rechazado' : '⏳ Pendiente'}
                </Text>
              </View>
            </View>

            {record.description && (
              <Text style={styles.description} numberOfLines={2}>
                {record.description}
              </Text>
            )}

            <View style={styles.recordDetails}>
              {record.type === 'flora' && (
                <>
                  {record.height_meters && (
                    <Text style={styles.detail}>📏 {record.height_meters}m</Text>
                  )}
                  {record.diameter_cm && (
                    <Text style={styles.detail}>⭕ {record.diameter_cm}cm</Text>
                  )}
                  {record.family && (
                    <Text style={styles.detail}>🌿 {record.family}</Text>
                  )}
                </>
              )}
              {record.type === 'fauna' && (
                <>
                  {record.animal_class && (
                    <Text style={styles.detail}>🏷️ {record.animal_class}</Text>
                  )}
                  {record.habitat && (
                    <Text style={styles.detail}>🏠 {record.habitat}</Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {currentStatus === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => approveRecord(record)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Aprobar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => rejectRecord(record)}
              >
                <Ionicons name="close-circle" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </TouchableOpacity>
            </>
          )}

          {(currentStatus === 'approved' || currentStatus === 'rejected') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.pendingButton]}
              onPress={() => changeToPending(record)}
            >
              <Ionicons name="time" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Marcar Pendiente</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.timestamp}>
          {new Date(record.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };

  const FilterButton = ({ filterKey, title, count, iconName, iconColor }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterKey && styles.activeFilterButton
      ]}
      onPress={() => setFilter(filterKey)}
    >
      <View style={styles.filterContent}>
        <Ionicons 
          name={iconName} 
          size={20} 
          color={filter === filterKey ? '#fff' : (iconColor || '#6c757d')} 
        />
        <Text style={[
          styles.filterButtonText,
          filter === filterKey && styles.activeFilterText
        ]}>
          {count}
        </Text>
      </View>
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

  const pendingCount = allRecords.filter(r => (r.status === 'pending' || r.approval_status === 'pending')).length;
  const approvedCount = allRecords.filter(r => (r.status === 'approved' || r.approval_status === 'approved')).length;
  const rejectedCount = allRecords.filter(r => (r.status === 'rejected' || r.approval_status === 'rejected')).length;
  const totalCount = allRecords.length;

  return (
    <View style={styles.container}>
      <CustomHeader title="🧪 Revisión Científica" showBackButton={false} />

      <View style={styles.filtersContainer}>
        <FilterButton filterKey="pending" title="Pendientes" count={pendingCount} iconName="time-outline" iconColor="#ffc107" />
        <FilterButton filterKey="approved" title="Aprobados" count={approvedCount} iconName="checkmark-circle-outline" iconColor="#28a745" />
        <FilterButton filterKey="rejected" title="Rechazados" count={rejectedCount} iconName="close-circle-outline" iconColor="#dc3545" />
        <FilterButton filterKey="all" title="Todos" count={totalCount} iconName="flask-outline" iconColor="#007bff" />
      </View>

      <View style={styles.listWrapper}>
        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay registros</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'pending' ? 'No hay registros pendientes de revisión' :
               filter === 'approved' ? 'No hay registros aprobados' :
               filter === 'rejected' ? 'No hay registros rechazados' :
               'No hay registros para revisar'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={records}
            renderItem={renderRecordItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            style={styles.flatListStyle}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={true}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
    paddingHorizontal: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#2d5016',
  },
  filterContent: {
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 2,
  },
  activeFilterText: {
    color: '#ffffff',
  },
  listWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flatListStyle: {
    flex: 1,
  },
  listContainer: { 
    padding: 15,
    paddingBottom: 100, // Espacio extra para scroll completo
  },
  recordCard: {
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
  recordMainContent: {
    flexDirection: 'row',
    marginBottom: 10,
    minHeight: 80, // Altura mínima para la tarjeta
  },
  recordImageSide: {
    width: 80,
    alignSelf: 'stretch', // Se ajusta al alto del contenedor
    borderRadius: 8,
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
    justifyContent: 'center', // Centra el contenido verticalmente
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  recordNames: {
    flex: 1,
  },
  recordName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 2,
  },
  recordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
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
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  approvedBadge: {
    backgroundColor: '#d4edda',
  },
  rejectedBadge: {
    backgroundColor: '#f8d7da',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
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
});

export default ScientistApprovalScreen;
