import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RankingService from '../services/RankingService';

const RankingCard = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const rankingData = await RankingService.getRanking();
      console.log('🏆 [RankingCard] Datos recibidos:', rankingData);
      setRanking(rankingData || []);
    } catch (error) {
      console.error('❌ [RankingCard] Error cargando ranking:', error);
      setRanking([]); // Asegurar que sea un array vacío
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // Actualizar puntos de todos los usuarios primero
      await RankingService.updateAllPoints();
      // Luego cargar el ranking actualizado
      await loadRanking();
    } catch (error) {
      console.error('Error refrescando ranking:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getMedalIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getMedalColor = (position) => {
    switch (position) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#28a745';
    }
  };

  const displayedRanking = expanded ? ranking : ranking.slice(0, 5);

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="trophy-outline" size={24} color="#2d5016" />
          <Text style={styles.title}>Top Exploradores</Text>
        </View>
        <Text style={styles.loadingText}>Cargando ranking...</Text>
      </View>
    );
  }

  if (ranking.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="trophy-outline" size={24} color="#2d5016" />
          <Text style={styles.title}>Top Exploradores</Text>
        </View>
        <Text style={styles.emptyText}>No hay datos de ranking disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="trophy-outline" size={24} color="#2d5016" />
          <Text style={styles.title}>Top Exploradores</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh-outline" 
            size={20} 
            color={refreshing ? "#ccc" : "#2d5016"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.rankingContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {displayedRanking.map((user, index) => (
          <View key={user.id} style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <Text style={[styles.medal, { color: getMedalColor(user.position) }]}>
                {getMedalIcon(user.position)}
              </Text>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.full_name}
                </Text>
                <Text style={styles.userStats}>
                  {user.total_approved} registros aprobados
                </Text>
              </View>
            </View>
            
            <View style={styles.rankingRight}>
              <View style={styles.pointsContainer}>
                <Ionicons name="compass-outline" size={16} color="#2d5016" />
                <Text style={styles.points}>{user.explorer_points}</Text>
              </View>
              <Text style={styles.position}>#{user.position}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {ranking.length > 5 && (
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandText}>
            {expanded ? 'Ver menos' : `Ver todos (${ranking.length})`}
          </Text>
          <Ionicons 
            name={expanded ? "chevron-up-outline" : "chevron-down-outline"} 
            size={16} 
            color="#2d5016" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginLeft: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  rankingContainer: {
    maxHeight: 300,
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medal: {
    fontSize: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  userStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d5016',
    marginLeft: 4,
  },
  position: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  expandText: {
    fontSize: 14,
    color: '#2d5016',
    fontWeight: '500',
    marginRight: 4,
  },
});

export default RankingCard;
