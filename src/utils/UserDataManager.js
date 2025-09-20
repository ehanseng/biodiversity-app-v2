// Utilidad para manejar datos específicos por usuario
class UserDataManager {
  
  // Limpiar datos locales del usuario anterior
  static clearPreviousUserData() {
    try {
      // Obtener todas las claves de localStorage
      const keys = Object.keys(localStorage);
      
      // Buscar claves relacionadas con árboles
      const treeKeys = keys.filter(key => key.startsWith('@biodiversity_trees'));
      
      console.log('🧹 [UserDataManager] Limpiando datos de usuarios anteriores...');
      console.log('🔍 [UserDataManager] Claves encontradas:', treeKeys);
      
      // Limpiar todas las claves de árboles
      treeKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ [UserDataManager] Eliminada clave: ${key}`);
      });
      
      console.log('✅ [UserDataManager] Limpieza completada');
      
    } catch (error) {
      console.error('❌ [UserDataManager] Error limpiando datos:', error);
    }
  }
  
  // Obtener clave de storage específica por usuario
  static getUserStorageKey(userId) {
    if (!userId) {
      // Intentar obtener del localStorage del auth
      const authData = localStorage.getItem('biodiversity_user');
      if (authData) {
        try {
          const auth = JSON.parse(authData);
          userId = auth.id || auth.email || 'default';
        } catch (error) {
          userId = 'default';
        }
      } else {
        userId = 'default';
      }
    }
    return `@biodiversity_trees_${userId}`;
  }
  
  // Migrar datos del storage general al específico del usuario
  static migrateToUserSpecificStorage() {
    try {
      const generalKey = '@biodiversity_trees';
      const generalData = localStorage.getItem(generalKey);
      
      if (generalData) {
        const userKey = this.getUserStorageKey();
        
        // Solo migrar si no existe data específica del usuario
        const existingUserData = localStorage.getItem(userKey);
        if (!existingUserData) {
          localStorage.setItem(userKey, generalData);
          console.log('🔄 [UserDataManager] Datos migrados a storage específico del usuario');
        }
        
        // Limpiar datos generales
        localStorage.removeItem(generalKey);
        console.log('🧹 [UserDataManager] Datos generales limpiados');
      }
    } catch (error) {
      console.error('❌ [UserDataManager] Error en migración:', error);
    }
  }
}

export default UserDataManager;
