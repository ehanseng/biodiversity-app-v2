// Servicio para conectar con la API de MySQL
class MySQLService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = null;
  }

  // Configurar token de autenticación
  setToken(token) {
    this.token = token;
  }

  // Método genérico para hacer requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 [MySQLService] ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ [MySQLService] Error en ${endpoint}:`, error);
      throw error;
    }
  }

  // === AUTENTICACIÓN ===
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.token) {
      this.setToken(data.token);
      // Guardar token en localStorage
      localStorage.setItem('@biodiversity_token', data.token);
    }

    return data;
  }

  async register(userData) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyToken() {
    return await this.request('/auth/verify');
  }

  // === REGISTROS DE BIODIVERSIDAD ===
  async getAllRecords(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.user_id) params.append('user_id', filters.user_id);

    const queryString = params.toString();
    const endpoint = `/records${queryString ? `?${queryString}` : ''}`;
    
    return await this.request(endpoint);
  }

  async getRecord(id) {
    return await this.request(`/records/${id}`);
  }

  async createRecord(recordData) {
    return await this.request('/records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  async updateRecord(id, recordData) {
    return await this.request(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  }

  async deleteRecord(id) {
    return await this.request(`/records/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats(userId = null) {
    const params = userId ? `?user_id=${userId}` : '';
    return await this.request(`/records/stats/summary${params}`);
  }

  // === USUARIOS ===
  async getUsers() {
    return await this.request('/users');
  }

  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  // === MÉTODOS DE COMPATIBILIDAD CON LOCALSTORAGE ===
  
  // Migrar datos de localStorage a MySQL
  async migrateFromLocalStorage() {
    try {
      console.log('🔄 [MySQLService] Iniciando migración desde localStorage...');
      
      // Obtener datos locales
      const localTreesData = localStorage.getItem('@biodiversity_trees');
      if (!localTreesData) {
        console.log('📋 [MySQLService] No hay datos locales para migrar');
        return { success: true, migrated: 0 };
      }

      const localTrees = JSON.parse(localTreesData);
      console.log(`📊 [MySQLService] Encontrados ${localTrees.length} registros locales`);

      let migrated = 0;
      let errors = 0;

      for (const tree of localTrees) {
        try {
          // Convertir formato local a formato API
          const recordData = {
            user_id: tree.user_id || 1, // Usuario por defecto
            type: tree.type || 'flora',
            common_name: tree.common_name,
            scientific_name: tree.scientific_name,
            description: tree.description,
            latitude: tree.latitude,
            longitude: tree.longitude,
            location_description: tree.location_description,
            height_meters: tree.height_meters,
            diameter_cm: tree.diameter_cm,
            health_status: tree.health_status,
            animal_class: tree.animal_class,
            habitat: tree.habitat,
            behavior: tree.behavior,
            image_url: tree.image_url,
          };

          await this.createRecord(recordData);
          migrated++;
          console.log(`✅ [MySQLService] Migrado: ${tree.common_name}`);
        } catch (error) {
          errors++;
          console.error(`❌ [MySQLService] Error migrando ${tree.common_name}:`, error.message);
        }
      }

      console.log(`🎉 [MySQLService] Migración completada: ${migrated} exitosos, ${errors} errores`);
      
      return {
        success: true,
        migrated,
        errors,
        total: localTrees.length
      };
    } catch (error) {
      console.error('❌ [MySQLService] Error en migración:', error);
      return { success: false, error: error.message };
    }
  }

  // Sincronizar con localStorage (para compatibilidad)
  async syncWithLocalStorage() {
    try {
      console.log('🔄 [MySQLService] Sincronizando con localStorage...');
      
      // Obtener todos los registros de MySQL
      const records = await this.getAllRecords();
      
      // Convertir a formato localStorage
      const localFormat = records.map(record => ({
        id: `mysql_${record.id}`,
        common_name: record.common_name,
        scientific_name: record.scientific_name,
        description: record.description,
        latitude: record.latitude,
        longitude: record.longitude,
        location_description: record.location_description,
        height_meters: record.height_meters,
        diameter_cm: record.diameter_cm,
        health_status: record.health_status,
        animal_class: record.animal_class,
        habitat: record.habitat,
        behavior: record.behavior,
        image_url: record.image_url,
        type: record.type,
        status: record.status,
        syncStatus: record.status, // Mapear status a syncStatus
        user_id: record.user_id,
        created_at: record.created_at,
        createdAt: record.created_at,
        source: 'mysql'
      }));

      // Guardar en localStorage
      localStorage.setItem('@biodiversity_trees_mysql', JSON.stringify(localFormat));
      console.log(`✅ [MySQLService] ${localFormat.length} registros sincronizados con localStorage`);
      
      return localFormat;
    } catch (error) {
      console.error('❌ [MySQLService] Error sincronizando:', error);
      throw error;
    }
  }

  // Inicializar token desde localStorage
  initializeFromStorage() {
    const token = localStorage.getItem('@biodiversity_token');
    if (token) {
      this.setToken(token);
      console.log('🔑 [MySQLService] Token cargado desde localStorage');
    }
  }

  // Limpiar autenticación
  logout() {
    this.token = null;
    localStorage.removeItem('@biodiversity_token');
    console.log('👋 [MySQLService] Sesión cerrada');
  }
}

// Exportar instancia singleton
const mySQLService = new MySQLService();
mySQLService.initializeFromStorage();

export default mySQLService;
