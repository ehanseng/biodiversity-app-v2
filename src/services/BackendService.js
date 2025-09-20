// Backend API Service - Reemplaza Supabase
class BackendService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = null;
  }

  // Configurar token de autenticación
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  // Obtener token guardado
  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  // Hacer petición HTTP con manejo de errores
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Si hay FormData, no establecer Content-Type (se establece automáticamente)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      console.log(`🌐 [BackendService] ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [BackendService] Response:`, data);
      return data;

    } catch (error) {
      console.error(`❌ [BackendService] Error:`, error);
      throw error;
    }
  }

  // Autenticación
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.setToken(null);
    return { success: true };
  }

  async verifyToken() {
    try {
      const response = await this.request('/auth/verify');
      return response;
    } catch (error) {
      this.setToken(null);
      throw error;
    }
  }

  // Gestión de usuarios
  async getProfile() {
    return await this.request('/users/profile');
  }

  async getStats() {
    return await this.request('/users/stats');
  }

  // Gestión de árboles
  async createTree(treeData, imageFile = null) {
    const formData = new FormData();
    
    // Agregar datos del árbol
    Object.keys(treeData).forEach(key => {
      if (treeData[key] !== null && treeData[key] !== undefined) {
        formData.append(key, treeData[key]);
      }
    });
    
    // Agregar imagen si existe
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return await this.request('/trees', {
      method: 'POST',
      body: formData,
    });
  }

  async getTrees(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/trees?${queryString}` : '/trees';
    return await this.request(endpoint);
  }

  async getUserTrees(userId) {
    return await this.request(`/trees/user/${userId}`);
  }

  async updateTreeStatus(treeId, status, notes = '') {
    return await this.request(`/trees/${treeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, scientist_notes: notes }),
    });
  }

  // Utilidades
  getImageUrl(imagePath) {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath}`;
  }

  // Verificar conexión
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('❌ Backend no disponible:', error);
      throw new Error('Backend no disponible');
    }
  }
}

// Instancia singleton
const backendService = new BackendService();

export default backendService;
