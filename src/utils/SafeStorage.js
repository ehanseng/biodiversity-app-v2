import { Platform } from 'react-native';

/**
 * SafeStorage - Wrapper seguro para localStorage que funciona en todas las plataformas
 */
class SafeStorage {
  static isAvailable() {
    try {
      if (Platform.OS !== 'web') return false;
      if (typeof window === 'undefined') return false;
      if (!window.localStorage) return false;
      
      // Probar que realmente funciona
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('⚠️ [SafeStorage] localStorage no disponible:', error.message);
      return false;
    }
  }

  static getItem(key) {
    try {
      if (!this.isAvailable()) {
        console.warn(`⚠️ [SafeStorage] localStorage no disponible, retornando null para: ${key}`);
        return null;
      }
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error(`❌ [SafeStorage] Error obteniendo ${key}:`, error);
      return null;
    }
  }

  static setItem(key, value) {
    try {
      if (!this.isAvailable()) {
        console.warn(`⚠️ [SafeStorage] localStorage no disponible, no se puede guardar: ${key}`);
        return false;
      }
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`❌ [SafeStorage] Error guardando ${key}:`, error);
      return false;
    }
  }

  static removeItem(key) {
    try {
      if (!this.isAvailable()) {
        console.warn(`⚠️ [SafeStorage] localStorage no disponible, no se puede eliminar: ${key}`);
        return false;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`❌ [SafeStorage] Error eliminando ${key}:`, error);
      return false;
    }
  }

  static getAllKeys() {
    try {
      if (!this.isAvailable()) {
        console.warn(`⚠️ [SafeStorage] localStorage no disponible, retornando array vacío`);
        return [];
      }
      return Object.keys(window.localStorage);
    } catch (error) {
      console.error(`❌ [SafeStorage] Error obteniendo claves:`, error);
      return [];
    }
  }

  static clear() {
    try {
      if (!this.isAvailable()) {
        console.warn(`⚠️ [SafeStorage] localStorage no disponible, no se puede limpiar`);
        return false;
      }
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error(`❌ [SafeStorage] Error limpiando localStorage:`, error);
      return false;
    }
  }

  // Método helper para obtener JSON de forma segura
  static getJSON(key, defaultValue = null) {
    try {
      const item = this.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`❌ [SafeStorage] Error parseando JSON para ${key}:`, error);
      return defaultValue;
    }
  }

  // Método helper para guardar JSON de forma segura
  static setJSON(key, value) {
    try {
      return this.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`❌ [SafeStorage] Error stringificando JSON para ${key}:`, error);
      return false;
    }
  }
}

export default SafeStorage;
