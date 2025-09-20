import React, { createContext, useContext, useState, useEffect } from 'react';
import SimpleTreeStorage from '../services/SimpleTreeStorage';
import mySQLService from '../services/MySQLService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Usuarios mock para desarrollo
const MOCK_USERS = [
  {
    id: '1',
    email: 'explorer@vibo.co',
    password: 'explorer123',
    full_name: 'Explorer Usuario',
    role: 'explorer',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    email: 'scientist@vibo.co',
    password: 'scientist123',
    full_name: 'Científico Usuario',
    role: 'scientist',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    email: 'admin@vibo.co',
    password: 'admin123',
    full_name: 'Admin Usuario',
    role: 'admin',
    created_at: new Date().toISOString()
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 [AuthContext] Verificando estado de autenticación...');
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const savedUser = localStorage.getItem('biodiversity_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('✅ [AuthContext] Usuario encontrado en localStorage');
        setUser(userData);
        console.log('✅ [AuthContext] Usuario autenticado correctamente');
      } else {
        console.log('❌ [AuthContext] No hay sesión activa');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error verificando estado:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('🔐 [AuthContext] Iniciando login...');
      setError(null);
      
      const login = async (email, password) => {
        try {
          console.log('🔐 [AuthContext] Intentando login con:', email);
          
          // Buscar usuario en la lista de usuarios mock
          const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
          
          if (!foundUser) {
            throw new Error('Credenciales inválidas');
          }

          // Simular delay de autenticación
          await new Promise(resolve => setTimeout(resolve, 1000));

          const userData = {
            id: foundUser.id,
            email: foundUser.email,
            role: foundUser.role
          };

          setUser(userData);
          //setProfile(foundUser);
          
          // Guardar en localStorage
          localStorage.setItem('biodiversity_user', JSON.stringify(userData));

          console.log('✅ [AuthContext] Login exitoso:', userData);
          console.log('🔄 [AuthContext] Datos locales ahora son específicos del usuario:', userData.email);
          
          return { user: userData, profile: foundUser };
        } catch (error) {
          console.error('❌ [AuthContext] Error en login:', error);
          throw error;
        }
      };
      
      const result = await login(email, password);
      return { success: true, ...result };
    } catch (error) {
      console.error('❌ [AuthContext] Error en signIn:', error);
      return { success: false, error: error.message };
    }
  };

  const signUp = async (userData) => {
    try {
      console.log('📝 [AuthContext] Iniciando registro...');
      setError(null);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar si el email ya existe
      const existingUser = MOCK_USERS.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }
      
      // Crear nuevo usuario
      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        full_name: userData.full_name || userData.email,
        role: userData.role || 'explorer',
        created_at: new Date().toISOString()
      };
      
      // Agregar a la lista mock (solo para esta sesión)
      MOCK_USERS.push({ ...newUser, password: userData.password });
      
      // Guardar en localStorage
      localStorage.setItem('biodiversity_user', JSON.stringify(newUser));
      
      console.log('✅ [AuthContext] Registro exitoso');
      setUser(newUser);
      return { success: true, user: newUser };
      
    } catch (error) {
      console.error('❌ [AuthContext] Error en registro:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 [AuthContext] Cerrando sesión...');
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Limpiar localStorage
      localStorage.removeItem('biodiversity_user');
      
      setUser(null);
      setError(null);
      
      console.log('✅ [AuthContext] Sesión cerrada');
      return { success: true };
    } catch (error) {
      console.error('❌ [AuthContext] Error cerrando sesión:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshProfile = async () => {
    try {
      if (!user) return;
      
      console.log('🔄 [AuthContext] Actualizando perfil...');
      
      // En el sistema simple, solo recargar desde localStorage
      const savedUser = localStorage.getItem('biodiversity_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log('✅ [AuthContext] Perfil actualizado');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error actualizando perfil:', error);
    }
  };

  const getStats = async () => {
    try {
      if (!user) return null;
      
      console.log('📊 [AuthContext] Calculando estadísticas reales...');
      
      // Obtener árboles locales del usuario actual (ya filtrados por usuario)
      const userTrees = SimpleTreeStorage.getLocalTrees();
      
      console.log('📋 [AuthContext] Árboles del usuario para estadísticas:', userTrees.length);
      
      // Separar por tipo
      const userFlora = userTrees.filter(tree => tree.type === 'flora' || !tree.type); // Sin tipo = flora por defecto
      const userFauna = userTrees.filter(tree => tree.type === 'fauna');
      
      // Contar por estado
      const stats = {
        total_trees: userTrees.length,
        pending_trees: userTrees.filter(tree => 
          (tree.status === 'pending') || 
          (tree.syncStatus === 'pending') ||
          (!tree.status && !tree.syncStatus)
        ).length,
        approved_trees: userTrees.filter(tree => 
          (tree.status === 'approved') || 
          (tree.syncStatus === 'approved')
        ).length,
        rejected_trees: userTrees.filter(tree => 
          (tree.status === 'rejected') || 
          (tree.syncStatus === 'rejected')
        ).length,
        local_trees: userTrees.filter(tree => !tree.mysql_id || tree.syncStatus !== 'synced').length,
        synced_trees: userTrees.filter(tree => tree.mysql_id && tree.syncStatus === 'synced').length,
        // Estadísticas por tipo
        flora_count: userFlora.length,
        fauna_count: userFauna.length,
        flora_approved: userFlora.filter(tree => 
          (tree.status === 'approved') || (tree.syncStatus === 'approved')
        ).length,
        fauna_approved: userFauna.filter(tree => 
          (tree.status === 'approved') || (tree.syncStatus === 'approved')
        ).length,
        flora_pending: userFlora.filter(tree => 
          (tree.status === 'pending') || (tree.syncStatus === 'pending') || (!tree.status && !tree.syncStatus)
        ).length,
        fauna_pending: userFauna.filter(tree => 
          (tree.status === 'pending') || (tree.syncStatus === 'pending') || (!tree.status && !tree.syncStatus)
        ).length
      };
      
      console.log('📊 [AuthContext] Estadísticas calculadas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [AuthContext] Error obteniendo estadísticas:', error);
      return null;
    }
  };

  const getAllTrees = async () => {
    if (!user) return [];
    try {
      console.log('🌳 [AuthContext] Obteniendo árboles híbridos (localStorage + MySQL)...');
      
      // Obtener árboles locales del usuario
      const localTrees = SimpleTreeStorage.getLocalTrees();
      
      // Obtener árboles del servidor MySQL
      let serverTrees = [];
      try {
        serverTrees = await mySQLService.getAllRecords();
      } catch (error) {
        console.warn('⚠️ [AuthContext] No se pudieron obtener árboles del servidor:', error.message);
      }
      
      // Combinar árboles locales y del servidor
      const allTrees = [...localTrees, ...serverTrees];
      console.log('📊 [AuthContext] Total árboles híbridos encontrados:', allTrees.length);
      console.log('   📱 Locales:', localTrees.length);
      console.log('   🌐 Servidor:', serverTrees.length);
      
      return allTrees;
    } catch (error) {
      console.error('❌ Error obteniendo árboles:', error);
      return [];
    }
  };

  const forceSyncTrees = async () => {
    // Ya no necesitamos sincronización local, todo va directo al backend
    console.log('ℹ️ [AuthContext] Sync no necesario con backend directo');
    return true;
  };

  const syncStats = { total: 0, pending: 0, synced: 0, errors: 0 }; // Compatibilidad

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    getStats,
    getAllTrees,
    forceSyncTrees,
    syncStats,
    profile: user, // El perfil es el mismo usuario
    retryInitialization: checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
