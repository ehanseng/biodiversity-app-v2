// Servicio para manejar el almacenamiento persistente de usuarios
class UserStorageService {
  constructor() {
    this.STORAGE_KEY = 'biodiversity_users';
    this.initializeDefaultUsers();
  }

  // Inicializar usuarios por defecto si no existen
  initializeDefaultUsers() {
    console.log('🔧 [UserStorageService] Verificando inicialización...');
    const existingUsers = this.getAllUsers();
    console.log('📊 [UserStorageService] Usuarios existentes:', existingUsers.length);
    
    // Verificar si el usuario erick@ieee.org existe
    const erickExists = existingUsers.some(user => user.email === 'erick@ieee.org');
    
    if (existingUsers.length === 0 || !erickExists) {
      console.log('🔧 [UserStorageService] Inicializando usuarios por defecto...');
      
      const defaultUsers = [
        {
          id: '1',
          email: 'admin@biodiversity.com',
          password: 'admin123',
          full_name: 'Administrador',
          role: 'admin',
          created_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          email: 'scientist@biodiversity.com',
          password: 'scientist123',
          full_name: 'Dr. María González',
          role: 'scientist',
          created_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '3',
          email: 'explorer@biodiversity.com',
          password: 'explorer123',
          full_name: 'Juan Explorador',
          role: 'explorer',
          created_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '4',
          email: 'visitor@biodiversity.com',
          password: 'visitor123',
          full_name: 'Ana Visitante',
          role: 'visitor',
          created_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '5',
          email: 'erick@ieee.org',
          password: 'erick123',
          full_name: 'Erick Hansen',
          role: 'admin',
          created_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      this.saveUsers(defaultUsers);
      console.log('✅ [UserStorageService] Usuarios por defecto creados');
    }
  }

  // Obtener todos los usuarios del localStorage
  getAllUsers() {
    try {
      console.log('📋 [UserStorageService] Obteniendo usuarios con clave:', this.STORAGE_KEY);
      const users = localStorage.getItem(this.STORAGE_KEY);
      console.log('📦 [UserStorageService] Datos raw obtenidos:', users);
      const parsedUsers = users ? JSON.parse(users) : [];
      console.log('👥 [UserStorageService] Usuarios parseados:', parsedUsers.length);
      return parsedUsers;
    } catch (error) {
      console.error('❌ [UserStorageService] Error obteniendo usuarios:', error);
      return [];
    }
  }

  // Guardar lista completa de usuarios
  saveUsers(users) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
      console.log(`✅ [UserStorageService] ${users.length} usuarios guardados`);
    } catch (error) {
      console.error('❌ [UserStorageService] Error guardando usuarios:', error);
    }
  }

  // Buscar usuario por email y password
  findUser(email, password) {
    const users = this.getAllUsers();
    return users.find(user => user.email === email && user.password === password);
  }

  // Buscar usuario por email
  findUserByEmail(email) {
    const users = this.getAllUsers();
    return users.find(user => user.email === email);
  }

  // Crear nuevo usuario
  createUser(userData) {
    try {
      console.log('🆕 [UserStorageService] Iniciando creación de usuario:', userData.email);
      
      // Validar datos requeridos
      if (!userData.email || !userData.password) {
        throw new Error('Email y contraseña son requeridos');
      }
      
      const users = this.getAllUsers();
      console.log('📊 [UserStorageService] Usuarios actuales antes de crear:', users.length);
      
      // Verificar si el email ya existe
      const existingUser = this.findUserByEmail(userData.email);
      if (existingUser) {
        console.log('❌ [UserStorageService] Email ya existe:', userData.email);
        throw new Error('El email ya está registrado');
      }

      // Crear nuevo usuario con validación
      const newUser = {
        id: Date.now().toString(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        full_name: userData.full_name || userData.email,
        role: userData.role || 'explorer',
        created_at: new Date().toISOString()
      };

      console.log('👤 [UserStorageService] Nuevo usuario creado:', { ...newUser, password: '***' });

      // Agregar a la lista y guardar
      users.push(newUser);
      console.log('📊 [UserStorageService] Total usuarios después de agregar:', users.length);
      
      this.saveUsers(users);
      
      // Verificar que se guardó correctamente
      const savedUsers = this.getAllUsers();
      console.log('✅ [UserStorageService] Verificación post-guardado:', savedUsers.length);

      console.log('✅ [UserStorageService] Usuario creado exitosamente:', newUser.email);
      
      // Retornar usuario sin password para seguridad
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ [UserStorageService] Error creando usuario:', error);
      throw error;
    }
  }

  // Actualizar usuario existente
  updateUser(userId, updateData) {
    try {
      const users = this.getAllUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        throw new Error('Usuario no encontrado');
      }

      // Actualizar datos (sin permitir cambiar id, email o password aquí)
      const updatedUser = {
        ...users[userIndex],
        ...updateData,
        id: users[userIndex].id, // Mantener ID original
        email: users[userIndex].email, // Mantener email original
        updated_at: new Date().toISOString()
      };

      users[userIndex] = updatedUser;
      this.saveUsers(users);

      console.log('✅ [UserStorageService] Usuario actualizado:', updatedUser.email);
      
      // Retornar usuario sin password
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ [UserStorageService] Error actualizando usuario:', error);
      throw error;
    }
  }

  // Eliminar usuario (solo para admins)
  deleteUser(userId) {
    try {
      const users = this.getAllUsers();
      const filteredUsers = users.filter(user => user.id !== userId);
      
      if (users.length === filteredUsers.length) {
        throw new Error('Usuario no encontrado');
      }

      this.saveUsers(filteredUsers);
      console.log('✅ [UserStorageService] Usuario eliminado');
      return true;
    } catch (error) {
      console.error('❌ [UserStorageService] Error eliminando usuario:', error);
      throw error;
    }
  }

  // Limpiar usuarios inválidos
  cleanInvalidUsers() {
    try {
      const users = this.getAllUsers();
      const validUsers = users.filter(user => user.email && user.password && user.id);
      
      if (validUsers.length !== users.length) {
        console.log(`🧹 [UserStorageService] Limpiando ${users.length - validUsers.length} usuarios inválidos`);
        this.saveUsers(validUsers);
        return users.length - validUsers.length;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ [UserStorageService] Error limpiando usuarios:', error);
      return 0;
    }
  }

  // Obtener estadísticas de usuarios
  getUserStats() {
    const users = this.getAllUsers();
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      scientists: users.filter(u => u.role === 'scientist').length,
      explorers: users.filter(u => u.role === 'explorer').length,
      visitors: users.filter(u => u.role === 'visitor').length
    };
  }
}

// Exportar instancia singleton
const userStorageService = new UserStorageService();
export default userStorageService;
