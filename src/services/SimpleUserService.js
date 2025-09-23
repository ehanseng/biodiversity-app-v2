// Servicio SIMPLE para usuarios - SOLO MySQL remoto
class SimpleUserService {
  constructor() {
    this.baseURL = 'https://explora.ieeetadeo.org';
  }

  // Crear usuario (registro)
  async createUser(userData) {
    try {
      console.log('🆕 [SimpleUserService] Registrando usuario:', userData.email);
      
      const response = await fetch(`${this.baseURL}/simple-register-endpoint-v2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name || userData.email,
          role: userData.role || 'explorer'
        })
      });

      if (!response.ok) {
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no puede leer JSON, usar mensaje genérico
        }
        
        if (response.status === 409) {
          throw new Error('El email ya está registrado');
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('El servidor devolvió una respuesta vacía');
      }

      const result = JSON.parse(responseText);
      console.log('✅ [SimpleUserService] Usuario registrado:', result.email);
      return result;
      
    } catch (error) {
      console.error('❌ [SimpleUserService] Error en registro:', error.message);
      throw error;
    }
  }

  // Login de usuario
  async loginUser(email, password) {
    try {
      console.log('🔍 [SimpleUserService] Haciendo login:', email);
      
      const response = await fetch(`https://explora.ieeetadeo.org/simple-login-endpoint.php`, {
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
        let errorMessage = `Error HTTP: ${response.status}`;
        
        // Intentar obtener el mensaje de error del servidor
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Si no puede leer JSON, usar mensaje por defecto
          if (response.status === 401) {
            errorMessage = 'El email o la contraseña son incorrectos. Por favor verifica tus datos e intenta nuevamente.';
          }
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('El servidor devolvió una respuesta vacía');
      }

      const user = JSON.parse(responseText);
      console.log('✅ [SimpleUserService] Login exitoso:', user.email);
      return user;
      
    } catch (error) {
      console.error('❌ [SimpleUserService] Error en login:', error.message);
      throw error;
    }
  }

  // Obtener todos los usuarios (para debug)
  async getAllUsers() {
    try {
      const response = await fetch(`${this.baseURL}/users`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ [SimpleUserService] Error obteniendo usuarios:', error);
      throw error;
    }
  }
}

export default SimpleUserService;
