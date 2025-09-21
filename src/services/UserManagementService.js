/**
 * UserManagementService - Servicio para administración de usuarios
 * Permite a los administradores gestionar usuarios del sistema
 */

class UserManagementService {
  constructor() {
    this.baseUrl = 'https://explora.ieeetadeo.org/api';
    // Fallback para desarrollo local
    this.fallbackUrl = 'http://localhost/biodiversity-app/backend';
    // Modo de desarrollo - usar datos mock temporalmente
    this.useMockData = true;
  }

  /**
   * Datos mock para desarrollo
   */
  getMockUsers() {
    return [
      {
        id: 1,
        email: 'admin@vibo.co',
        full_name: 'Administrador VIBO',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        trees_count: 25,
        animals_count: 12
      },
      {
        id: 2,
        email: 'scientist@vibo.co',
        full_name: 'Científico VIBO',
        role: 'scientist',
        is_active: true,
        created_at: '2024-01-20T14:15:00Z',
        updated_at: '2024-01-20T14:15:00Z',
        trees_count: 18,
        animals_count: 8
      },
      {
        id: 3,
        email: 'explorer@vibo.co',
        full_name: 'Explorador VIBO',
        role: 'explorer',
        is_active: true,
        created_at: '2024-02-01T09:45:00Z',
        updated_at: '2024-02-01T09:45:00Z',
        trees_count: 32,
        animals_count: 15
      },
      {
        id: 4,
        email: 'erick@ieee.org',
        full_name: 'Erick Hansen (IEEE)',
        role: 'admin',
        is_active: true,
        created_at: '2024-02-10T16:20:00Z',
        updated_at: '2024-02-10T16:20:00Z',
        trees_count: 45,
        animals_count: 28
      },
      {
        id: 5,
        email: 'erick@vibo.co',
        full_name: 'Erick Hansen (VIBO)',
        role: 'admin',
        is_active: true,
        created_at: '2024-02-15T11:30:00Z',
        updated_at: '2024-02-15T11:30:00Z',
        trees_count: 38,
        animals_count: 22
      }
    ];
  }

  getMockStats() {
    const users = this.getMockUsers();
    return {
      total_users: users.length,
      active_users: users.filter(u => u.is_active).length,
      inactive_users: users.filter(u => !u.is_active).length,
      explorers: users.filter(u => u.role === 'explorer').length,
      scientists: users.filter(u => u.role === 'scientist').length,
      admins: users.filter(u => u.role === 'admin').length,
      today_registrations: 0,
      week_registrations: 2,
      month_registrations: 5,
      total_trees: users.reduce((sum, u) => sum + u.trees_count, 0),
      total_animals: users.reduce((sum, u) => sum + u.animals_count, 0),
      approved_trees: Math.floor(users.reduce((sum, u) => sum + u.trees_count, 0) * 0.8),
      approved_animals: Math.floor(users.reduce((sum, u) => sum + u.animals_count, 0) * 0.75),
      pending_trees: Math.floor(users.reduce((sum, u) => sum + u.trees_count, 0) * 0.15),
      pending_animals: Math.floor(users.reduce((sum, u) => sum + u.animals_count, 0) * 0.20)
    };
  }

