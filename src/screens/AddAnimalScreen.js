import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Image, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
// Supabase removido - usando sistema simple
import { useAuth } from '../contexts/NewAuthContext';
import DynamicMapView from '../components/DynamicMapView';

const AddAnimalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    common_name: '',
    scientific_name: '',
    animal_class: '',
    description: '',
    latitude: '',
    longitude: '',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const scrollViewRef = useRef(null);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación.');
      setGettingLocation(false);
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    updateFormData('latitude', location.coords.latitude.toFixed(6));
    updateFormData('longitude', location.coords.longitude.toFixed(6));
    setGettingLocation(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    let { error: uploadError } = await supabase.storage
      .from('animals-images') // Bucket para animales
      .upload(filePath, blob, { contentType: `image/${fileExt}` });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('animals-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!formData.common_name.trim() || !formData.latitude || !formData.longitude) {
      Alert.alert('Error', 'Nombre común y ubicación son requeridos.');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const animalData = {
        user_id: user.id,
        common_name: formData.common_name.trim(),
        scientific_name: formData.scientific_name.trim() || null,
        animal_class: formData.animal_class.trim() || null,
        description: formData.description.trim() || null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        image_url: imageUrl,
        approval_status: 'pending',
      };

      const { error } = await supabase.from('animals').insert([animalData]);
      if (error) throw error;

      Alert.alert('¡Éxito!', 'Animal registrado y pendiente de aprobación.');
      navigation.goBack();

    } catch (error) {
      console.error('Error al registrar animal:', error);
      Alert.alert('Error', 'No se pudo registrar el animal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Registrar Animal</Text>
        </View>
        <View style={styles.form}>
          {/* Campos del formulario */}
          <Text style={styles.label}>Nombre Común *</Text>
          <TextInput style={styles.input} value={formData.common_name} onChangeText={v => updateFormData('common_name', v)} placeholder="Ej: Colibrí" />
          
          <Text style={styles.label}>Nombre Científico</Text>
          <TextInput style={styles.input} value={formData.scientific_name} onChangeText={v => updateFormData('scientific_name', v)} placeholder="Ej: Trochilidae" />

          <Text style={styles.label}>Clase</Text>
          <TextInput style={styles.input} value={formData.animal_class} onChangeText={v => updateFormData('animal_class', v)} placeholder="Ej: Ave, Mamífero, Reptil" />

          <Text style={styles.label}>Descripción</Text>
          <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={v => updateFormData('description', v)} multiline />

          {/* Botón de Imagen */}
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="#2d5016" />
            <Text style={styles.imagePickerButtonText}>Seleccionar Foto</Text>
          </TouchableOpacity>
          {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

          {/* Ubicación con Mapa Nativo */}
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation} disabled={gettingLocation}>
            <Text style={styles.submitButtonText}>{gettingLocation ? 'Obteniendo...' : 'Obtener Ubicación Actual'}</Text>
          </TouchableOpacity>
          {formData.latitude && formData.longitude && (
             <View style={styles.mapContainer}>
               <DynamicMapView
                 style={styles.map}
                 initialRegion={{
                   latitude: parseFloat(formData.latitude),
                   longitude: parseFloat(formData.longitude),
                   latitudeDelta: 0.01,
                   longitudeDelta: 0.01,
                 }}
                 markerCoordinate={{
                   latitude: parseFloat(formData.latitude),
                   longitude: parseFloat(formData.longitude),
                 }}
                 onMarkerDragEnd={(e) => {
                   const { latitude, longitude } = e.nativeEvent.coordinate;
                   updateFormData('latitude', latitude.toFixed(6));
                   updateFormData('longitude', longitude.toFixed(6));
                 }}
               />
             </View>
           )}
          {/* Botón de Enviar */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitButtonText}>{loading ? 'Guardando...' : 'Registrar Animal'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Estilos (similares a AddTreeScreen, puedes copiarlos y adaptarlos)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { paddingBottom: 100 },
  header: { backgroundColor: '#2d5016', padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#2d5016', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  imagePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9ecef', padding: 12, borderRadius: 8, justifyContent: 'center', marginBottom: 15 },
  imagePickerButtonText: { marginLeft: 10, fontSize: 16, color: '#2d5016' },
  imagePreview: { width: '100%', height: 200, borderRadius: 8, marginTop: 15, marginBottom: 15 },
  locationButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  submitButton: { backgroundColor: '#2d5016', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AddAnimalScreen;
