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
    this.useMockData = false; // CAMBIAR A DATOS REALES - Conectar con BD remota
    this.mockDataKey = 'admin_mock_users';
  }

  /**
   * Datos mock para desarrollo con persistencia en localStorage
   */
  getMockUsers() {
    // TEMPORAL: Limpiar localStorage para forzar recarga de datos
    localStorage.removeItem(this.mockDataKey); // Forzar recarga de datos con nuevo admin
    
    // Intentar cargar desde localStorage primero
    try {
      const savedUsers = localStorage.getItem(this.mockDataKey);
      if (savedUsers) {
        console.log('📦 [UserManagement] Cargando usuarios desde localStorage');
        return JSON.parse(savedUsers);
      }
    } catch (error) {
      console.warn('⚠️ [UserManagement] Error cargando desde localStorage:', error);
    }

    // Si no hay datos guardados, usar datos por defecto
    console.log('🔧 [UserManagement] Usando datos mock por defecto');
    const defaultUsers = [
      {
        id: 1,
        email: 'admin@vibo.co',
        full_name: 'Administrador VIBO',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        trees_count: 8,
        animals_count: 2
      },
      {
        id: 2,
        email: 'scientist@vibo.co',
        full_name: 'Científico VIBO',
        role: 'scientist',
        is_active: true,
        approved: true,
        created_at: '2024-01-20T14:15:00Z',
        updated_at: '2024-01-20T14:15:00Z',
        trees_count: 5,
        animals_count: 1
      },
      {
        id: 3,
        email: 'explorer@vibo.co',
        full_name: 'Explorador VIBO',
        role: 'explorer',
        is_active: true,
        created_at: '2024-02-01T09:45:00Z',
        updated_at: '2024-02-01T09:45:00Z',
        trees_count: 4,
        animals_count: 1
      },
      {
        id: 4,
        email: 'erick@ieee.org',
        full_name: 'Erick Hansen (IEEE)',
        role: 'explorer',
        is_active: true,
        created_at: '2024-02-10T16:20:00Z',
        updated_at: '2024-02-10T16:20:00Z',
        trees_count: 3,
        animals_count: 1
      },
      {
        id: 5,
        email: 'erick@vibo.co',
        full_name: 'Erick Hansen (VIBO)',
        role: 'explorer',
        is_active: true,
        created_at: '2024-02-15T11:30:00Z',
        updated_at: '2024-02-15T11:30:00Z',
        trees_count: 4,
        animals_count: 0
      },
      {
        id: 6,
        email: 'nuevo.admin@test.com', // Usuario admin recién registrado
        full_name: 'Nuevo Administrador',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        trees_count: 0,
        animals_count: 0
      }
    ];

    // Guardar datos por defecto en localStorage
    this.saveMockUsers(defaultUsers);
    return defaultUsers;
  }

  /**
   * Guardar usuarios mock en localStorage
   */
  saveMockUsers(users) {
    try {
      localStorage.setItem(this.mockDataKey, JSON.stringify(users));
      console.log('💾 [UserManagement] Usuarios guardados en localStorage');
    } catch (error) {
      console.error('❌ [UserManagement] Error guardando en localStorage:', error);
    }
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
      
      // Usar endpoint corregido
      const url = `${this.baseUrl.replace('/api', '')}/admin-users-fixed.php`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🌐 [UserManagement] Conectando a:', url);

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
        
        // Obtener usuarios actuales
        const users = this.getMockUsers();
        
        // Actualizar el usuario específico
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                ...userData, 
                updated_at: new Date().toISOString(),
                // No guardar la contraseña en los datos mock por seguridad
                ...(userData.password && { password_updated: new Date().toISOString() })
              }
            : user
        );
        
        // Guardar cambios en localStorage
        this.saveMockUsers(updatedUsers);
        
        // Simular usuario actualizado (sin incluir contraseña en respuesta)
        const { password, ...userDataWithoutPassword } = userData;
        const updatedUser = {
          id: userId,
          ...userDataWithoutPassword,
          updated_at: new Date().toISOString(),
          ...(password && { password_changed: true })
        };
        
        console.log('✅ [UserManagement] Usuario mock actualizado y guardado exitosamente');
        return updatedUser;
      }
      
      // Usar endpoint corregido con ID en query params
      const url = `${this.baseUrl.replace('/api', '')}/admin-users-fixed.php?id=${userId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('🌐 [UserManagement] Actualizando usuario en:', url);

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
        
        // Obtener usuarios actuales
        const users = this.getMockUsers();
        
        // Actualizar el usuario específico
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { ...user, is_active: isActive, updated_at: new Date().toISOString() }
            : user
        );
        
        // Guardar cambios en localStorage
        this.saveMockUsers(updatedUsers);
        
        // Simular usuario con estado cambiado
        const updatedUser = {
          id: userId,
          is_active: isActive,
          updated_at: new Date().toISOString()
        };
        
        console.log('✅ [UserManagement] Estado de usuario mock cambiado y guardado exitosamente');
        return updatedUser;
      }
      
      // Usar endpoint corregido
      const url = `${this.baseUrl.replace('/api', '')}/admin-users-fixed.php?id=${userId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      console.log('🌐 [UserManagement] Cambiando estado en:', url);
      console.log('📤 [UserManagement] Enviando datos:', { is_active: isActive });

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
        
        // Obtener usuarios actuales
        const users = this.getMockUsers();
        
        // Filtrar el usuario eliminado
        const updatedUsers = users.filter(user => user.id !== userId);
        
        // Guardar cambios en localStorage
        this.saveMockUsers(updatedUsers);
        
        console.log('✅ [UserManagement] Usuario mock eliminado y guardado exitosamente');
        return true;
      }
      
      // Usar endpoint corregido con ID en query params
      const url = `${this.baseUrl.replace('/api', '')}/admin-users-fixed.php?id=${userId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🌐 [UserManagement] Eliminando usuario en:', url);

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
      
      // Usar endpoint simplificado - calcular estadísticas desde los usuarios
      const users = await this.getAllUsers();
      const stats = {
        total_users: users.length,
        active_users: users.filter(u => u.is_active).length,
        inactive_users: users.filter(u => !u.is_active).length,
        explorers: users.filter(u => u.role === 'explorer').length,
        scientists: users.filter(u => u.role === 'scientist').length,
        admins: users.filter(u => u.role === 'admin').length
      };
      
      console.log('✅ [UserManagement] Estadísticas calculadas:', stats);
      return stats;
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
