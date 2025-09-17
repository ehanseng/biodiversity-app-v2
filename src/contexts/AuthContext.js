import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, clearCorruptedSession } from '../config/supabase';
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
  const [error, setError] = useState(null);
  const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, synced: 0, errors: 0 });

  useEffect(() => {
    console.log(' AuthProvider iniciando...');
    let timeoutId;
    let mounted = true;

    // Timeout para evitar loading infinito
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn(' Timeout de autenticación - forzando fin de loading');
        setLoading(false);
        setError('Timeout de autenticación. Intenta refrescar la página.');
      }
    }, 15000); // 15 segundos timeout

    const initializeAuth = async () => {
      try {
        console.log(' Obteniendo sesión inicial...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error(' Error obteniendo sesión:', sessionError);
          
          // Si hay error de sesión, intentar limpiar datos corruptos
          if (sessionError.message?.includes('invalid') || sessionError.message?.includes('expired')) {
            console.log(' Intentando limpiar sesión corrupta...');
            await clearCorruptedSession();
          }
          
          if (mounted) {
            setError('Error de sesión. Intenta iniciar sesión nuevamente.');
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          console.log(' Sesión obtenida:', session ? 'Usuario logueado' : 'Sin usuario');
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
            await performAutoSync(session.user.id);
          } else {
            setLoading(false);
          }
        }
        
      } catch (error) {
        console.error(' Error inicializando auth:', error);
        if (mounted) {
          setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
          setLoading(false);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(' Cambio de estado auth:', event);
        
        if (!mounted) return;
        
        setError(null); // Limpiar errores previos
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          await performAutoSync(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setSyncStats({ total: 0, pending: 0, synced: 0, errors: 0 });
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      console.log('👤 Obteniendo perfil para:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error obteniendo perfil:', error);
        
        // Si el perfil no existe, crear uno por defecto
        if (error.code === 'PGRST116') {
          console.log('🆕 Creando perfil por defecto...');
          
          // Obtener información del usuario autenticado
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const userEmail = currentUser?.email || 'usuario@ejemplo.com';
          const userName = currentUser?.user_metadata?.full_name || 
                          currentUser?.email?.split('@')[0] || 
                          'Usuario';
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                full_name: userName,
                role: 'explorer',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creando perfil:', createError);
            setError('Error creando perfil de usuario');
          } else {
            console.log('✅ Perfil creado exitosamente:', newProfile);
            setProfile(newProfile);
          }
        } else {
          setError('Error obteniendo perfil de usuario');
        }
      } else {
        console.log('✅ Perfil obtenido:', data?.role, data?.full_name);
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ Error inesperado obteniendo perfil:', error);
      setError('Error inesperado obteniendo perfil');
    } finally {
      setLoading(false);
    }
  };

  // Función para reintentar inicialización
  const retryInitialization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(' Reintentando inicialización...');
      await clearCorruptedSession();
      
      // Forzar nueva sesión
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error(' Error en reintento:', error);
      setError('Error al reintentar. Intenta refrescar la página.');
      setLoading(false);
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
      console.log(' Iniciando cierre de sesión...');
      
      // Limpiar estado local primero
      setUser(null);
      setProfile(null);
      setSyncStats({ total: 0, pending: 0, synced: 0, errors: 0 });
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error(' Error al cerrar sesión:', error);
        throw error;
      }
      
      console.log(' Sesión cerrada exitosamente');
      return { success: true };
    } catch (error) {
      console.error(' Error en signOut:', error);
      return { success: false, error: error.message };
    }
  };

  // Función para refrescar perfil manualmente
  const refreshProfile = async () => {
    if (!user) return;
    try {
      console.log('🔄 Refrescando perfil...');
      await fetchProfile(user.id);
    } catch (error) {
      console.error('❌ Error refrescando perfil:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    syncStats,
    signIn,
    signUp,
    signOut,
    getAllTrees,
    forceSyncTrees,
    retryInitialization,
    refreshProfile,
    performAutoSync: () => performAutoSync(user?.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
