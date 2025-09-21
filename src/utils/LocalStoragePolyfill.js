import { Platform } from 'react-native';

/**
 * Polyfill para localStorage en React Native
 * Se ejecuta automáticamente al importar
 */

// Crear un mock de localStorage que no haga nada pero no falle
const mockStorage = {
    getItem: (key) => {
      console.warn(`⚠️ [LocalStoragePolyfill] getItem(${key}) - localStorage no disponible en React Native`);
      return null;
    },
    setItem: (key, value) => {
      console.warn(`⚠️ [LocalStoragePolyfill] setItem(${key}) - localStorage no disponible en React Native`);
    },
    removeItem: (key) => {
      console.warn(`⚠️ [LocalStoragePolyfill] removeItem(${key}) - localStorage no disponible en React Native`);
    },
    clear: () => {
      console.warn(`⚠️ [LocalStoragePolyfill] clear() - localStorage no disponible en React Native`);
    },
    key: (index) => {
      console.warn(`⚠️ [LocalStoragePolyfill] key(${index}) - localStorage no disponible en React Native`);
      return null;
    },
    get length() {
      return 0;
    }
  };

// Solo aplicar el polyfill si no estamos en web
if (Platform.OS !== 'web') {
  console.log('📱 [LocalStoragePolyfill] Aplicando polyfill para React Native');
  
  // Asignar el mock al objeto global
  if (typeof global !== 'undefined') {
    global.localStorage = mockStorage;
  }
  
  // También asignar a window si existe (por si acaso)
  if (typeof window !== 'undefined') {
    window.localStorage = mockStorage;
  }
}

// En web, verificar que localStorage funcione
if (Platform.OS === 'web') {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Probar que funciona
      const testKey = '__polyfill_test__';
      window.localStorage.setItem(testKey, 'test');
      const testValue = window.localStorage.getItem(testKey);
      window.localStorage.removeItem(testKey);
      
      if (testValue === 'test') {
        console.log('✅ [LocalStoragePolyfill] localStorage verificado y funcionando en web');
      } else {
        throw new Error('localStorage no funciona correctamente');
      }
    } else {
      console.warn('⚠️ [LocalStoragePolyfill] localStorage no disponible en web');
      // Aplicar mock también en web si no funciona
      if (typeof window !== 'undefined') {
        window.localStorage = mockStorage;
      }
    }
  } catch (error) {
    console.error('❌ [LocalStoragePolyfill] Error verificando localStorage, aplicando mock:', error);
    // Si localStorage falla en web, usar el mock
    if (typeof window !== 'undefined') {
      window.localStorage = mockStorage;
    }
  }
}

export default {}; // Export vacío para que se pueda importar
