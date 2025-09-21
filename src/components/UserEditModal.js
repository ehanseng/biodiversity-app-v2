import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UserEditModal = ({ 
  visible, 
  user, 
  onClose, 
  onSave, 
  loading = false 
}) => {
  const [editedUser, setEditedUser] = useState({
    email: '',
    full_name: '',
    role: 'explorer'
  });

  const roles = [
    { value: 'explorer', label: '🌱 Explorador', description: 'Puede registrar plantas y animales' },
    { value: 'scientist', label: '🔬 Científico', description: 'Puede aprobar/rechazar registros' },
    { value: 'admin', label: '⚙️ Administrador', description: 'Acceso completo al sistema' }
  ];

  useEffect(() => {
    if (user) {
      setEditedUser({
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || 'explorer'
      });
    }
  }, [user]);

  const handleSave = () => {
    if (!editedUser.email.trim()) {
      Alert.alert('Error', 'El email es requerido');
      return;
    }

    if (!editedUser.full_name.trim()) {
      Alert.alert('Error', 'El nombre completo es requerido');
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedUser.email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    onSave(editedUser);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'scientist': return '#007bff';
      case 'explorer': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>✏️ Editar Usuario</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📧 Email</Text>
              <TextInput
                style={styles.input}
                value={editedUser.email}
                onChangeText={(text) => setEditedUser(prev => ({ ...prev, email: text }))}
                placeholder="usuario@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Nombre completo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>👤 Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={editedUser.full_name}
                onChangeText={(text) => setEditedUser(prev => ({ ...prev, full_name: text }))}
                placeholder="Nombre completo del usuario"
                editable={!loading}
              />
            </View>

            {/* Rol */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🎭 Rol del Usuario</Text>
              <Text style={styles.roleDescription}>
                Selecciona el nivel de acceso para este usuario
              </Text>
              
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleOption,
                    editedUser.role === role.value && styles.roleOptionSelected,
                    { borderColor: getRoleColor(role.value) }
                  ]}
                  onPress={() => setEditedUser(prev => ({ ...prev, role: role.value }))}
                  disabled={loading}
                >
                  <View style={styles.roleOptionContent}>
                    <Text style={[
                      styles.roleLabel,
                      editedUser.role === role.value && styles.roleLabelSelected
                    ]}>
                      {role.label}
                    </Text>
                    <Text style={[
                      styles.roleDescriptionText,
                      editedUser.role === role.value && styles.roleDescriptionSelected
                    ]}>
                      {role.description}
                    </Text>
                  </View>
                  {editedUser.role === role.value && (
                    <Ionicons name="checkmark-circle" size={24} color={getRoleColor(role.value)} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Información adicional */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>ℹ️ Información del Usuario</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>ID:</Text> {user.id}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Registrado:</Text> {new Date(user.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Árboles:</Text> {user.trees_count || 0}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Animales:</Text> {user.animals_count || 0}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Estado:</Text> {user.is_active ? '✅ Activo' : '❌ Inactivo'}
              </Text>
            </View>
          </ScrollView>

          {/* Botones */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>💾 Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  roleOptionSelected: {
    backgroundColor: '#f0f8f0',
  },
  roleOptionContent: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  roleLabelSelected: {
    color: '#2d5016',
  },
  roleDescriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  roleDescriptionSelected: {
    color: '#2d5016',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2d5016',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserEditModal;
