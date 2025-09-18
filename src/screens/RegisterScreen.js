import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'explorer',
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    console.log('--- BOTÓN CREAR CUENTA PRESIONADO ---');
    const { email, password, confirmPassword, fullName, role } = formData;

    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, {
      full_name: fullName,
      role: role,
    });

    if (error) {
      Alert.alert('Error de registro', error.message);
    } else {
      Alert.alert(
        'Registro exitoso',
        'Tu cuenta ha sido creada. Por favor verifica tu correo electrónico.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
    setLoading(false);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const RoleSelector = () => (
    <View style={styles.roleContainer}>
      <Text style={styles.roleLabel}>Selecciona tu rol:</Text>
      
      <TouchableOpacity
        style={[
          styles.roleButton,
          formData.role === 'explorer' && styles.roleButtonSelected
        ]}
        onPress={() => updateFormData('role', 'explorer')}
      >
        <Text style={[
          styles.roleButtonText,
          formData.role === 'explorer' && styles.roleButtonTextSelected
        ]}>
          🌱 Explorador - Recolectar datos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.roleButton,
          formData.role === 'scientist' && styles.roleButtonSelected
        ]}
        onPress={() => updateFormData('role', 'scientist')}
      >
        <Text style={[
          styles.roleButtonText,
          formData.role === 'scientist' && styles.roleButtonTextSelected
        ]}>
          🔬 Científico - Validar datos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.roleButton,
          formData.role === 'admin' && styles.roleButtonSelected
        ]}
        onPress={() => updateFormData('role', 'admin')}
      >
        <Text style={[
          styles.roleButtonText,
          formData.role === 'admin' && styles.roleButtonTextSelected
        ]}>
          ⚙️ Administrador - Gestión completa
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>🌳 Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a la comunidad de biodiversidad</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={formData.fullName}
              onChangeText={(value) => updateFormData('fullName', value)}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
            />

            <RoleSelector />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta? Inicia sesión aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2d5016',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 10,
    fontWeight: '500',
  },
  roleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  roleButtonSelected: {
    borderColor: '#2d5016',
    backgroundColor: '#f8f9fa',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  roleButtonTextSelected: {
    color: '#2d5016',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2d5016',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#2d5016',
    fontSize: 14,
  },
});

export default RegisterScreen;
