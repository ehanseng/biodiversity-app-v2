import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Image, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MobileImagePicker from '../components/MobileImagePicker';
// Supabase removido - usando sistema simple
import { useAuth } from '../contexts/SimpleAuthContext';
import SimpleAnimalService from '../services/SimpleAnimalService';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';
import DynamicMapView from '../components/DynamicMapView';
import webNotifications from '../utils/WebNotifications';

const AddAnimalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
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
  const [showMap, setShowMap] = useState(false);
  const scrollViewRef = useRef(null);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      if (Platform.OS === 'web' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            updateFormData('latitude', lat);
            updateFormData('longitude', lng);
            setShowMap(true);
            
            // Mostrar notificación de éxito
            showNotification(
              '📍 Ubicación obtenida',
              `GPS: ${lat}, ${lng}`,
              'success'
            );
            
            setGettingLocation(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            showNotification(
              '❌ Error GPS',
              'No se pudo obtener la ubicación',
              'error'
            );
            setGettingLocation(false);
          }
        );
      } else {
        // Usar expo-location para móvil
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación.');
          setGettingLocation(false);
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude.toFixed(6);
        const lng = location.coords.longitude.toFixed(6);
        updateFormData('latitude', lat);
        updateFormData('longitude', lng);
        setShowMap(true);

        // Mostrar notificación de éxito
        showNotification(
          '📍 Ubicación GPS obtenida',
          `Coordenadas: ${lat}, ${lng}`,
          'success'
        );
        
        setGettingLocation(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      showNotification(
        '❌ Error GPS',
        'No se pudo obtener la ubicación',
        'error'
      );
      setGettingLocation(false);
    }
  };

  const pickImage = async () => {
    // En la web, el navegador maneja la elección entre cámara y galería
    if (Platform.OS === 'web') {
      pickFromGallery();
      return;
    }

    // En móvil, dar la opción al usuario
    Alert.alert(
      'Seleccionar Imagen',
      '¿Desde dónde quieres obtener la foto?',
      [
        {
          text: 'Cámara',
          onPress: () => takePhoto(),
        },
        {
          text: 'Galería',
          onPress: () => pickFromGallery(),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhoto = async () => {
    // Solo usar MobileImagePicker en móvil web, en desktop usar lógica original
    if (Platform.OS === 'web' && MobileImagePicker.isMobileWeb()) {
      try {
        const result = await MobileImagePicker.takePhoto();
        
        if (result) {
          const imageUri = result.uri;
          console.log('📸 [takePhoto] Imagen capturada (móvil web):', imageUri.substring(0, 50) + '...');
          setImage(imageUri);
          showNotification('Foto capturada', 'La foto se ha capturado correctamente', 'success');
        }
      } catch (error) {
        console.error('❌ [takePhoto] Error:', error);
        showNotification('Error', 'No se pudo capturar la foto', 'error');
      }
      return;
    }

    // Lógica original para desktop y app nativa
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara para tomar una foto.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      
      if (Platform.OS === 'web' && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        console.log('📸 [takePhoto] Imagen base64 generada para web:', base64Image.substring(0, 50) + '...');
        setImage(base64Image);
      } else {
        console.log('📸 [takePhoto] Usando URI nativa:', imageUri);
        setImage(imageUri);
      }
    }
  };

  const pickFromGallery = async () => {
    // Solo usar MobileImagePicker en móvil web, en desktop usar lógica original
    if (Platform.OS === 'web' && MobileImagePicker.isMobileWeb()) {
      try {
        const result = await MobileImagePicker.pickFromGallery();
        
        if (result) {
          const imageUri = result.uri;
          console.log('🖼️ [pickFromGallery] Imagen seleccionada (móvil web):', imageUri.substring(0, 50) + '...');
          setImage(imageUri);
          showNotification('Imagen seleccionada', 'La imagen se ha seleccionado correctamente', 'success');
        }
      } catch (error) {
        console.error('❌ [pickFromGallery] Error:', error);
        showNotification('Error', 'No se pudo seleccionar la imagen', 'error');
      }
      return;
    }

    // Lógica original para desktop y app nativa
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para seleccionar una foto.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      
      if (Platform.OS === 'web' && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        console.log('🖼️ [pickFromGallery] Imagen base64 generada para web:', base64Image.substring(0, 50) + '...');
        setImage(base64Image);
      } else {
        console.log('🖼️ [pickFromGallery] Usando URI nativa:', imageUri);
        setImage(imageUri);
      }
    }
  };

  // Función helper para mostrar notificaciones tanto en app como en navegador
  const showNotification = (title, body, type = 'success') => {
    // Mostrar toast en la app
    if (type === 'success') {
      showSuccess(title);
    } else if (type === 'error') {
      showError(title);
    } else if (type === 'warning') {
      showWarning(title);
    }

    // Mostrar notificación nativa en web
    if (Platform.OS === 'web') {
      if (type === 'success') {
        webNotifications.showSuccess(title, body);
      } else if (type === 'error') {
        webNotifications.showError(title, body);
      } else if (type === 'warning') {
        webNotifications.showWarning(title, body);
      }
    }
  };

  const uploadImage = async (uri) => {
    try {
      console.log('🚀 [AddAnimalScreen] Simulando subida de imagen:', uri);
      
      // Simular delay de subida
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generar URL mock para la imagen
      const fileName = `animal_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const mockUrl = `https://mock-storage.example.com/animals/${fileName}`;
      
      console.log('✅ [AddAnimalScreen] Imagen "subida" exitosamente (mock):', mockUrl);
      showNotification('✅ Imagen procesada exitosamente', '', 'success');
      
      return mockUrl;
    } catch (error) {
      console.error('❌ [AddAnimalScreen] Error al subir imagen:', error);
      
      // Mostrar error específico al usuario
      let userMessage = 'Error al subir la imagen';
      if (error.message?.includes('almacenamiento')) {
        userMessage = 'Problema con el almacenamiento de imágenes';
      } else if (error.message?.includes('conexión') || error.message?.includes('network')) {
        userMessage = 'Problema de conexión. Verifica tu internet';
      } else if (error.message?.includes('bucket') || error.message?.includes('Bucket')) {
        userMessage = 'Servicio de imágenes no disponible temporalmente';
      }
      
      showError(`${userMessage}: ${error.message}`);
      return null;
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 [AddAnimalScreen] Iniciando handleSubmit...');
    console.log('🚀 [AddAnimalScreen] FormData:', formData);
    
    if (!formData.common_name.trim()) {
      Alert.alert('Error', 'El nombre común es requerido');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Error', 'Las coordenadas son requeridas. Usa el botón GPS para obtener tu ubicación.');
      return;
    }

    setLoading(true);
    console.log('🚀 [AddAnimalScreen] Iniciando guardado...');
    
    try {
      // Preparar datos del animal
      const animalData = {
        user_id: user?.id || 1, // ID del usuario logueado
        common_name: formData.common_name.trim(),
        scientific_name: formData.scientific_name.trim() || null,
        animal_class: formData.animal_class.trim() || null,
        description: formData.description.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        image_url: image || null, // Incluir la imagen seleccionada
      };

      console.log('📸 [AddAnimalScreen] Imagen incluida en animalData:', image ? image.substring(0, 50) + '...' : 'Sin imagen');

      console.log('🚀 [AddAnimalScreen] AnimalData preparado:', animalData);
      
      // Usar el servicio simple que solo usa MySQL remoto
      const animalService = new SimpleAnimalService();
      const createdAnimal = await animalService.createAnimal(animalData);
      
      console.log('✅ [AddAnimalScreen] Animal creado exitosamente:', createdAnimal);
      showSuccess('¡Animal registrado exitosamente!');
      
      // Emitir evento para actualizar listas
      console.log('📡 [AddAnimalScreen] Emitiendo evento ANIMAL_CREATED:', createdAnimal);
      eventEmitter.emit(EVENTS.ANIMAL_CREATED, createdAnimal);
      console.log('📡 [AddAnimalScreen] Evento ANIMAL_CREATED emitido');
      
      // Mostrar notificación de éxito
      showNotification(
        '🦋 Animal registrado',
        `${formData.common_name} ha sido registrado exitosamente`,
        'success'
      );
      
      // Navegar de vuelta después de un breve delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (error) {
      console.error('❌ [AddAnimalScreen] Error completo al guardar animal:', error);
      
      // Mostrar notificación de error
      showNotification(
        '❌ Error al guardar',
        `No se pudo guardar el animal: ${error.message || 'Error desconocido'}`,
        'error'
      );
      
      Alert.alert(
        'Error', 
        `No se pudo guardar el animal: ${error.message || 'Error desconocido'}`
      );
    } finally {
      setLoading(false);
      console.log('🚀 [AddAnimalScreen] handleSubmit completado');
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

          {/* Sección de Ubicación */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📍 Ubicación *</Text>
            
            {/* Botón GPS */}
            <TouchableOpacity 
              style={[styles.gpsButton, gettingLocation && styles.gpsButtonDisabled]} 
              onPress={getCurrentLocation} 
              disabled={gettingLocation}
            >
              <Ionicons name="location" size={20} color="#ffffff" />
              <Text style={styles.gpsButtonText}>
                {gettingLocation ? 'Obteniendo ubicación...' : '📍 Obtener ubicación GPS'}
              </Text>
            </TouchableOpacity>

            {/* Campos de coordenadas editables */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.subLabel}>Latitud</Text>
                <TextInput
                  style={styles.input}
                  value={formData.latitude}
                  onChangeText={(value) => updateFormData('latitude', value)}
                  placeholder="Ej: 4.6097"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.subLabel}>Longitud</Text>
                <TextInput
                  style={styles.input}
                  value={formData.longitude}
                  onChangeText={(value) => updateFormData('longitude', value)}
                  placeholder="Ej: -74.0817"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Mapa interactivo */}
            {showMap && formData.latitude && formData.longitude && (
              <View style={styles.mapContainer}>
                <Text style={styles.mapLabel}>📍 Ubicación en el mapa (arrastra el pin para ajustar)</Text>
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
          </View>
          {/* Botón de Enviar */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitButtonText}>{loading ? 'Guardando...' : 'Registrar Animal'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100vh', 
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 100, 
  },
  header: {
    backgroundColor: '#2d5016',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    marginBottom: 5,
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
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#2d5016',
    borderStyle: 'dashed',
  },
  imagePickerButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2d5016',
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#28a745',
  },
  gpsButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  gpsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapLabel: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  map: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#2d5016',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddAnimalScreen;
