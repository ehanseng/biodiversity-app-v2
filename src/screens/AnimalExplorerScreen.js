import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeImage from '../components/SafeImage';
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../contexts/SimpleAuthContext';
import SimpleAnimalService from '../services/SimpleAnimalService';
import usePageTitle from '../hooks/usePageTitle';

const AnimalExplorerScreen = ({ navigation }) => {
  const { user } = useAuth();
  usePageTitle('Animales'); // Actualizar título de la página
  
  const [animals, setAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAnimals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [animals, filter, searchQuery]);

  const loadAnimals = async () => {
    try {
      setLoading(true);
      const animalService = new SimpleAnimalService();
      const allAnimals = await animalService.getAllAnimals();
      
      allAnimals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAnimals(allAnimals);
    } catch (error) {
      console.log('❌ Error loading animals:', error);
      Alert.alert('Error', 'No se pudieron cargar los animales');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnimals();
    setRefreshing(false);
  };

  const isMyAnimal = (animal) => {
    const userId = parseInt(user?.id);
    const animalUserId = parseInt(animal.user_id);
    return userId && animalUserId === userId;
  };

  const applyFilters = () => {
    let filtered = animals;

    // Aplicar filtro por estado
    switch (filter) {
      case 'all':
        // Mostrar SOLO los aprobados (propios y de la comunidad)
        filtered = filtered.filter(animal => {
          const status = animal.status || animal.approval_status;
          return status === 'approved';
        });
        break;
      case 'mine':
        filtered = filtered.filter(animal => isMyAnimal(animal));
        break;
      case 'approved':
        filtered = filtered.filter(animal => isMyAnimal(animal) && (animal.status === 'approved' || animal.approval_status === 'approved'));
        break;
      case 'pending':
        filtered = filtered.filter(animal => isMyAnimal(animal) && (animal.status === 'pending' || animal.approval_status === 'pending'));
        break;
      case 'rejected':
        filtered = filtered.filter(animal => isMyAnimal(animal) && (animal.status === 'rejected' || animal.approval_status === 'rejected'));
        break;
      default:
        // Por defecto mostrar solo aprobados
        filtered = filtered.filter(animal => {
          const status = animal.status || animal.approval_status;
          return status === 'approved';
        });
        break;
    }

    // Aplicar filtro de búsqueda por texto
    if (searchQuery.trim()) {
      filtered = filtered.filter(animal =>
        animal.common_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.scientific_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.location_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.animal_class?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAnimals(filtered);
  };

  const getStatusColor = (animal) => {
    const status = animal.status || animal.approval_status;
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (animal) => {
    const status = animal.status || animal.approval_status;
    switch (status) {
      case 'approved': return '✅ Aprobado';
      case 'pending': return '⏳ Pendiente';
      case 'rejected': return '❌ Rechazado';
      default: return '❓ Desconocido';
    }
  };

  const renderAnimalItem = ({ item: animal }) => {
    return (
      <TouchableOpacity style={styles.animalCard}>
        <View style={styles.animalMainContent}>
          {/* Foto lateral cuadrada */}
          {animal.image_url && (
            <SafeImage 
              source={{ uri: animal.image_url }} 
              style={styles.animalImageSide}
              resizeMode="cover"
            />
          )}
          
          {/* Contenido principal */}
          <View style={styles.animalContent}>
            <View style={styles.animalHeader}>
              <View style={styles.animalInfo}>
                <Text style={styles.animalName}>{animal.common_name}</Text>
                <Text style={styles.scientificName}>{animal.scientific_name}</Text>
                <Text style={styles.animalClass}>Clase: {animal.animal_class}</Text>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(animal) }]}>
                <Text style={styles.statusText}>{getStatusText(animal)}</Text>
              </View>
            </View>

            <View style={styles.animalFooter}>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.locationText}>
                  {parseFloat(animal.latitude || 0).toFixed(4)}, {parseFloat(animal.longitude || 0).toFixed(4)}
                </Text>
              </View>
              
              <View style={styles.footerRight}>
                {filter === 'all' && (animal.user_name || animal.full_name || animal.user_id) && (
                  <View style={styles.explorerInfo}>
                    <Ionicons name="person-outline" size={14} color="#CD853F" />
                    <Text style={styles.explorerText}>
                      {animal.user_name || animal.full_name || `Usuario ${animal.user_id}`}
                    </Text>
                  </View>
                )}
                <Text style={styles.dateText}>
                  {new Date(animal.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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


  // Contadores
  const allCount = animals.filter(animal => {
    const status = animal.status || animal.approval_status;
    return status === 'approved'; // Solo contar aprobados de toda la comunidad
  }).length;
  const myAnimalsCount = animals.filter(animal => isMyAnimal(animal)).length;
  const approvedCount = animals.filter(animal => isMyAnimal(animal) && (animal.status === 'approved' || animal.approval_status === 'approved')).length;
  const pendingCount = animals.filter(animal => isMyAnimal(animal) && (animal.status === 'pending' || animal.approval_status === 'pending')).length;
  const rejectedCount = animals.filter(animal => isMyAnimal(animal) && (animal.status === 'rejected' || animal.approval_status === 'rejected')).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando animales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Animales" showBackButton={false} />
      <View style={styles.filtersContainer}>
        <FilterButton filterKey="all" title="Todos" count={allCount} iconName="earth-outline" iconColor="#007bff" />
        <FilterButton filterKey="mine" title="Míos" count={myAnimalsCount} iconName="person-outline" iconColor="#6f42c1" />
        <FilterButton filterKey="approved" title="Aprobados" count={approvedCount} iconName="checkmark-circle-outline" iconColor="#28a745" />
        <FilterButton filterKey="pending" title="Pendientes" count={pendingCount} iconName="time-outline" iconColor="#ffc107" />
        <FilterButton filterKey="rejected" title="Rechazados" count={rejectedCount} iconName="close-circle-outline" iconColor="#dc3545" />
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar animales por nombre común, científico, clase, descripción..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {filteredAnimals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No hay animales</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'No se encontraron animales que coincidan con tu búsqueda' : 
             filter === 'mine' ? 'Aún no has registrado ningún animal' : 'No se encontraron animales con este filtro'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAnimals}
          renderItem={renderAnimalItem}
          keyExtractor={(item) => `animal-${item.id}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddAnimal')}
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
  activeFilterButton: { backgroundColor: '#CD853F' },
  filterContent: { alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6c757d', marginTop: 2 },
  activeFilterText: { color: '#fff' },
  listContainer: { padding: 15 },
  animalCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, padding: 15 },
  animalMainContent: { flexDirection: 'row', minHeight: 80 },
  animalImageSide: { width: 80, alignSelf: 'stretch', borderRadius: 8, marginRight: 12 },
  animalContent: { flex: 1, justifyContent: 'center' },
  animalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  animalInfo: { flex: 1 },
  animalName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scientificName: { fontSize: 14, fontStyle: 'italic', color: '#666', marginTop: 2 },
  animalClass: { fontSize: 12, color: '#888', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  animalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  locationInfo: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#666', marginLeft: 4 },
  footerRight: { alignItems: 'flex-end' },
  explorerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  explorerText: { fontSize: 11, color: '#CD853F', marginLeft: 3, fontWeight: '500' },
  dateText: { fontSize: 12, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#CD853F', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }
});

export default AnimalExplorerScreen;
