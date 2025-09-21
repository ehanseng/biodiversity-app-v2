import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeImage from '../components/SafeImage';
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../contexts/SimpleAuthContext';
import SimpleTreeService from '../services/SimpleTreeService';
import usePageTitle from '../hooks/usePageTitle';

const TreeExplorerScreen = ({ navigation }) => {
  const { user } = useAuth();
  usePageTitle('Plantas'); // Actualizar título de la página
  
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTrees();
  }, []);

  const loadTrees = async () => {
    try {
      setLoading(true);
      const treeService = new SimpleTreeService();
      const allTrees = await treeService.getAllTrees();
      
      // Debug: Ver estructura de los datos
      if (allTrees.length > 0) {
        console.log('🌳 Estructura del primer árbol:', allTrees[0]);
      }
      
      allTrees.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTrees(allTrees);
    } catch (error) {
      console.log('❌ Error loading trees:', error);
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

  const isMyTree = (tree) => {
    const userId = parseInt(user?.id);
    const treeUserId = parseInt(tree.user_id);
    return userId && treeUserId === userId;
  };

  const getFilteredTrees = () => {
    switch (filter) {
      case 'all':
        // Mostrar SOLO los aprobados (propios y de la comunidad)
        return trees.filter(tree => {
          const status = tree.status || tree.approval_status;
          return status === 'approved';
        });
      case 'mine':
        return trees.filter(tree => isMyTree(tree));
      case 'approved':
        return trees.filter(tree => isMyTree(tree) && (tree.status === 'approved' || tree.approval_status === 'approved'));
      case 'pending':
        return trees.filter(tree => isMyTree(tree) && (tree.status === 'pending' || tree.approval_status === 'pending'));
      case 'rejected':
        return trees.filter(tree => isMyTree(tree) && (tree.status === 'rejected' || tree.approval_status === 'rejected'));
      default:
        // Por defecto mostrar solo aprobados
        return trees.filter(tree => {
          const status = tree.status || tree.approval_status;
          return status === 'approved';
        });
    }
  };

  const getStatusColor = (tree) => {
    const status = tree.status || tree.approval_status;
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (tree) => {
    const status = tree.status || tree.approval_status;
    switch (status) {
      case 'approved': return '✅ Aprobado';
      case 'pending': return '⏳ Pendiente';
      case 'rejected': return '❌ Rechazado';
      default: return '❓ Desconocido';
    }
  };

  const renderTreeItem = ({ item: tree }) => (
    <TouchableOpacity style={styles.treeCard}>
      <View style={styles.treeHeader}>
        <View style={styles.treeInfo}>
          <Text style={styles.treeName}>{tree.common_name}</Text>
          <Text style={styles.scientificName}>{tree.scientific_name}</Text>
          <Text style={styles.treeFamily}>Familia: {tree.family}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tree) }]}>
          <Text style={styles.statusText}>{getStatusText(tree)}</Text>
        </View>
      </View>

      {tree.image_url && (
        <SafeImage 
          source={{ uri: tree.image_url }} 
          style={styles.treeImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.treeFooter}>
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText}>
            {parseFloat(tree.latitude || 0).toFixed(4)}, {parseFloat(tree.longitude || 0).toFixed(4)}
          </Text>
        </View>
        
        <Text style={styles.dateText}>
          {new Date(tree.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ filterKey, title, count, iconName, iconColor }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterKey && styles.activeFilterButton]}
      onPress={() => setFilter(filterKey)}
    >
      <View style={styles.filterContent}>
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

  const filteredTrees = getFilteredTrees();

  // Contadores
  const allCount = trees.filter(tree => {
    const status = tree.status || tree.approval_status;
    return status === 'approved'; // Solo contar aprobados de toda la comunidad
  }).length;
  const myTreesCount = trees.filter(tree => isMyTree(tree)).length;
  const approvedCount = trees.filter(tree => isMyTree(tree) && (tree.status === 'approved' || tree.approval_status === 'approved')).length;
  const pendingCount = trees.filter(tree => isMyTree(tree) && (tree.status === 'pending' || tree.approval_status === 'pending')).length;
  const rejectedCount = trees.filter(tree => isMyTree(tree) && (tree.status === 'rejected' || tree.approval_status === 'rejected')).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando árboles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Plantas" showBackButton={false} />
      <View style={styles.filtersContainer}>
        <FilterButton filterKey="all" title="Todos" count={allCount} iconName="earth-outline" iconColor="#007bff" />
        <FilterButton filterKey="mine" title="Míos" count={myTreesCount} iconName="person-outline" iconColor="#6f42c1" />
        <FilterButton filterKey="approved" title="Aprobados" count={approvedCount} iconName="checkmark-circle-outline" iconColor="#28a745" />
        <FilterButton filterKey="pending" title="Pendientes" count={pendingCount} iconName="time-outline" iconColor="#ffc107" />
        <FilterButton filterKey="rejected" title="Rechazados" count={rejectedCount} iconName="close-circle-outline" iconColor="#dc3545" />
      </View>

      {filteredTrees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No hay árboles</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'mine' ? 'Aún no has registrado ningún árbol' : 'No se encontraron árboles con este filtro'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrees}
          renderItem={renderTreeItem}
          keyExtractor={(item) => `tree-${item.id}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddTree')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filtersContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  filterButton: { flex: 1, marginHorizontal: 5, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 20, backgroundColor: '#f8f9fa', alignItems: 'center' },
  activeFilterButton: { backgroundColor: '#28a745' },
  filterContent: { alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6c757d', marginTop: 2 },
  activeFilterText: { color: '#fff' },
  listContainer: { padding: 15 },
  treeCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  treeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 15 },
  treeInfo: { flex: 1 },
  treeName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scientificName: { fontSize: 14, fontStyle: 'italic', color: '#666', marginTop: 2 },
  treeFamily: { fontSize: 12, color: '#888', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  treeImage: { width: '100%', height: 200 },
  treeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  locationInfo: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#666', marginLeft: 4 },
  dateText: { fontSize: 12, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }
});

export default TreeExplorerScreen;
