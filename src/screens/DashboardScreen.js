import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const DashboardScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalTrees: 0,
    totalAnimals: 0,
    approvedTrees: 0,
    approvedAnimals: 0,
    pendingTrees: 0,
    pendingAnimals: 0,
    userTrees: 0,
    userAnimals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch trees stats
      const { data: allTrees } = await supabase.from('trees').select('*');
      const { data: approvedTrees } = await supabase.from('trees').select('*').eq('status', 'approved');
      const { data: pendingTrees } = await supabase.from('trees').select('*').eq('status', 'pending');
      const { data: userTrees } = await supabase.from('trees').select('*').eq('user_id', user.id);

      // Fetch animals stats
      const { data: allAnimals } = await supabase.from('animals').select('*');
      const { data: approvedAnimals } = await supabase.from('animals').select('*').eq('status', 'approved');
      const { data: pendingAnimals } = await supabase.from('animals').select('*').eq('status', 'pending');
      const { data: userAnimals } = await supabase.from('animals').select('*').eq('user_id', user.id);

      setStats({
        totalTrees: allTrees?.length || 0,
        totalAnimals: allAnimals?.length || 0,
        approvedTrees: approvedTrees?.length || 0,
        approvedAnimals: approvedAnimals?.length || 0,
        pendingTrees: pendingTrees?.length || 0,
        pendingAnimals: pendingAnimals?.length || 0,
        userTrees: userTrees?.length || 0,
        userAnimals: userAnimals?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, color = '#2d5016' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'explorer': return 'Explorador';
      case 'scientist': return 'Científico';
      case 'admin': return 'Administrador';
      default: return 'Usuario';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'explorer': return 'compass';
      case 'scientist': return 'flask';
      case 'admin': return 'shield-checkmark';
      default: return 'person';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌿 Dashboard</Text>
        <View style={styles.userInfo}>
          <Ionicons name={getRoleIcon(profile?.role)} size={20} color="#ffffff" />
          <Text style={styles.userRole}>{getRoleDisplayName(profile?.role)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>📊 Estadísticas Generales</Text>
        
        <View style={styles.statsGrid}>
          <StatCard
            icon="leaf"
            title="Total Árboles"
            value={stats.totalTrees}
            color="#2d5016"
          />
          <StatCard
            icon="bug"
            title="Total Animales"
            value={stats.totalAnimals}
            color="#8b4513"
          />
          <StatCard
            icon="checkmark-circle"
            title="Árboles Aprobados"
            value={stats.approvedTrees}
            color="#28a745"
          />
          <StatCard
            icon="checkmark-circle"
            title="Animales Aprobados"
            value={stats.approvedAnimals}
            color="#28a745"
          />
          <StatCard
            icon="time"
            title="Árboles Pendientes"
            value={stats.pendingTrees}
            color="#ffc107"
          />
          <StatCard
            icon="time"
            title="Animales Pendientes"
            value={stats.pendingAnimals}
            color="#ffc107"
          />
        </View>

        <Text style={styles.sectionTitle}>👤 Mis Contribuciones</Text>
        
        <View style={styles.statsGrid}>
          <StatCard
            icon="leaf-outline"
            title="Mis Árboles"
            value={stats.userTrees}
            color="#6f42c1"
          />
          <StatCard
            icon="bug-outline"
            title="Mis Animales"
            value={stats.userAnimals}
            color="#6f42c1"
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddTree')}
          >
            <Ionicons name="leaf" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Registrar Árbol</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate('AddAnimal')}
          >
            <Ionicons name="bug" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Registrar Animal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => navigation.navigate('AddAnimal')}
        >
          <Ionicons name="bug" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddTree')}
        >
          <Ionicons name="leaf" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2d5016',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 15,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  statIcon: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quickActions: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionButtonSecondary: {
    backgroundColor: '#8b4513',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
  },
  fab: {
    backgroundColor: '#2d5016',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
  },
  fabSecondary: {
    backgroundColor: '#8b4513',
  },
});

export default DashboardScreen;
