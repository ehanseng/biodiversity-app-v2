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
      }
    }, 30000);

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
            // Validar integridad de la sesión
            const isValidSession = await validateSessionIntegrity(session.user);
            if (!isValidSession) {
              console.warn(' Sesión inválida detectada, limpiando...');
              await clearCorruptedSession();
              if (mounted) {
                setUser(null);
                setProfile(null);
                setLoading(false);
              }
              return;
            }
            
            await fetchProfile(session.user.id);
            // Ejecutar sincronización en paralelo sin bloquear
            performAutoSync(session.user.id).catch(error => {
              console.warn(' Sincronización falló pero no bloquea la carga:', error);
            });
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

    // Inicializar autenticación
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(' Cambio de estado auth:', event);
        
        if (!mounted) return;
        
        setError(null); // Limpiar errores previos
        
        if (event === 'SIGNED_OUT') {
          console.log(' Usuario cerró sesión - limpiando estado');
          setUser(null);
          setProfile(null);
          setSyncStats({ total: 0, pending: 0, synced: 0, errors: 0 });
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log(' Usuario autenticado:', session.user.email);
          setUser(session.user);
          await fetchProfile(session.user.id);
          // Ejecutar sincronización en paralelo sin bloquear
          performAutoSync(session.user.id).catch(error => {
            console.warn(' Sincronización falló en auth change:', error);
          });
        } else {
          console.log(' Sin sesión de usuario');
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
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      console.log(' Obteniendo perfil para:', userId);
      
      // Agregar timeout más largo para evitar problemas de conectividad
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout obteniendo perfil')), 20000); // 20 segundos en lugar de 10
      });
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log(' Ejecutando consulta de perfil...');
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);
      console.log(' Resultado de consulta:', { hasData: !!data, error: error?.message, errorCode: error?.code });

      if (error) {
        console.error(' Error obteniendo perfil:', error);
        
        // Si el perfil no existe, crear uno por defecto
        if (error.code === 'PGRST116') {
          console.log(' Creando perfil por defecto...');
          
          // Obtener información del usuario autenticado
          console.log(' Obteniendo datos del usuario actual...');
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error(' Error obteniendo usuario actual:', userError);
            throw userError;
          }
          
          console.log(' Usuario actual:', { 
            id: currentUser?.id, 
            email: currentUser?.email, 
            hasMetadata: !!currentUser?.user_metadata 
          });
          
          const userEmail = currentUser?.email || 'usuario@ejemplo.com';
          const userName = currentUser?.user_metadata?.full_name || 
                          currentUser?.email?.split('@')[0] || 
                          'Usuario';
          
          console.log(' Creando perfil con datos:', { userName, userEmail, userId });
          
          const createProfilePromise = supabase
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
          
          const { data: newProfile, error: createError } = await Promise.race([
            createProfilePromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout creando perfil')), 15000))
          ]);

          if (createError) {
            console.error(' Error creando perfil:', createError);
            setError('Error creando perfil de usuario');
          } else {
            console.log(' Perfil creado exitosamente:', newProfile);
            setProfile(newProfile);
          }
        } else {
          console.error(' Error de base de datos:', error);
          // No mostrar error si es timeout, la app sigue funcionando
          if (error.message !== 'Timeout obteniendo perfil') {
            setError('Error obteniendo perfil de usuario');
          }
        }
      } else {
        console.log(' Perfil obtenido:', data?.role, data?.full_name);
        setProfile(data);
      }
    } catch (error) {
      console.error(' Error inesperado obteniendo perfil:', error);
      if (error.message === 'Timeout obteniendo perfil' || error.message === 'Timeout creando perfil') {
        console.warn(' Timeout detectado - continuando sin bloquear la app');
        // No mostrar error al usuario si es solo timeout
      } else {
        setError('Error inesperado obteniendo perfil');
      }
    } finally {
      console.log(' Finalizando fetchProfile, setting loading to false');
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
      
      // Agregar timeout para sincronización
      const syncTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout en sincronización')), 15000);
      });
      
      const syncProcess = async () => {
        // Obtener estadísticas antes de sincronizar
        const statsBefore = await TreeStorageService.getSyncStats();
        console.log(' Stats antes de sync:', statsBefore);
        setSyncStats(statsBefore);
        
        if (statsBefore.pending > 0) {
          console.log(` Sincronizando ${statsBefore.pending} árboles pendientes...`);
          // Sincronizar árboles pendientes
          const syncResult = await TreeStorageService.syncAllPendingTrees(userId);
          
          // Actualizar estadísticas después de sincronizar
          const statsAfter = await TreeStorageService.getSyncStats();
          setSyncStats(statsAfter);
          
          console.log(` Sincronización completada: ${syncResult.successful}/${syncResult.total} árboles sincronizados`);
        } else {
          console.log(' No hay árboles pendientes para sincronizar');
        }
      };
      
      await Promise.race([syncProcess(), syncTimeout]);
      
    } catch (error) {
      console.error(' Error en sincronización automática:', error);
      if (error.message === 'Timeout en sincronización') {
        console.warn(' Timeout en sincronización - continuando sin bloquear');
      }
      // No bloquear el proceso principal si falla la sincronización
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
      
      // Limpiar estado local primero para respuesta inmediata
      setUser(null);
      setProfile(null);
      setSyncStats({ total: 0, pending: 0, synced: 0, errors: 0 });
      setLoading(false);
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error(' Error al cerrar sesión en Supabase:', error);
        // Aún así consideramos exitoso porque ya limpiamos el estado local
      }
      
      // Limpiar datos almacenados como medida adicional
      try {
        await clearCorruptedSession();
        console.log(' Datos de sesión limpiados');
      } catch (cleanError) {
        console.warn(' Error limpiando datos de sesión:', cleanError);
      }
      
      console.log(' Sesión cerrada exitosamente');
      return { success: true };
    } catch (error) {
      console.error(' Error en signOut:', error);
      // Aún así limpiar estado local
      setUser(null);
      setProfile(null);
      setSyncStats({ total: 0, pending: 0, synced: 0, errors: 0 });
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Función para refrescar perfil manualmente
  const refreshProfile = async () => {
    if (!user) return;
    try {
      console.log(' Refrescando perfil...');
      await fetchProfile(user.id);
    } catch (error) {
      console.error(' Error refrescando perfil:', error);
    }
  };

  // Función para validar integridad de sesión
  const validateSessionIntegrity = async (user) => {
    try {
      // Verificar que el usuario tenga datos básicos
      if (!user || !user.id || !user.email) {
        console.warn(' Usuario sin datos básicos');
        return false;
      }
      
      // Intentar hacer una consulta simple para verificar conectividad
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.warn(' Error de conectividad con base de datos:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(' Error validando sesión:', error);
      return false;
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
