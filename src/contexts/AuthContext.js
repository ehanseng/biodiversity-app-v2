import React, { createContext, useState, useContext, useEffect } from 'react';
import backendService from '../services/BackendService';
// import { supabase } from '../config/supabase'; // Comentado - ya no usamos Supabase
// import TreeStorageService from '../services/TreeStorageService'; // Comentado - usaremos el nuevo backend
import eventEmitter, { EVENTS } from '../utils/EventEmitter';

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
    // 1. Revisar la sesión UNA VEZ al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        performAutoSync(session.user.id).catch(console.warn);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios de sesión (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN') {
        setUser(session.user);
        fetchProfile(session.user.id);
        performAutoSync(session.user.id).catch(console.warn);
      }
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    console.log('📝 Iniciando fetchProfile para:', userId);
    try {
      console.log('📡 Consultando perfil en base de datos...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📊 Resultado consulta:', { hasData: !!data, hasError: !!error, errorCode: error?.code });

      if (error && error.code === 'PGRST116') {
        console.log('🆕 Creando perfil por defecto...');
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const userName = currentUser?.user_metadata?.full_name || 
                        currentUser?.email?.split('@')[0] || 
                        'Usuario';
        
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              full_name: userName,
              role: 'explorer',
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (newProfile) {
          console.log('✅ Perfil creado exitosamente');
          setProfile(newProfile);
        }
      } else if (!error) {
        console.log('✅ Perfil obtenido exitosamente');
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ Error en fetchProfile:', error);
    }
    
    console.log('🏁 Terminando fetchProfile - setLoading(false)');
    setLoading(false);
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
    if (!user) {
      console.warn('⚠️ No hay usuario para forzar sync');
      return false;
    }
    
    console.log('⚡ Forzando sincronización manual...');
    try {
      // Primero, intentar obtener árboles de la base de datos
      const dbTrees = await TreeStorageService.getTreesFromDatabase();
      console.log(`☁️ ${dbTrees.length} árboles obtenidos de la nube.`);
      
      // Luego, sincronizar los árboles locales pendientes
      const localStats = await TreeStorageService.getSyncStats();
      if (localStats.pending > 0) {
        console.log(`📤 Sincronizando ${localStats.pending} árboles locales...`);
        await TreeStorageService.syncAllPendingTrees(user.id);
      }
      
      // Finalmente, emitir evento para que la UI se actualice
      eventEmitter.emit(EVENTS.DATA_REFRESH_NEEDED);
      console.log('✅ Sincronización manual completada.');
      return true;
    } catch (error) {
      console.error('❌ Error en sincronización manual forzada:', error);
      return false;
    }
  };

  const signIn = async (email, password) => {
    console.log('🔐 Iniciando signIn con:', { email });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('📊 Resultado signIn:', { hasData: !!data, hasError: !!error, hasUser: !!data?.user });
      
      if (error) {
        console.error('❌ Error en signIn:', error);
        throw error;
      }
      
      console.log('✅ SignIn exitoso');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error en signIn:', error);
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, userData) => {
    console.log('🔄 Iniciando signUp con:', { email, userData });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role
          },
          emailRedirectTo: undefined // No redirect needed since no email confirmation
        }
      });

      console.log('📊 Resultado signUp:', { hasData: !!data, hasError: !!error, userId: data?.user?.id });

      if (error) {
        console.error('❌ Error en signUp:', error);
        throw error;
      }

      if (data.user) {
        console.log('👤 Usuario creado, verificando/creando perfil...');
        
        // Primero verificar si ya existe el perfil
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (existingProfile) {
          console.log('✅ Perfil ya existe, no es necesario crearlo');
        } else {
          console.log('🆕 Creando nuevo perfil...');
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: email,
                full_name: userData.full_name,
                role: userData.role,
                created_at: new Date().toISOString(),
              },
            ]);

          if (profileError) {
            console.error('❌ Error creando perfil:', profileError);
            throw profileError;
          }
          
          console.log('✅ Perfil creado exitosamente');
        }
      }

      console.log('✅ SignUp completado exitosamente');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error en signUp:', error);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      console.log(' Cerrando sesión...');
      
      // Cerrar sesión en Supabase
      await supabase.auth.signOut();
      
      // Limpiar estado inmediatamente
      setUser(null);
      setProfile(null);
      setSyncStats({ total: 0, pending: 0, synced: 0, errors: 0 });
      setLoading(false);
      setError(null);
      
      // Recargar página inmediatamente
      window.location.reload();
      
      return { success: true };
    } catch (error) {
      console.error(' Error:', error);
      // Forzar recarga incluso con error
      window.location.reload();
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
