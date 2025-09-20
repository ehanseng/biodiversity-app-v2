// Servicio para manejar usuarios en MySQL remoto
class UserMySQLService {
  constructor() {
    this.baseURL = 'https://explora.ieeetadeo.org/biodiversity-app.php/api';
  }

  getStoredURL() {
    try {
      return localStorage.getItem('mysql_server_url');
    } catch (error) {
      console.warn('⚠️ [UserMySQLService] No se pudo obtener URL almacenada:', error);
      return null;
    }
  }

  // Crear usuario en MySQL
  async createUser(userData) {
    try {
      console.log('🆕 [UserMySQLService] Creando usuario en MySQL:', userData.email);
      
      // Usar endpoint simplificado para registro
      const response = await fetch(`https://explora.ieeetadeo.org/simple-register-endpoint.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password, // El servidor se encarga del hash
          full_name: userData.full_name || userData.email,
          role: userData.role || 'explorer'
        })
      });

      if (!response.ok) {
        console.log('❌ [UserMySQLService] Respuesta no exitosa:', response.status, response.statusText);
        
        // Intentar leer el error, pero manejar respuestas vacías
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.warn('⚠️ [UserMySQLService] Respuesta de error no es JSON válido');
        }
        
        if (response.status === 409) {
          throw new Error('El email ya está registrado');
        }
        throw new Error(errorMessage);
      }

      // Intentar parsear la respuesta JSON
      let result;
      try {
        const responseText = await response.text();
        console.log('📄 [UserMySQLService] Respuesta del servidor (registro):', responseText);
        
        if (!responseText.trim()) {
          console.log('❌ [UserMySQLService] Respuesta vacía del servidor');
          throw new Error('El servidor devolvió una respuesta vacía');
        }
        
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('❌ [UserMySQLService] Error parseando JSON:', jsonError.message);
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('✅ [UserMySQLService] Usuario creado en MySQL:', result.email, 'ID:', result.id);
      return result;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ [UserMySQLService] Error de conexión al servidor MySQL');
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
      }
      console.error('❌ [UserMySQLService] Error creando usuario:', error.message);
      throw error;
    }
  }

  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      console.log('📋 [UserMySQLService] Obteniendo usuarios de MySQL...');
      
      const response = await fetch(`${this.baseURL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const users = await response.json();
      console.log('✅ [UserMySQLService] Usuarios obtenidos:', users.length);
      return users;
    } catch (error) {
      console.error('❌ [UserMySQLService] Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Buscar usuario por email y password
  async findUser(email, password) {
    try {
      console.log('🔍 [UserMySQLService] Buscando usuario:', email);
      
      const response = await fetch(`https://explora.ieeetadeo.org/biodiversity-app.php/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ [UserMySQLService] Credenciales inválidas para:', email);
          return null; // Credenciales inválidas
        }
        
        // Intentar leer el error, pero manejar respuestas vacías
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.warn('⚠️ [UserMySQLService] Respuesta de error no es JSON válido');
        }
        
        throw new Error(errorMessage);
      }

      // Intentar parsear la respuesta JSON
      let user;
      try {
        const responseText = await response.text();
        console.log('📄 [UserMySQLService] Respuesta del servidor:', responseText);
        
        if (!responseText.trim()) {
          console.log('❌ [UserMySQLService] Respuesta vacía del servidor');
          return null;
        }
        
        user = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('❌ [UserMySQLService] Error parseando JSON:', jsonError.message);
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('✅ [UserMySQLService] Usuario encontrado:', user.email, 'Rol:', user.role);
      return user;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ [UserMySQLService] Error de conexión al servidor MySQL');
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
      }
      console.error('❌ [UserMySQLService] Error buscando usuario:', error.message);
      throw error;
    }
  }

  // Verificar si un email ya existe
  async emailExists(email) {
    try {
      const response = await fetch(`${this.baseURL}/users/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.exists;
    } catch (error) {
      console.error('❌ [UserMySQLService] Error verificando email:', error);
      return false; // En caso de error, asumir que no existe
    }
  }

  // Actualizar usuario
  async updateUser(userId, userData) {
    try {
      console.log('📝 [UserMySQLService] Actualizando usuario:', userId);
      
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        console.log('❌ [UserMySQLService] Respuesta no exitosa:', response.status, response.statusText);
        
        // Intentar leer el error, pero manejar respuestas vacías
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.warn('⚠️ [UserMySQLService] Respuesta de error no es JSON válido');
        }
        
        throw new Error(errorMessage);
      }

      // Intentar parsear la respuesta JSON
      let user;
      try {
        const responseText = await response.text();
        console.log('📄 [UserMySQLService] Respuesta del servidor (registro):', responseText);
        
        if (!responseText.trim()) {
          console.log('❌ [UserMySQLService] Respuesta vacía del servidor');
          throw new Error('El servidor devolvió una respuesta vacía');
        }
        
        user = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('❌ [UserMySQLService] Error parseando JSON:', jsonError.message);
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('✅ [UserMySQLService] Usuario creado:', user.email, 'ID:', user.id);
      return user;
    } catch (error) {
      console.error('❌ [UserMySQLService] Error actualizando usuario:', error);
      throw error;
    }
  }

  // Eliminar usuario
  async deleteUser(userId) {
    try {
      console.log('🗑️ [UserMySQLService] Eliminando usuario:', userId);
      
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [UserMySQLService] Usuario eliminado:', result);
      return result;
    } catch (error) {
      console.error('❌ [UserMySQLService] Error eliminando usuario:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const userMySQLService = new UserMySQLService();
export default userMySQLService;
