import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { clearCorruptedSession } from '../config/supabase';

const ProfileScreen = ({ navigation }) => {
  const { user, profile, signOut, refreshProfile } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          onPress: async () => {
            try {
              console.log('🚪 Iniciando cierre de sesión directo...');
              
              // Método directo: limpiar todo y recargar
              await clearCorruptedSession();
              
              // Recargar página inmediatamente
              if (typeof window !== 'undefined') {
                console.log('🔄 Recargando página...');
                window.location.reload();
              }
            } catch (error) {
              console.error('❌ Error:', error);
              // Forzar recarga incluso con error
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const handleClearSession = () => {
    Alert.alert(
      'Limpiar Sesión',
      '¿Estás seguro? Esto cerrará tu sesión y limpiará todos los datos almacenados. Tendrás que iniciar sesión nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Usuario solicitó limpiar sesión...');
              await clearCorruptedSession();
              // Recargar la página para forzar reinicio completo
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            } catch (error) {
              console.error('❌ Error limpiando sesión:', error);
              Alert.alert('Error', 'No se pudo limpiar la sesión');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color="#ffffff" />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>
          {profile?.role === 'explorer' ? '🌱 Explorador' : 
           profile?.role === 'scientist' ? '🔬 Científico' : '⚙️ Administrador'}
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#2d5016" />
          <Text style={styles.menuText}>Configuración</Text>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color="#2d5016" />
          <Text style={styles.menuText}>Ayuda</Text>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={refreshProfile}>
          <Ionicons name="refresh-outline" size={24} color="#2d5016" />
          <Text style={styles.menuText}>Actualizar Perfil</Text>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleClearSession}>
          <Ionicons name="trash-outline" size={24} color="#dc3545" />
          <Text style={[styles.menuText, { color: '#dc3545' }]}>Limpiar Sesión</Text>
          <Ionicons name="chevron-forward" size={20} color="#dc3545" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
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

        {/* Acciones específicas por rol */}
        {(profile?.role === 'scientist' || profile?.role === 'admin') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {profile?.role === 'scientist' ? '🔬 Herramientas de Científico' : '⚙️ Herramientas de Administrador'}
            </Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ScientistApproval')}
            >
              <Ionicons name="checkmark-done-circle" size={24} color="#007bff" />
              <Text style={styles.actionButtonText}>Revisión Científica</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}
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
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2d5016',
    marginLeft: 15,
  },
});

export default ProfileScreen;
