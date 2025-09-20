// Servicio SIMPLE para animales - SOLO MySQL remoto
class SimpleAnimalService {
  constructor() {
    this.baseURL = 'https://explora.ieeetadeo.org';
  }

  // Crear animal
  async createAnimal(animalData) {
    try {
      console.log('🐾 [SimpleAnimalService] Creando animal:', animalData.common_name);
      
      const response = await fetch(`${this.baseURL}/simple-animals-endpoint.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(animalData)
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
      console.log('✅ [SimpleAnimalService] Respuesta del servidor:', result);
      
      // El endpoint devuelve {success: true, data: {...}}
      const animal = result.data || result;
      console.log('✅ [SimpleAnimalService] Animal creado:', animal.id);
      return animal;
      
    } catch (error) {
      console.error('❌ [SimpleAnimalService] Error creando animal:', error.message);
      throw error;
    }
  }

  // Obtener todos los animales
  async getAllAnimals() {
    try {
      console.log('📋 [SimpleAnimalService] Obteniendo todos los animales');
      
      const response = await fetch(`${this.baseURL}/simple-animals-endpoint.php`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        console.warn('⚠️ [SimpleAnimalService] Respuesta vacía, devolviendo array vacío');
        return [];
      }

      const result = JSON.parse(responseText);
      console.log('✅ [SimpleAnimalService] Respuesta del servidor:', result);
      
      // El endpoint devuelve {success: true, data: [...]}
      const animals = result.data || result || [];
      console.log('✅ [SimpleAnimalService] Animales obtenidos:', animals.length);
      return Array.isArray(animals) ? animals : [];
      
    } catch (error) {
      console.error('❌ [SimpleAnimalService] Error obteniendo animales:', error.message);
      return []; // Devolver array vacío en caso de error
    }
  }

  // Obtener animales por usuario
  async getAnimalsByUser(userId) {
    try {
      console.log('👤 [SimpleAnimalService] Obteniendo animales del usuario:', userId);
      
      const response = await fetch(`${this.baseURL}/simple-animals-endpoint.php?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        console.warn('⚠️ [SimpleAnimalService] Respuesta vacía, devolviendo array vacío');
        return [];
      }

      const result = JSON.parse(responseText);
      console.log('✅ [SimpleAnimalService] Respuesta del servidor:', result);
      
      // El endpoint devuelve {success: true, data: [...]}
      const animals = result.data || result || [];
      console.log('✅ [SimpleAnimalService] Animales del usuario obtenidos:', animals.length);
      return Array.isArray(animals) ? animals : [];
      
    } catch (error) {
      console.error('❌ [SimpleAnimalService] Error obteniendo animales del usuario:', error.message);
      return []; // Devolver array vacío en caso de error
    }
  }

  // Actualizar animal
  async updateAnimal(animalId, animalData) {
    try {
      console.log('📝 [SimpleAnimalService] Actualizando animal:', animalId);
      
      const response = await fetch(`${this.baseURL}/animals/${animalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(animalData)
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
      console.log('✅ [SimpleAnimalService] Animal actualizado:', result.id);
      return result;
      
    } catch (error) {
      console.error('❌ [SimpleAnimalService] Error actualizando animal:', error.message);
      throw error;
    }
  }

  // Eliminar animal
  async deleteAnimal(animalId) {
    try {
      console.log('🗑️ [SimpleAnimalService] Eliminando animal:', animalId);
      
      const response = await fetch(`${this.baseURL}/animals/${animalId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      console.log('✅ [SimpleAnimalService] Animal eliminado:', animalId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ [SimpleAnimalService] Error eliminando animal:', error.message);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats() {
    try {
      console.log('📊 [SimpleAnimalService] Obteniendo estadísticas');
      
      const response = await fetch(`${this.baseURL}/animals/stats`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        console.warn('⚠️ [SimpleAnimalService] Respuesta vacía, devolviendo stats por defecto');
        return {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }

      const stats = JSON.parse(responseText);
      console.log('✅ [SimpleAnimalService] Estadísticas obtenidas:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ [SimpleAnimalService] Error obteniendo estadísticas:', error.message);
      return {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
      };
    }
  }
}

export default SimpleAnimalService;
