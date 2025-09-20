// Servicio SIMPLE para árboles - SOLO MySQL remoto
class SimpleTreeService {
  constructor() {
    this.baseURL = 'https://explora.ieeetadeo.org';
  }

  // Crear árbol
  async createTree(treeData) {
    try {
      console.log('🌳 [SimpleTreeService] Creando árbol:', treeData.common_name);
      
      const response = await fetch(`${this.baseURL}/simple-trees-endpoint.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(treeData)
      });

      if (!response.ok) {
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no puede leer JSON, usar mensaje genérico
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('El servidor devolvió una respuesta vacía');
      }

      const result = JSON.parse(responseText);
      console.log('✅ [SimpleTreeService] Árbol creado:', result.id);
      return result;
      
    } catch (error) {
      console.error('❌ [SimpleTreeService] Error creando árbol:', error.message);
      throw error;
    }
  }

  // Obtener todos los árboles
  async getAllTrees() {
    try {
      console.log('📋 [SimpleTreeService] Obteniendo todos los árboles');
      
      const response = await fetch(`${this.baseURL}/simple-trees-endpoint.php`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        console.warn('⚠️ [SimpleTreeService] Respuesta vacía, devolviendo array vacío');
        return [];
      }

      const trees = JSON.parse(responseText);
      console.log('✅ [SimpleTreeService] Árboles obtenidos:', trees.length);
      return Array.isArray(trees) ? trees : [];
      
    } catch (error) {
      console.error('❌ [SimpleTreeService] Error obteniendo árboles:', error.message);
      return []; // Devolver array vacío en caso de error
    }
  }

  // Obtener árboles por usuario
  async getTreesByUser(userId) {
    try {
      console.log('👤 [SimpleTreeService] Obteniendo árboles del usuario:', userId);
      
      const response = await fetch(`${this.baseURL}/simple-trees-endpoint.php?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        console.warn('⚠️ [SimpleTreeService] Respuesta vacía, devolviendo array vacío');
        return [];
      }

      const trees = JSON.parse(responseText);
      console.log('✅ [SimpleTreeService] Árboles del usuario obtenidos:', trees.length);
      return Array.isArray(trees) ? trees : [];
      
    } catch (error) {
      console.error('❌ [SimpleTreeService] Error obteniendo árboles del usuario:', error.message);
      return []; // Devolver array vacío en caso de error
    }
  }

  // Actualizar árbol
  async updateTree(treeId, treeData) {
    try {
      console.log('📝 [SimpleTreeService] Actualizando árbol:', treeId);
      
      const response = await fetch(`${this.baseURL}/simple-trees-endpoint.php/${treeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(treeData)
      });

      if (!response.ok) {
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no puede leer JSON, usar mensaje genérico
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('El servidor devolvió una respuesta vacía');
      }

      const result = JSON.parse(responseText);
      console.log('✅ [SimpleTreeService] Árbol actualizado:', result.id);
      return result;
      
    } catch (error) {
      console.error('❌ [SimpleTreeService] Error actualizando árbol:', error.message);
      throw error;
    }
  }

  // Eliminar árbol
  async deleteTree(treeId) {
    try {
      console.log('🗑️ [SimpleTreeService] Eliminando árbol:', treeId);
      
      const response = await fetch(`${this.baseURL}/simple-trees-endpoint.php/${treeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      console.log('✅ [SimpleTreeService] Árbol eliminado:', treeId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ [SimpleTreeService] Error eliminando árbol:', error.message);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats() {
    try {
      console.log('📊 [SimpleTreeService] Obteniendo estadísticas');
      
      const response = await fetch(`${this.baseURL}/simple-trees-endpoint.php/stats`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        console.warn('⚠️ [SimpleTreeService] Respuesta vacía, devolviendo stats por defecto');
        return {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }

      const stats = JSON.parse(responseText);
      console.log('✅ [SimpleTreeService] Estadísticas obtenidas:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ [SimpleTreeService] Error obteniendo estadísticas:', error.message);
      return {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
      };
    }
  }
}

export default SimpleTreeService;
