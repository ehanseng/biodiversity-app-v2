import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Image, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MobileImagePicker from '../components/MobileImagePicker';
// Supabase removido - usando sistema simple
import { useAuth } from '../contexts/SimpleAuthContext';
import SimpleTreeService from '../services/SimpleTreeService';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import eventEmitter, { EVENTS } from '../utils/EventEmitter';
import DynamicMapView from '../components/DynamicMapView';
import webNotifications from '../utils/WebNotifications';

const AddTreeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [formData, setFormData] = useState({
    common_name: '',
    scientific_name: '',
    description: '',
    latitude: '',
    longitude: '',
    location_description: '',
    height_meters: '',
    diameter_cm: '',
    health_status: '',
    image_url: null,
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [image, setImage] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);

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

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearForm = () => {
    setFormData({
      common_name: '',
      scientific_name: '',
      description: '',
      latitude: '',
      longitude: '',
      location_description: '',
      height_meters: '',
      diameter_cm: '',
      health_status: '',
      image_url: null,
    });
    setImage(null);
    setShowMap(false);
    console.log('✅ [AddTreeScreen] Formulario limpiado para nuevo árbol');
  };

  const navigateToExplorer = () => {
    console.log('🚀 [AddTreeScreen] Navegando a Explorer...');
    eventEmitter.emit(EVENTS.DATA_REFRESH_NEEDED);
    navigation.navigate('Explorer');
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
            showNotification(
              '❌ Error de ubicación',
              'No se pudo obtener la ubicación del navegador',
              'error'
            );
            setGettingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showNotification(
            '❌ Permiso denegado',
            'Se necesita permiso de ubicación para continuar',
            'error'
          );
          setGettingLocation(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const lat = currentLocation.coords.latitude.toFixed(6);
        const lng = currentLocation.coords.longitude.toFixed(6);
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

  const uploadImage = async (uri) => {
    try {
      console.log('🚀 [AddTreeScreen] Simulando subida de imagen:', uri);
      
      // Simular delay de subida
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generar URL mock para la imagen
      const fileName = `tree_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const mockUrl = `https://mock-storage.example.com/trees/${fileName}`;
      
      console.log('✅ [AddTreeScreen] Imagen "subida" exitosamente (mock):', mockUrl);
      showNotification('✅ Imagen procesada exitosamente', '', 'success');
      
      return mockUrl;

    } catch (error) {
      console.error('❌ [AddTreeScreen] Error completo al subir imagen:', error);
      
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
    console.log('🚀 [AddTreeScreen] Iniciando handleSubmit...');
    console.log('🚀 [AddTreeScreen] FormData:', formData);
    
    if (!formData.common_name.trim()) {
      Alert.alert('Error', 'El nombre común es requerido');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Error', 'Las coordenadas son requeridas. Usa el botón GPS para obtener tu ubicación.');
      return;
    }

    setLoading(true);
    console.log('🚀 [AddTreeScreen] Iniciando guardado...');
    
    try {
      // Preparar datos del árbol
      const treeData = {
        user_id: user?.id || 1, // ID del usuario logueado
        common_name: formData.common_name.trim(),
        scientific_name: formData.scientific_name.trim() || null,
        description: formData.description.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        location_description: formData.location_description.trim() || null,
        height_meters: formData.height_meters ? parseFloat(formData.height_meters) : null,
        diameter_cm: formData.diameter_cm ? parseFloat(formData.diameter_cm) : null,
        health_status: formData.health_status.trim() || null,
        image_url: image || null, // Incluir la imagen seleccionada
      };

      console.log('📸 [AddTreeScreen] Imagen incluida en treeData:', image ? image.substring(0, 50) + '...' : 'Sin imagen');

      console.log('🚀 [AddTreeScreen] TreeData preparado:', treeData);
      
      // Usar el servicio simple que solo usa MySQL remoto
      const treeService = new SimpleTreeService();
      const createdTree = await treeService.createTree(treeData);
      
      console.log('✅ [AddTreeScreen] Árbol creado exitosamente:', createdTree);
      showSuccess('¡Árbol registrado exitosamente!');
      
      // Emitir evento para actualizar listas
      console.log('📡 [AddTreeScreen] Emitiendo evento TREE_CREATED:', createdTree);
      eventEmitter.emit(EVENTS.TREE_CREATED, createdTree);
      console.log('📡 [AddTreeScreen] Evento TREE_CREATED emitido');
        
        // Limpiar formulario
        setFormData({
          common_name: '',
          scientific_name: '',
          description: '',
          latitude: '',
          longitude: '',
          location_description: '',
          height_meters: '',
          diameter_cm: '',
          health_status: '',
        });
        setImage(null);
        
        // Navegar de vuelta
        setTimeout(() => {
          navigation.goBack();
        }, 1500);

    } catch (error) {
      console.error('❌ [AddTreeScreen] Error completo al guardar árbol:', error);
      
      // Mostrar notificación de error
      showNotification(
        '❌ Error al guardar',
        `No se pudo guardar el árbol: ${error.message || 'Error desconocido'}`,
        'error'
      );
      
      Alert.alert(
        'Error', 
        `No se pudo guardar el árbol: ${error.message || 'Error desconocido'}`
      );
    } finally {
      setLoading(false);
      console.log('🚀 [AddTreeScreen] handleSubmit completado');
    }
  };

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const clearFormAndScrollUp = () => {
    clearForm();
    scrollToTop();
    eventEmitter.emit(EVENTS.DATA_REFRESH_NEEDED);
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Registrar Árbol</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Común *</Text>
          <TextInput
            style={styles.input}
            value={formData.common_name}
            onChangeText={(value) => updateFormData('common_name', value)}
            placeholder="Ej: Ceiba, Ahuehuete, Jacaranda"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Científico</Text>
          <TextInput
            style={styles.input}
            value={formData.scientific_name}
            onChangeText={(value) => updateFormData('scientific_name', value)}
            placeholder="Ej: Ceiba pentandra"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Describe las características del árbol..."
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
              onChangeText={(value) => updateFormData('latitude', value)}
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
              onChangeText={(value) => updateFormData('longitude', value)}
              placeholder="-99.1332"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, gettingLocation && styles.submitButtonDisabled]}
          onPress={getCurrentLocation}
          disabled={gettingLocation}
        >
          <Ionicons name="location" size={20} color="#ffffff" />
          <Text style={styles.submitButtonText}>
            {gettingLocation ? 'Obteniendo ubicación...' : 'Obtener ubicación'}
          </Text>
        </TouchableOpacity>

        {showMap && formData.latitude && formData.longitude && (
          <View style={styles.mapContainer}>
            <DynamicMapView
              ref={mapRef}
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
              markerTitle="Ubicación del Árbol"
              markerDescription="Arrastra el mapa para ajustar"
              onMarkerDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                updateFormData('latitude', latitude.toFixed(6));
                updateFormData('longitude', longitude.toFixed(6));
              }}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ubicación</Text>
          <TextInput
            style={styles.input}
            value={formData.location_description}
            onChangeText={(value) => updateFormData('location_description', value)}
            placeholder="Ej: Parque Chapultepec, CDMX"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Foto del Árbol</Text>
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="#2d5016" />
            <Text style={styles.imagePickerButtonText}>Seleccionar Foto</Text>
          </TouchableOpacity>
          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
                <Ionicons name="close-circle" size={24} color="#dc3545" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Altura (metros)</Text>
            <TextInput
              style={styles.input}
              value={formData.height_meters}
              onChangeText={(value) => updateFormData('height_meters', value)}
              placeholder="25.5"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Diámetro (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.diameter_cm}
              onChangeText={(value) => updateFormData('diameter_cm', value)}
              placeholder="180"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estado de Salud</Text>
          <TextInput
            style={styles.input}
            value={formData.health_status}
            onChangeText={(value) => updateFormData('health_status', value)}
            placeholder="Ej: Excelente, Bueno, Regular"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            loading && styles.submitButtonDisabled,
            (!formData.common_name.trim() || !formData.latitude || !formData.longitude) && styles.submitButtonDisabled
          ]}
          onPress={() => {
            console.log('🔥 [AddTreeScreen] Botón presionado!');
            handleSubmit();
          }}
          disabled={loading || !formData.common_name.trim() || !formData.latitude || !formData.longitude}
        >
          <Ionicons name="leaf" size={20} color="#ffffff" />
          <Text style={styles.submitButtonText}>
            {loading ? '⏳ Guardando...' : '🌳 Registrar Árbol'}
          </Text>
        </TouchableOpacity>

        {/* Debug info - remover en producción */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Debug: Nombre: {formData.common_name ? '✅' : '❌'} | 
            Coords: {(formData.latitude && formData.longitude) ? '✅' : '❌'} | 
            Loading: {loading ? '⏳' : '✅'}
          </Text>
        </View>
      </View>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
    </ScrollView>
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
    height: 100,
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
  mapContainer: {
    height: 300,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  debugInfo: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  imagePickerButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2d5016',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginTop: 15,
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});

export default AddTreeScreen;
