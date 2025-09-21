// Servicio para manejar ranking de usuarios y puntos de explorador
class RankingService {
  constructor() {
    this.baseURL = 'https://explora.ieeetadeo.org';
  }

  // Obtener ranking de usuarios (top 10)
  async getRanking() {
    try {
      console.log('🏆 [RankingService] Obteniendo ranking de usuarios');
      
      const response = await fetch(`${this.baseURL}/ranking-endpoint.php?action=ranking`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [RankingService] Ranking obtenido:', result.ranking.length, 'usuarios');
        return result.ranking;
      } else {
        throw new Error(result.error || 'Error obteniendo ranking');
      }
      
    } catch (error) {
      console.error('❌ [RankingService] Error obteniendo ranking:', error.message);
      return []; // Devolver array vacío en caso de error
    }
  }

  // Obtener estadísticas generales
  async getStats() {
    try {
      console.log('📊 [RankingService] Obteniendo estadísticas');
      
      const response = await fetch(`${this.baseURL}/ranking-endpoint.php`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [RankingService] Estadísticas obtenidas');
        return result.stats;
      } else {
        throw new Error(result.error || 'Error obteniendo estadísticas');
      }
      
    } catch (error) {
      console.error('❌ [RankingService] Error obteniendo estadísticas:', error.message);
      return null;
    }
  }

  // Actualizar puntos de un usuario específico
  async updateUserPoints(userId) {
    try {
      console.log('🔄 [RankingService] Actualizando puntos del usuario:', userId);
      
      const response = await fetch(`${this.baseURL}/ranking-endpoint.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [RankingService] Puntos actualizados:', result.points, 'puntos');
        return result;
      } else {
        throw new Error(result.error || 'Error actualizando puntos');
      }
      
    } catch (error) {
      console.error('❌ [RankingService] Error actualizando puntos:', error.message);
      throw error;
    }
  }

  // Actualizar puntos de todos los usuarios
  async updateAllPoints() {
    try {
      console.log('🔄 [RankingService] Actualizando puntos de todos los usuarios');
      
      const response = await fetch(`${this.baseURL}/ranking-endpoint.php?action=update_points`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [RankingService] Puntos actualizados para todos los usuarios');
        return result;
      } else {
        throw new Error(result.error || 'Error actualizando puntos');
      }
      
    } catch (error) {
      console.error('❌ [RankingService] Error actualizando puntos:', error.message);
      throw error;
    }
  }

  // Calcular puntos por tipo de registro
  calculatePoints(treesApproved, animalsApproved) {
    // Sistema de puntos:
    // - 10 puntos por árbol aprobado
    // - 15 puntos por animal aprobado (más difícil de encontrar)
    return (treesApproved * 10) + (animalsApproved * 15);
  }

  // Obtener medalla según posición
  getMedalIcon(position) {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  }

  // Obtener color según posición
  getMedalColor(position) {
    switch (position) {
      case 1: return '#FFD700'; // Oro
      case 2: return '#C0C0C0'; // Plata
      case 3: return '#CD7F32'; // Bronce
      default: return '#28a745'; // Verde
    }
  }
}

export default new RankingService();
