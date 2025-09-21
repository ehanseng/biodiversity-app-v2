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
import { useAuth } from '../contexts/SimpleAuthContext';

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

    console.log('📋 Datos del formulario:', { email, fullName, role, passwordLength: password.length });

    if (!email || !password || !fullName) {
      console.log('❌ Campos faltantes');
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Contraseñas no coinciden');
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      console.log('❌ Contraseña muy corta');
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    console.log('✅ Validaciones pasadas, iniciando registro...');
    setLoading(true);
    
    try {
      const result = await signUp(email, password, {
        full_name: fullName,
        role: role,
      });

      console.log('📊 Resultado del registro:', result);

      if (result.success) {
        console.log('✅ Registro exitoso');
        
        // Mostrar mensaje de éxito más claro
        Alert.alert(
          '🎉 ¡Cuenta Creada!',
          'Tu cuenta ha sido creada exitosamente. ¡Ya puedes iniciar sesión!',
          [
            { 
              text: 'Iniciar Sesión', 
              onPress: () => {
                // Limpiar formulario
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  fullName: '',
                  role: 'explorer',
                });
                navigation.navigate('Login');
              }
            }
          ]
        );
      } else {
        console.error('❌ Error en registro:', result.error);
        
        // Mostrar error más específico
        let errorMessage = 'Error desconocido';
        if (result.error?.message) {
          if (result.error.message.includes('already registered')) {
            errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
          } else if (result.error.message.includes('Invalid email')) {
            errorMessage = 'El formato del email no es válido.';
          } else if (result.error.message.includes('Password')) {
            errorMessage = 'La contraseña no cumple con los requisitos.';
          } else {
            errorMessage = result.error.message;
          }
        }
        
        Alert.alert('Error de registro', errorMessage);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.roleNote}>
          * Requiere aprobación del administrador
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
  roleNote: {
    fontSize: 11,
    color: '#ffc107',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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
