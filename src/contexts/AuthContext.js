import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../config/supabase';
import TreeStorageService from '../services/TreeStorageService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, synced: 0, errors: 0 });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        // Iniciar sincronización automática
        performAutoSync(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          // Sincronizar cuando el usuario inicia sesión
          await performAutoSync(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setSyncStats({ total: 0, pending: 0, synced: 0, errors: 0 });
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Sincronización automática
  const performAutoSync = async (userId) => {
    try {
      console.log(' Iniciando sincronización automática...');
      
      // Obtener estadísticas antes de sincronizar
      const statsBefore = await TreeStorageService.getSyncStats();
      setSyncStats(statsBefore);
      
      if (statsBefore.pending > 0) {
        // Sincronizar árboles pendientes
        const syncResult = await TreeStorageService.syncAllPendingTrees(userId);
        
        // Actualizar estadísticas después de sincronizar
        const statsAfter = await TreeStorageService.getSyncStats();
        setSyncStats(statsAfter);
        
        console.log(` Sincronización completada: ${syncResult.successful}/${syncResult.total} árboles sincronizados`);
      }
    } catch (error) {
      console.error(' Error en sincronización automática:', error);
    }
  };

  // Función para obtener todos los árboles
  const getAllTrees = async () => {
    if (!user) return [];
    try {
      return await TreeStorageService.getAllTrees(user.id);
    } catch (error) {
      console.error(' Error obteniendo árboles:', error);
      return [];
    }
  };

  // Función para forzar sincronización manual
  const forceSyncTrees = async () => {
    if (!user) return;
    try {
      await performAutoSync(user.id);
      return true;
    } catch (error) {
      console.error(' Error en sincronización manual:', error);
      return false;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, fullName, role = 'explorer') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              role: role,
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) throw profileError;
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar estado local
      setUser(null);
      setProfile(null);
      setSyncStats({ total: 0, pending: 0, synced: 0, errors: 0 });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    profile,
    loading,
    syncStats,
    signIn,
    signUp,
    signOut,
    getAllTrees,
    forceSyncTrees,
    performAutoSync: () => performAutoSync(user?.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
