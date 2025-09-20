import TreeStorageService from './TreeStorageService';

class NewTreeService {
  // Crear un nuevo árbol con imagen
  async createTree(treeData, imageUri = null) {
    try {
      console.log('🌳 [NewTreeService] Creando árbol:', treeData);
      
      let imageFile = null;
      
      // Convertir URI de imagen a File si existe
      if (imageUri) {
        console.log('📸 [NewTreeService] Procesando imagen:', imageUri);
        
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        // Determinar extensión del archivo
        let extension = 'jpg';
        if (blob.type.includes('png')) extension = 'png';
        else if (blob.type.includes('webp')) extension = 'webp';
        else if (blob.type.includes('gif')) extension = 'gif';
        
        // Crear File object
        imageFile = new File([blob], `tree-${Date.now()}.${extension}`, {
          type: blob.type
        });
        
        console.log('✅ [NewTreeService] Imagen procesada:', {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type
        });
      }
      
      // Preparar datos del árbol
      const cleanTreeData = {
        common_name: treeData.common_name || treeData.commonName,
        scientific_name: treeData.scientific_name || treeData.scientificName || null,
        description: treeData.description || null,
        latitude: parseFloat(treeData.latitude),
        longitude: parseFloat(treeData.longitude),
        location_description: treeData.location_description || treeData.locationDescription || null,
        height_meters: treeData.height_meters || treeData.height || null,
        diameter_cm: treeData.diameter_cm || treeData.diameter || null,
        age_estimated: treeData.age_estimated || treeData.age || null,
        health_status: treeData.health_status || treeData.healthStatus || null
      };
      
      console.log('📋 [NewTreeService] Datos limpios:', cleanTreeData);
      
      // Procesar imagen para almacenamiento local
      let processedImageUrl = null;
      if (imageUri) {
        try {
          // Convertir imagen a base64 para almacenamiento local
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          // Convertir blob a base64
          const reader = new FileReader();
          processedImageUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          
          console.log('📸 [NewTreeService] Imagen convertida a base64 para almacenamiento local');
        } catch (error) {
          console.error('❌ [NewTreeService] Error procesando imagen:', error);
          processedImageUrl = imageUri; // Fallback a URI original
        }
      }

      // Guardar localmente usando TreeStorageService
      const treeWithImage = {
        ...cleanTreeData,
        image_url: processedImageUrl,
        createdAt: new Date().toISOString(),
        syncStatus: 'approved', // Para desarrollo, marcar como aprobado
        type: 'flora' // Por defecto es flora
      };
      
      console.log('💾 [NewTreeService] Guardando árbol con datos:', treeWithImage);
      const savedTree = await TreeStorageService.saveTreeLocally(treeWithImage);
      
      console.log('✅ [NewTreeService] Árbol guardado localmente:', savedTree);
      console.log('🔍 [NewTreeService] ID generado:', savedTree.id);
      console.log('👤 [NewTreeService] User ID:', savedTree.user_id);
      return {
        success: true,
        tree: savedTree,
        message: 'Árbol registrado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ [NewTreeService] Error creando árbol:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Obtener árboles del usuario
  async getUserTrees(userId) {
    try {
      console.log('📋 [NewTreeService] Obteniendo árboles locales del usuario:', userId);
      
      const localTrees = await TreeStorageService.getLocalTrees();
      
      console.log('✅ [NewTreeService] Árboles locales obtenidos:', localTrees?.length || 0);
      return localTrees || [];
      
    } catch (error) {
      console.error('❌ [NewTreeService] Error obteniendo árboles:', error);
      return [];
    }
  }
  
  // Obtener todos los árboles (públicos)
  async getAllTrees(params = {}) {
    try {
      console.log('🌍 [NewTreeService] Obteniendo todos los árboles locales:', params);
      
      const localTrees = await TreeStorageService.getLocalTrees();
      const dbTrees = await TreeStorageService.getTreesFromDatabase();
      
      // Combinar árboles locales y de BD (mock)
      const allTrees = [...localTrees, ...dbTrees];
      
      console.log('✅ [NewTreeService] Todos los árboles obtenidos:', allTrees?.length || 0);
      return allTrees || [];
      
    } catch (error) {
      console.error('❌ [NewTreeService] Error obteniendo árboles públicos:', error);
      return [];
    }
  }
  
  // Actualizar estado de un árbol (para científicos/admins)
  async updateTreeStatus(treeId, status, notes = '') {
    try {
      console.log('🔄 [NewTreeService] Actualizando estado del árbol (mock):', { treeId, status, notes });
      
      // Simular actualización exitosa
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ [NewTreeService] Estado actualizado exitosamente (mock)');
      return {
        success: true,
        message: 'Estado actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ [NewTreeService] Error actualizando estado:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Obtener URL de imagen
  getImageUrl(imagePath) {
    // Para desarrollo, devolver la imagen tal como está
    return imagePath;
  }
  
  // Compatibilidad con el código existente
  async getAllTrees(userId) {
    // Para mantener compatibilidad, devolver árboles del usuario
    return await this.getUserTrees(userId);
  }
  
  // Métodos de compatibilidad (ya no necesarios con backend directo)
  async syncAllPendingTrees(userId) {
    console.log('ℹ️ [NewTreeService] Sync no necesario con backend directo');
    return { successful: 0, total: 0, errors: [] };
  }
  
  async getSyncStats() {
    return { total: 0, pending: 0, synced: 0, errors: 0 };
  }
  
  async getTreesFromDatabase() {
    return await this.getAllTrees();
  }
}

// Instancia singleton
const newTreeService = new NewTreeService();

export default newTreeService;
