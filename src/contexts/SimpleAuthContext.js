import React, { createContext, useContext, useState, useEffect } from 'react';
import SimpleUserService from '../services/SimpleUserService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userService = new SimpleUserService();

  // Verificar si hay usuario guardado al cargar
  useEffect(() => {
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('biodiversity_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('✅ [SimpleAuth] Usuario cargado desde localStorage:', userData.email);
        }
      } catch (error) {
        console.error('❌ [SimpleAuth] Error cargando usuario:', error);
        localStorage.removeItem('biodiversity_user');
      } finally {
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  // Login
  const signIn = async (email, password) => {
    try {
      console.log('🔐 [SimpleAuth] Iniciando login para:', email);
      setError(null);
      setLoading(true);

      const userData = await userService.loginUser(email, password);
      
      setUser(userData);
      localStorage.setItem('biodiversity_user', JSON.stringify(userData));
      
      console.log('✅ [SimpleAuth] Login exitoso:', userData.email);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ [SimpleAuth] Error en login:', error.message);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const signUp = async (email, password, additionalData = {}) => {
    try {
      console.log('📝 [SimpleAuth] Iniciando registro para:', email);
      setError(null);
      setLoading(true);

      const userData = await userService.createUser({
        email,
        password,
        full_name: additionalData.full_name || email,
        role: additionalData.role || 'explorer'
      });

      setUser(userData);
      localStorage.setItem('biodiversity_user', JSON.stringify(userData));
      
      console.log('✅ [SimpleAuth] Registro exitoso:', userData.email);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ [SimpleAuth] Error en registro:', error.message);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    try {
      console.log('🚪 [SimpleAuth] Cerrando sesión');
      setUser(null);
      setError(null);
      localStorage.removeItem('biodiversity_user');
      console.log('✅ [SimpleAuth] Sesión cerrada');
      return { success: true };
    } catch (error) {
      console.error('❌ [SimpleAuth] Error en logout:', error);
      return { success: false, error: error.message };
    }
  };

  // Obtener usuarios (para debug)
  const getAllUsers = async () => {
    try {
      return await userService.getAllUsers();
    } catch (error) {
      console.error('❌ [SimpleAuth] Error obteniendo usuarios:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    getAllUsers,
    // Compatibilidad con código existente
    session: user ? { user } : null,
    profile: user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
