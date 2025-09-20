// Servicio simple de storage específico por usuario
class SimpleTreeStorage {
  
  // Obtener clave de storage específica por usuario
  static getUserStorageKey() {
    try {
      const authData = localStorage.getItem('biodiversity_user');
      if (authData) {
        const auth = JSON.parse(authData);
        const userId = auth.id || auth.email || 'default';
        return `@biodiversity_trees_${userId}`;
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
    }
    return '@biodiversity_trees_default';
  }
  
  // Obtener árboles locales del usuario actual
  static getLocalTrees() {
    try {
      const storageKey = this.getUserStorageKey();
      const treesJson = localStorage.getItem(storageKey);
      const trees = treesJson ? JSON.parse(treesJson) : [];
      console.log(`📋 [SimpleTreeStorage] Árboles recuperados: ${trees.length}`);
      return trees;
    } catch (error) {
      console.error('❌ Error obteniendo árboles:', error);
      return [];
    }
  }
  
  // Guardar árboles del usuario actual
  static saveLocalTrees(trees) {
    try {
      const storageKey = this.getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(trees));
      console.log(`✅ [SimpleTreeStorage] ${trees.length} árboles guardados`);
    } catch (error) {
      console.error('❌ Error guardando árboles:', error);
    }
  }
  
  // Limpiar datos del usuario actual
  static clearUserData() {
    try {
      const storageKey = this.getUserStorageKey();
      localStorage.removeItem(storageKey);
      console.log('🧹 [SimpleTreeStorage] Datos del usuario limpiados');
    } catch (error) {
      console.error('❌ Error limpiando datos:', error);
    }
  }
}

export default SimpleTreeStorage;
