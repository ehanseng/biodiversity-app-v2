import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../contexts/SimpleAuthContext';
import usePageTitle from '../hooks/usePageTitle';

const ProfileScreen = ({ navigation }) => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  usePageTitle('Perfil'); // Actualizar título de la página

  const handleLogout = () => {
    // Usar confirmación nativa del navegador para máxima compatibilidad
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      signOut();
    }
  };

  const handleAboutPress = () => {
    console.log('🔍 [ProfileScreen] Botón "Acerca de" presionado');
    try {
      Alert.alert(
        'Acerca de Explora Tadeo',
        'Esta es una App creada por la Rama estudiantil IEEE Tadeo en colaboración con Elaborando Futuro.\n\nVersión 1.0.0\n\n© 2024 IEEE Tadeo & Elaborando Futuro',
        [{ text: 'Cerrar', style: 'default' }]
      );
    } catch (error) {
      console.error('❌ [ProfileScreen] Error mostrando Alert:', error);
      // Fallback para web
      if (typeof window !== 'undefined') {
        window.alert('Acerca de Explora Tadeo\n\nEsta es una App creada por la Rama estudiantil IEEE Tadeo en colaboración con Elaborando Futuro.\n\nVersión 1.0.0\n\n© 2024 IEEE Tadeo & Elaborando Futuro');
      }
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Perfil" showBackButton={false} />
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color="#2d5016" />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>
          {profile?.role === 'explorer' ? '🔍 Explorador' : 
           profile?.role === 'scientist' ? '🧪 Científico' : '⚙️ Administrador'}
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#2d5016" />
          <Text style={styles.menuText}>Configuración</Text>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} 
          onPress={() => {
            console.log('👆 [ProfileScreen] TouchableOpacity "Acerca de" presionado');
            alert('Esta es una App creada por la Rama estudiantil IEEE Tadeo en colaboración con Elaborando Futuro.\n\nVersión 1.0.0\n\n© 2025 IEEE Tadeo & Elaborando Futuro');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={24} color="#2d5016" />
          <Text style={styles.menuText}>Acerca de</Text>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>

        {/* BOTÓN DE LOGOUT MEJORADO */}
        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#dc3545" />
          <Text style={[styles.menuText, styles.logoutText]}>Cerrar Sesión</Text>
          <Ionicons name="chevron-forward" size={20} color="#dc3545" />
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
  profileSection: {
    backgroundColor: '#f8f9fa',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2d5016',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  logoutText: {
    fontSize: 16,
    color: '#dc3545',
    marginLeft: 15,
    fontWeight: '500',
  },
});

export default ProfileScreen;
