import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserManagementService from '../services/UserManagementService';
import UserEditModal from '../components/UserEditModal';
import { useAuth } from '../contexts/SimpleAuthContext';

const AdminScreen = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stats, setStats] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  const userService = new UserManagementService();

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users, activeFilter]);

  const loadUsers = async () => {
    try {
      console.log('👥 [AdminScreen] Cargando usuarios...');
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
      console.log('✅ [AdminScreen] Usuarios cargados:', usersData.length);
    } catch (error) {
      console.error('❌ [AdminScreen] Error cargando usuarios:', error);
      window.alert('No se pudieron cargar los usuarios: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await userService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('❌ [AdminScreen] Error cargando estadísticas:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Aplicar filtro de búsqueda por texto
    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar filtro de tarjeta activa
    if (activeFilter) {
      switch (activeFilter) {
        case 'active':
          filtered = filtered.filter(user => user.is_active === true);
          break;
        case 'inactive':
          filtered = filtered.filter(user => user.is_active === false);
          break;
        case 'explorer':
          filtered = filtered.filter(user => user.role === 'explorer');
          break;
        case 'scientist':
          filtered = filtered.filter(user => user.role === 'scientist');
          break;
        case 'admin':
          filtered = filtered.filter(user => user.role === 'admin');
          break;
        default:
          break;
      }
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
    loadStats();
  };

  const handleFilterClick = (filterType) => {
    console.log('🔍 [AdminScreen] Filtro seleccionado:', filterType);
    
    // Si ya está activo el mismo filtro, lo desactivamos
    if (activeFilter === filterType) {
      setActiveFilter(null);
      console.log('🔍 [AdminScreen] Filtro desactivado');
    } else {
      setActiveFilter(filterType);
      console.log('🔍 [AdminScreen] Filtro activado:', filterType);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      setActionLoading(true);
      await userService.updateUser(selectedUser.id, userData);
      
      // Actualizar lista local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? { ...user, ...userData }
            : user
        )
      );

      setEditModalVisible(false);
      setSelectedUser(null);
      window.alert('Usuario actualizado correctamente');
    } catch (error) {
      console.error('❌ [AdminScreen] Error actualizando usuario:', error);
      window.alert('No se pudo actualizar el usuario: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    console.log('🔄 [AdminScreen] Intentando cambiar estado de:', user.full_name, 'Estado actual:', user.is_active);
    
    const newStatus = !user.is_active;
    const action = newStatus ? 'activar' : 'desactivar';
    
    console.log('🔄 [AdminScreen] Nuevo estado será:', newStatus, 'Acción:', action);
    
    // Usar window.confirm para web en lugar de Alert.alert
    const confirmed = window.confirm(`¿Estás seguro de que quieres ${action} a ${user.full_name}?`);
    
    if (!confirmed) {
      console.log('❌ [AdminScreen] Usuario canceló la acción');
      return;
    }

    try {
      console.log('✅ [AdminScreen] Usuario confirmó la acción');
      setActionLoading(true);
      
      const result = await userService.toggleUserStatus(user.id, newStatus);
      console.log('✅ [AdminScreen] Respuesta del servicio:', result);
      
      // Actualizar lista local
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id
            ? { ...u, is_active: newStatus }
            : u
        )
      );

      console.log('✅ [AdminScreen] Lista local actualizada');
      
      // Usar window.alert para el mensaje de éxito
      window.alert(`Usuario ${action} correctamente`);
    } catch (error) {
      console.error('❌ [AdminScreen] Error cambiando estado:', error);
      window.alert(`No se pudo ${action} el usuario: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.email === currentUser?.email) {
      window.alert('Error: No puedes eliminar tu propia cuenta');
      return;
    }

    const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar a ${user.full_name}?\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      await userService.deleteUser(user.id);
      
      // Remover de lista local
      setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      
      window.alert('Usuario eliminado correctamente');
    } catch (error) {
      console.error('❌ [AdminScreen] Error eliminando usuario:', error);
      window.alert('No se pudo eliminar el usuario: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'scientist': return '#007bff';
      case 'explorer': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return 'build';
      case 'scientist': return 'flask';
      case 'explorer': return 'search';
      default: return 'person';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'scientist': return 'Científico';
      case 'explorer': return 'Explorador';
      default: return 'Usuario';
    }
  };

  const getFilterLabel = (filter) => {
    switch (filter) {
      case 'active': return 'usuarios activos';
      case 'inactive': return 'usuarios desactivados';
      case 'explorer': return 'exploradores';
      case 'scientist': return 'científicos';
      case 'admin': return 'administradores';
      default: return 'usuarios';
    }
  };

  const renderUserItem = ({ item: user }) => {
    // Debug: verificar qué botones se muestran
    const canEdit = (user.role !== 'admin' || user.email === currentUser?.email);
    const canToggleStatus = (user.role !== 'admin' || user.email === currentUser?.email);
    const canDelete = user.role !== 'admin' && user.email !== currentUser?.email;
    
    console.log(`🔍 [AdminScreen] Usuario: ${user.full_name} | Puede editar: ${canEdit} | Puede cambiar estado: ${canToggleStatus} | Puede eliminar: ${canDelete}`);
    
    return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
              <Ionicons name={getRoleIcon(user.role)} size={12} color="#fff" />
              <Text style={styles.roleText}>{getRoleLabel(user.role)}</Text>
            </View>
            <Text style={[
              styles.statusText,
              { color: user.is_active ? '#28a745' : '#dc3545' }
            ]}>
              {user.is_active ? '✅ Activo' : '❌ Inactivo'}
            </Text>
            {user.role === 'scientist' && user.approved === false && (
              <Text style={styles.pendingText}>⏳ Pendiente</Text>
            )}
          </View>
        </View>
        <View style={styles.userStats}>
          <Text style={styles.statText}>🌳 {user.trees_count || 0}</Text>
          <Text style={styles.statText}>🦋 {user.animals_count || 0}</Text>
        </View>
      </View>

      <View style={styles.userActions}>
        {/* Solo permitir editar si no es admin o es la propia cuenta */}
        {(user.role !== 'admin' || user.email === currentUser?.email) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditUser(user)}
            disabled={actionLoading}
          >
            <Ionicons name="create-outline" size={16} color="#007bff" />
            <Text style={[styles.actionButtonText, { color: '#007bff' }]}>Editar</Text>
          </TouchableOpacity>
        )}

        {/* Solo permitir activar/desactivar si no es admin o es la propia cuenta */}
        {(user.role !== 'admin' || user.email === currentUser?.email) && (
          <TouchableOpacity
            style={[styles.actionButton, user.is_active ? styles.deactivateButton : styles.activateButton]}
            onPress={() => handleToggleUserStatus(user)}
            disabled={actionLoading}
          >
            <Ionicons 
              name={user.is_active ? 'pause-outline' : 'play-outline'} 
              size={16} 
              color={user.is_active ? '#ffc107' : '#28a745'} 
            />
            <Text style={[styles.actionButtonText, { color: user.is_active ? '#ffc107' : '#28a745' }]}>
              {user.is_active ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Solo permitir eliminar si no es admin y no es la propia cuenta */}
        {user.role !== 'admin' && user.email !== currentUser?.email && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteUser(user)}
            disabled={actionLoading}
          >
            <Ionicons name="trash-outline" size={16} color="#dc3545" />
            <Text style={[styles.actionButtonText, { color: '#dc3545' }]}>Eliminar</Text>
          </TouchableOpacity>
        )}

        {/* Mostrar mensaje de protección para admins */}
        {user.role === 'admin' && user.email !== currentUser?.email && (
          <View style={styles.protectedBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#28a745" />
            <Text style={styles.protectedText}>Protegido</Text>
          </View>
        )}
      </View>
    </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d5016" />
        <Text style={styles.loadingText}>Cargando panel de administración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con Estadísticas */}
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Panel de Administración</Text>
        <Text style={styles.subtitle}>Gestión de usuarios del sistema</Text>
        {stats && (
          <Text style={styles.totalUsers}>👥 {stats.total_users} usuarios registrados</Text>
        )}
        
        {/* Estadísticas dentro del header */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
            <TouchableOpacity 
              style={[
                styles.statCard, 
                activeFilter === 'active' && styles.statCardActive
              ]}
              onPress={() => handleFilterClick('active')}
            >
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statNumber}>{stats.active_users}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.statCard, 
                activeFilter === 'inactive' && styles.statCardActive
              ]}
              onPress={() => handleFilterClick('inactive')}
            >
              <Text style={styles.statIcon}>❌</Text>
              <Text style={styles.statNumber}>{stats.inactive_users}</Text>
              <Text style={styles.statLabel}>Desactivados</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.statCard, 
                activeFilter === 'explorer' && styles.statCardActive
              ]}
              onPress={() => handleFilterClick('explorer')}
            >
              <Text style={styles.statIcon}>🔍</Text>
              <Text style={styles.statNumber}>{stats.explorers}</Text>
              <Text style={styles.statLabel}>Exploradores</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.statCard, 
                activeFilter === 'scientist' && styles.statCardActive
              ]}
              onPress={() => handleFilterClick('scientist')}
            >
              <Text style={styles.statIcon}>🔬</Text>
              <Text style={styles.statNumber}>{stats.scientists}</Text>
              <Text style={styles.statLabel}>Científicos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.statCard, 
                activeFilter === 'admin' && styles.statCardActive
              ]}
              onPress={() => handleFilterClick('admin')}
            >
              <Text style={styles.statIcon}>⚙️</Text>
              <Text style={styles.statNumber}>{stats.admins}</Text>
              <Text style={styles.statLabel}>Admins</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeFilter 
              ? `Buscar en ${getFilterLabel(activeFilter)}...`
              : "Buscar usuarios por email o nombre..."
          }
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
        {activeFilter && (
          <TouchableOpacity 
            onPress={() => setActiveFilter(null)}
            style={styles.filterClearButton}
          >
            <Text style={styles.filterClearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de usuarios */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2d5016']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </Text>
          </View>
        }
        style={styles.usersList}
      />

      {/* Modal de edición */}
      <UserEditModal
        visible={editModalVisible}
        user={selectedUser}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        loading={actionLoading}
      />

      {/* Loading overlay */}
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2d5016" />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2d5016',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  totalUsers: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 8,
    fontWeight: '500',
  },
  statsContainer: {
    paddingVertical: 15,
    paddingHorizontal: 0,
    marginTop: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 3,
    alignItems: 'center',
    minWidth: 70,
    height: 80,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statCardActive: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#2d5016',
    elevation: 4,
    shadowOpacity: 0.3,
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    lineHeight: 10,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 8,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterClearButton: {
    backgroundColor: '#2d5016',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  filterClearText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 0,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffc107',
    marginLeft: 8,
  },
  userStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  editButton: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  activateButton: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff0',
  },
  deactivateButton: {
    borderColor: '#ffc107',
    backgroundColor: '#fffbf0',
  },
  deleteButton: {
    borderColor: '#dc3545',
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  protectedText: {
    fontSize: 12,
    color: '#28a745',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminScreen;
