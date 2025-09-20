// Servicio híbrido para usuarios: localStorage + MySQL
import userStorageService from './UserStorageService';
import userMySQLService from './UserMySQLService';

class HybridUserService {
  constructor() {
    this.mysqlOnly = true; // SOLO usar MySQL, sin localStorage
    this.preferMySQL = true; // Siempre preferir MySQL sobre localStorage
    this.mysqlFirst = true; // Intentar MySQL primero siempre
  }

  // Crear usuario SOLO en MySQL
  async createUser(userData) {
    try {
      console.log('🆕 [HybridUserService] Creando usuario en MySQL:', userData.email);
      
      // SOLO crear en MySQL
      const mysqlUser = await userMySQLService.createUser(userData);
      console.log('✅ [HybridUserService] Usuario creado en MySQL:', mysqlUser.id);
      
      return mysqlUser;
      
    } catch (error) {
      console.error('❌ [HybridUserService] Error creando usuario en MySQL:', error);
      throw error;
    }
  }

  // Buscar usuario SOLO en MySQL
  async findUser(email, password) {
    try {
      console.log('🔍 [HybridUserService] Buscando usuario en MySQL:', email);
      
      // SOLO usar MySQL
      console.log('🌐 [HybridUserService] Intentando login en MySQL...');
      const mysqlUser = await userMySQLService.findUser(email, password);
      
      if (mysqlUser) {
        console.log('✅ [HybridUserService] Login exitoso en MySQL - Usuario:', mysqlUser.email, 'Rol:', mysqlUser.role);
        return mysqlUser;
      } else {
        console.log('❌ [HybridUserService] Credenciales inválidas en MySQL');
        return null;
      }
      
    } catch (error) {
      console.error('❌ [HybridUserService] Error en login MySQL:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios (para debug)
  async getAllUsers() {
    try {
      console.log('📋 [HybridUserService] Obteniendo todos los usuarios...');
      
      let allUsers = [];
      
      // Intentar obtener de MySQL primero
      try {
        const mysqlUsers = await userMySQLService.getAllUsers();
        console.log('🌐 [HybridUserService] Usuarios de MySQL:', mysqlUsers.length);
        allUsers = mysqlUsers.map(user => ({ ...user, source: 'mysql' }));
      } catch (mysqlError) {
        console.warn('⚠️ [HybridUserService] Error obteniendo usuarios de MySQL:', mysqlError.message);
      }
      
      // Obtener usuarios locales
      const localUsers = userStorageService.getAllUsers();
      console.log('📱 [HybridUserService] Usuarios locales:', localUsers.length);
      
      // Agregar usuarios locales que no estén en MySQL
      const localOnlyUsers = localUsers.filter(localUser => 
        !allUsers.some(mysqlUser => mysqlUser.email === localUser.email)
      );
      
      allUsers = allUsers.concat(
        localOnlyUsers.map(user => ({ ...user, source: 'local' }))
      );
      
      console.log('📊 [HybridUserService] Total usuarios híbridos:', allUsers.length);
      return allUsers;
      
    } catch (error) {
      console.error('❌ [HybridUserService] Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Verificar si un email existe
  async emailExists(email) {
    try {
      // Verificar en MySQL primero
      try {
        const exists = await userMySQLService.emailExists(email);
        if (exists) return true;
      } catch (mysqlError) {
        console.warn('⚠️ [HybridUserService] Error verificando email en MySQL:', mysqlError.message);
      }
      
      // Verificar en localStorage
      const localUser = userStorageService.findUserByEmail(email);
      return !!localUser;
      
    } catch (error) {
      console.error('❌ [HybridUserService] Error verificando email:', error);
      return false;
    }
  }

  // Sincronizar usuarios locales no sincronizados con MySQL
  async syncPendingUsers() {
    try {
      console.log('🔄 [HybridUserService] Sincronizando usuarios pendientes...');
      
      const localUsers = userStorageService.getAllUsers();
      const pendingUsers = localUsers.filter(user => !user.synced && !user.mysql_id);
      
      console.log('📊 [HybridUserService] Usuarios pendientes de sincronizar:', pendingUsers.length);
      
      let syncedCount = 0;
      
      for (const localUser of pendingUsers) {
        try {
          // Intentar crear en MySQL
          const mysqlUser = await userMySQLService.createUser({
            email: localUser.email,
            password: localUser.password,
            full_name: localUser.full_name,
            role: localUser.role
          });
          
          // Actualizar usuario local con ID de MySQL
          userStorageService.updateUser(localUser.id, {
            mysql_id: mysqlUser.id,
            synced: true
          });
          
          syncedCount++;
          console.log('✅ [HybridUserService] Usuario sincronizado:', localUser.email);
          
        } catch (error) {
          console.warn('⚠️ [HybridUserService] Error sincronizando usuario:', localUser.email, error.message);
        }
      }
      
      console.log(`🔄 [HybridUserService] Sincronización completada: ${syncedCount}/${pendingUsers.length}`);
      return syncedCount;
      
    } catch (error) {
      console.error('❌ [HybridUserService] Error en sincronización:', error);
      return 0;
    }
  }

  // Actualizar cache local con datos de MySQL
  updateLocalCache(mysqlUser) {
    try {
      const localUser = userStorageService.findUserByEmail(mysqlUser.email);
      
      if (localUser) {
        // Actualizar usuario existente
        userStorageService.updateUser(localUser.id, {
          mysql_id: mysqlUser.id,
          full_name: mysqlUser.full_name,
          role: mysqlUser.role,
          synced: true
        });
      } else {
        // Crear nuevo usuario en cache local
        userStorageService.createUser({
          ...mysqlUser,
          id: mysqlUser.id.toString(),
          mysql_id: mysqlUser.id,
          synced: true
        });
      }
      
      console.log('🔄 [HybridUserService] Cache local actualizado para:', mysqlUser.email);
      
    } catch (error) {
      console.warn('⚠️ [HybridUserService] Error actualizando cache local:', error);
    }
  }

  // Obtener estadísticas híbridas
  async getStats() {
    try {
      const allUsers = await this.getAllUsers();
      
      const stats = {
        total: allUsers.length,
        mysql: allUsers.filter(u => u.source === 'mysql').length,
        local_only: allUsers.filter(u => u.source === 'local').length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        scientists: allUsers.filter(u => u.role === 'scientist').length,
        explorers: allUsers.filter(u => u.role === 'explorer').length,
        visitors: allUsers.filter(u => u.role === 'visitor').length
      };
      
      console.log('📊 [HybridUserService] Estadísticas híbridas:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ [HybridUserService] Error obteniendo estadísticas:', error);
      return {
        total: 0,
        mysql: 0,
        local_only: 0,
        admins: 0,
        scientists: 0,
        explorers: 0,
        visitors: 0
      };
    }
  }
}

// Exportar instancia singleton
const hybridUserService = new HybridUserService();
export default hybridUserService;