  /**
   * Obtener todos los usuarios del sistema
   */
  async getAllUsers() {
    try {
      console.log('👥 [UserManagement] Obteniendo todos los usuarios...');
      
      // Usar datos mock temporalmente
      if (this.useMockData) {
        console.log('🔧 [UserManagement] Usando datos mock para desarrollo');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay de red
        const users = this.getMockUsers();
        console.log('✅ [UserManagement] Usuarios mock obtenidos:', users.length);
        return users;
      }
      
      const response = await fetch(`${this.baseUrl}/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UserManagement] Usuarios obtenidos:', result.users.length);
        return result.users;
      } else {
        throw new Error(result.message || 'Error obteniendo usuarios');
      }
    } catch (error) {
      console.error('❌ [UserManagement] Error obteniendo usuarios:', error);
      throw error;
    }
  }

  /**
   * Actualizar información de un usuario
   */
  async updateUser(userId, userData) {
    try {
      console.log('✏️ [UserManagement] Actualizando usuario:', userId, userData);
      
      // Usar datos mock temporalmente
      if (this.useMockData) {
        console.log('🔧 [UserManagement] Simulando actualización de usuario mock');
        await new Promise(resolve => setTimeout(resolve, 800)); // Simular delay de red
        
        // Simular usuario actualizado
        const updatedUser = {
          id: userId,
          ...userData,
          updated_at: new Date().toISOString()
        };
        
        console.log('✅ [UserManagement] Usuario mock actualizado exitosamente');
        return updatedUser;
      }
      
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UserManagement] Usuario actualizado exitosamente');
        return result.user;
      } else {
        throw new Error(result.message || 'Error actualizando usuario');
      }
    } catch (error) {
      console.error('❌ [UserManagement] Error actualizando usuario:', error);
      throw error;
    }
  }

  /**
   * Cambiar rol de un usuario
   */
  async changeUserRole(userId, newRole) {
    try {
      console.log('🔄 [UserManagement] Cambiando rol de usuario:', userId, 'a', newRole);
      
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UserManagement] Rol cambiado exitosamente');
        return result.user;
      } else {
        throw new Error(result.message || 'Error cambiando rol');
      }
    } catch (error) {
      console.error('❌ [UserManagement] Error cambiando rol:', error);
      throw error;
    }
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleUserStatus(userId, isActive) {
    try {
      console.log('🔄 [UserManagement] Cambiando estado de usuario:', userId, 'activo:', isActive);
      
      // Usar datos mock temporalmente
      if (this.useMockData) {
        console.log('🔧 [UserManagement] Simulando cambio de estado mock');
        await new Promise(resolve => setTimeout(resolve, 600)); // Simular delay de red
        
        // Simular usuario con estado cambiado
        const updatedUser = {
          id: userId,
          is_active: isActive,
          updated_at: new Date().toISOString()
        };
        
        console.log('✅ [UserManagement] Estado de usuario mock cambiado exitosamente');
        return updatedUser;
      }
      
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UserManagement] Estado de usuario cambiado exitosamente');
        return result.user;
      } else {
        throw new Error(result.message || 'Error cambiando estado');
      }
    } catch (error) {
      console.error('❌ [UserManagement] Error cambiando estado:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async deleteUser(userId) {
    try {
      console.log('🗑️ [UserManagement] Eliminando usuario:', userId);
      
      // Usar datos mock temporalmente
      if (this.useMockData) {
        console.log('🔧 [UserManagement] Simulando eliminación de usuario mock');
        await new Promise(resolve => setTimeout(resolve, 700)); // Simular delay de red
        console.log('✅ [UserManagement] Usuario mock eliminado exitosamente');
        return true;
      }
      
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UserManagement] Usuario eliminado exitosamente');
        return true;
      } else {
        throw new Error(result.message || 'Error eliminando usuario');
      }
    } catch (error) {
      console.error('❌ [UserManagement] Error eliminando usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats() {
    try {
      console.log('📊 [UserManagement] Obteniendo estadísticas de usuarios...');
      
      // Usar datos mock temporalmente
      if (this.useMockData) {
        console.log('🔧 [UserManagement] Usando estadísticas mock para desarrollo');
        await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay de red
        const stats = this.getMockStats();
        console.log('✅ [UserManagement] Estadísticas mock obtenidas:', stats);
        return stats;
      }
      
      const response = await fetch(`${this.baseUrl}/admin/stats/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UserManagement] Estadísticas obtenidas:', result.stats);
        return result.stats;
      } else {
        throw new Error(result.message || 'Error obteniendo estadísticas');
      }
    } catch (error) {
      console.error('❌ [UserManagement] Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Buscar usuarios por email o nombre
   */
  async searchUsers(query) {
    try {
      console.log('🔍 [UserManagement] Buscando usuarios:', query);
      
      const response = await fetch(`${this.baseUrl}/admin/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UserManagement] Usuarios encontrados:', result.users.length);
        return result.users;
      } else {
        throw new Error(result.message || 'Error buscando usuarios');
      }
    } catch (error) {
      console.error('❌ [UserManagement] Error buscando usuarios:', error);
      throw error;
    }
  }

  /**
   * Resetear contraseña de usuario
   */
  async resetUserPassword(userId, newPassword) {
    try {
      console.log('🔑 [UserManagement] Reseteando contraseña de usuario:', userId);
      
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UserManagement] Contraseña reseteada exitosamente');
        return true;
      } else {
        throw new Error(result.message || 'Error reseteando contraseña');
      }
    } catch (error) {
      console.error('❌ [UserManagement] Error reseteando contraseña:', error);
      throw error;
    }
  }
}

export default UserManagementService;
