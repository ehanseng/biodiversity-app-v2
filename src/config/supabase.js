import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Validate configuration
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('⚠️ Supabase configuration not found. Please set up your .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Cross-platform storage adapter with better error handling
const StorageAdapter = Platform.OS === 'web'
  ? {
      getItem: async (key) => {
        try {
          const value = window.localStorage.getItem(key);
          return Promise.resolve(value);
        } catch (e) {
          console.warn('localStorage.getItem failed:', e);
          return Promise.resolve(null);
        }
      },
      setItem: async (key, value) => {
        try {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (e) {
          console.warn('localStorage.setItem failed:', e);
          return Promise.resolve();
        }
      },
      removeItem: async (key) => {
        try {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        } catch (e) {
          console.warn('localStorage.removeItem failed:', e);
          return Promise.resolve();
        }
      },
    }
  : {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Usar configuración por defecto de Supabase (sin forzar duración específica)
  },
  global: {
    headers: {
      'X-Client-Info': 'biodiversity-app-v2',
    },
  },
});

// Función para limpiar datos de sesión corruptos
export const clearCorruptedSession = async () => {
  try {
    console.log('🧹 Limpiando datos de sesión corruptos...');
    
    if (Platform.OS === 'web') {
      // Limpiar localStorage en web de forma más agresiva
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('session') ||
          key.includes('token')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log('🗑️ Removiendo clave:', key);
        localStorage.removeItem(key);
      });
      
      // También limpiar sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('session') ||
          key.includes('token')
        )) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => {
        console.log('🗑️ Removiendo clave de session:', key);
        sessionStorage.removeItem(key);
      });
      
    } else {
      // Limpiar SecureStore en móvil
      const keysToTry = [
        'supabase.auth.token',
        'supabase.session',
        'supabase.user',
        '@supabase/auth-token',
      ];
      
      for (const key of keysToTry) {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log('🗑️ Removida clave móvil:', key);
        } catch (error) {
          // Ignorar errores si la clave no existe
        }
      }
    }
    
    console.log('✅ Datos de sesión limpiados completamente');
    return true;
  } catch (error) {
    console.error('❌ Error limpiando sesión:', error);
    return false;
  }
};

// User roles enum
export const USER_ROLES = {
  EXPLORER: 'explorer',
  SCIENTIST: 'scientist',
  ADMIN: 'admin',
};

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  TREES: 'trees',
  ANIMALS: 'animals',
  TREE_APPROVALS: 'tree_approvals',
};
