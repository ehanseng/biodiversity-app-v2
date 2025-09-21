import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RankingService from '../services/RankingService';

const ScientistRankingCard = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const rankingData = await RankingService.getScientistsRanking();
      console.log('🧪 [ScientistRankingCard] Datos recibidos:', rankingData);
      setRanking(rankingData || []);
    } catch (error) {
      console.error('❌ [ScientistRankingCard] Error cargando ranking:', error);
      setRanking([]); // Asegurar que sea un array vacío
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadRanking();
    } catch (error) {
      console.error('Error refrescando ranking de científicos:', error);
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
      default: return '#007bff';
    }
  };

  if (loading) {
    console.log('🧪 [ScientistRankingCard] Renderizando estado loading');
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="flask-outline" size={24} color="#007bff" />
          <Text style={styles.title}>Top 3 Científicos</Text>
        </View>
        <Text style={styles.loadingText}>Cargando ranking de científicos...</Text>
      </View>
    );
  }

  if (ranking.length === 0) {
    console.log('🧪 [ScientistRankingCard] Renderizando estado vacío');
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="flask-outline" size={24} color="#007bff" />
          <Text style={styles.title}>Top 3 Científicos</Text>
        </View>
        <Text style={styles.emptyText}>No hay datos de ranking de científicos</Text>
      </View>
    );
  }

  console.log('🧪 [ScientistRankingCard] Renderizando con datos:', ranking.length, 'científicos');
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="flask-outline" size={24} color="#007bff" />
          <Text style={styles.title}>Top 3 Científicos</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh-outline" 
            size={20} 
            color={refreshing ? "#ccc" : "#007bff"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.rankingContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {ranking.map((scientist, index) => (
          <View key={scientist.id} style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <Text style={[styles.medal, { color: getMedalColor(scientist.position) }]}>
                {getMedalIcon(scientist.position)}
              </Text>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {scientist.full_name}
                </Text>
                <Text style={styles.userStats}>
                  {scientist.trees_approved} plantas + {scientist.animals_approved} animales
                </Text>
              </View>
            </View>
            
            <View style={styles.rankingRight}>
              <View style={styles.pointsContainer}>
                <Ionicons name="flask-outline" size={16} color="#007bff" />
                <Text style={styles.points}>{scientist.scientist_points || scientist.total_approvals}</Text>
              </View>
              <Text style={styles.position}>#{scientist.position}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
    color: '#007bff',
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
    maxHeight: 200,
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
    color: '#007bff',
    marginLeft: 4,
  },
  position: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default ScientistRankingCard;
