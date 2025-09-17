import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const AddAnimalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    common_name: '',
    scientific_name: '',
    description: '',
    latitude: '',
    longitude: '',
    location_description: '',
    habitat: '',
    behavior_notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.common_name.trim()) {
      Alert.alert('Error', 'El nombre común es requerido');
      return;
    }

    setLoading(true);
    try {
      const animalData = {
        user_id: user.id,
        common_name: formData.common_name.trim(),
        scientific_name: formData.scientific_name.trim() || null,
        description: formData.description.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        location_description: formData.location_description.trim() || null,
        habitat: formData.habitat.trim() || null,
        behavior_notes: formData.behavior_notes.trim() || null,
      };

      const { error } = await supabase
        .from('animals')
        .insert([animalData]);

      if (error) throw error;

      Alert.alert(
        'Éxito', 
        'Animal registrado correctamente. Será revisado por científicos.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding animal:', error);
      Alert.alert('Error', 'No se pudo registrar el animal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>🦋 Registrar Animal</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Común *</Text>
          <TextInput
            style={styles.input}
            value={formData.common_name}
            onChangeText={(value) => handleInputChange('common_name', value)}
            placeholder="Ej: Colibrí, Mariposa Monarca, Quetzal"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Científico</Text>
          <TextInput
            style={styles.input}
            value={formData.scientific_name}
            onChangeText={(value) => handleInputChange('scientific_name', value)}
            placeholder="Ej: Hylocharis leucotis"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Describe las características del animal..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Latitud</Text>
            <TextInput
              style={styles.input}
              value={formData.latitude}
              onChangeText={(value) => handleInputChange('latitude', value)}
              placeholder="19.4326"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Longitud</Text>
            <TextInput
              style={styles.input}
              value={formData.longitude}
              onChangeText={(value) => handleInputChange('longitude', value)}
              placeholder="-99.1332"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ubicación</Text>
          <TextInput
            style={styles.input}
            value={formData.location_description}
            onChangeText={(value) => handleInputChange('location_description', value)}
            placeholder="Ej: Jardín Botánico UNAM"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hábitat</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.habitat}
            onChangeText={(value) => handleInputChange('habitat', value)}
            placeholder="Describe el hábitat donde se encontró..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notas de Comportamiento</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.behavior_notes}
            onChangeText={(value) => handleInputChange('behavior_notes', value)}
            placeholder="Describe el comportamiento observado..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Ionicons name="bug" size={20} color="#ffffff" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Registrando...' : 'Registrar Animal'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#8b4513',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5016',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddAnimalScreen;
