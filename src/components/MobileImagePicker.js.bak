import React, { useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const MobileImagePicker = {
  // Detectar si estamos en un dispositivo móvil web
  isMobileWeb: () => {
    if (Platform.OS !== 'web') {
      console.log('🖥️ [MobileImagePicker] No es web, es:', Platform.OS);
      return false;
    }
    
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    console.log('🔍 [MobileImagePicker] UserAgent:', userAgent);
    console.log('📱 [MobileImagePicker] Es móvil web:', isMobile);
    
    return isMobile;
  },

  // Función mejorada para tomar foto
  takePhoto: async (options = {}) => {
    const defaultOptions = {
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: Platform.OS === 'web',
      ...options
    };

    try {
      // En web móvil, usar input HTML nativo
      if (Platform.OS === 'web' && MobileImagePicker.isMobileWeb()) {
        console.log('📱 [MobileImagePicker] Detectado móvil web, usando input HTML nativo');
        return await MobileImagePicker.takePhotoWeb();
      }

      // En app nativa o web desktop, usar ImagePicker normal
      console.log('🖥️ [MobileImagePicker] Usando ImagePicker estándar');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara para tomar una foto.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync(defaultOptions);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('📸 [MobileImagePicker] Foto tomada:', asset.uri);
        return asset;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [MobileImagePicker] Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
      return null;
    }
  },

  // Función mejorada para seleccionar de galería
  pickFromGallery: async (options = {}) => {
    const defaultOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: Platform.OS === 'web',
      ...options
    };

    try {
      // En web móvil, usar input HTML nativo
      if (Platform.OS === 'web' && MobileImagePicker.isMobileWeb()) {
        console.log('📱 [MobileImagePicker] Detectado móvil web, usando input HTML nativo para galería');
        return await MobileImagePicker.pickFromGalleryWeb();
      }

      // En app nativa o web desktop, usar ImagePicker normal
      console.log('🖥️ [MobileImagePicker] Usando ImagePicker estándar para galería');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para seleccionar una foto.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('🖼️ [MobileImagePicker] Imagen seleccionada:', asset.uri);
        return asset;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [MobileImagePicker] Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Intenta de nuevo.');
      return null;
    }
  },

  // Función para tomar foto en web móvil usando input HTML
  takePhotoWeb: () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }

      // Crear input file con capture para cámara
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Usar cámara trasera por defecto
      input.style.display = 'none';

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          try {
            const result = await MobileImagePicker.processWebFile(file);
            resolve(result);
          } catch (error) {
            console.error('❌ [MobileImagePicker] Error procesando archivo web:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
        document.body.removeChild(input);
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        resolve(null);
      };

      document.body.appendChild(input);
      input.click();
    });
  },

  // Función para seleccionar de galería en web móvil
  pickFromGalleryWeb: () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }

      // Crear input file normal para galería
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          try {
            const result = await MobileImagePicker.processWebFile(file);
            resolve(result);
          } catch (error) {
            console.error('❌ [MobileImagePicker] Error procesando archivo web:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
        document.body.removeChild(input);
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        resolve(null);
      };

      document.body.appendChild(input);
      input.click();
    });
  },

  // Procesar archivo web y convertir a formato compatible
  processWebFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64 = event.target.result;
        const uri = base64;
        
        // Crear objeto compatible con ImagePicker
        const asset = {
          uri: uri,
          base64: base64.split(',')[1], // Remover prefijo data:image/...;base64,
          width: null, // Se podría calcular si es necesario
          height: null,
          type: 'image',
          fileName: file.name || 'image.jpg',
          fileSize: file.size
        };

        console.log('✅ [MobileImagePicker] Archivo web procesado:', {
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          hasBase64: !!asset.base64
        });

        resolve(asset);
      };

      reader.onerror = (error) => {
        console.error('❌ [MobileImagePicker] Error leyendo archivo:', error);
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  },

  // Función helper para mostrar opciones de imagen
  showImageOptions: (onTakePhoto, onPickGallery) => {
    if (Platform.OS === 'web' && MobileImagePicker.isMobileWeb()) {
      // En móvil web, mostrar opciones nativas
      console.log('📱 [MobileImagePicker] Mostrando opciones para móvil web');
      if (typeof window !== 'undefined') {
        const choice = window.confirm('¿Quieres tomar una foto nueva o seleccionar de la galería?\n\nOK = Tomar Foto\nCancelar = Galería');
        if (choice) {
          onTakePhoto();
        } else {
          onPickGallery();
        }
      }
    } else {
      // En app nativa o web desktop, usar Alert normal
      console.log('🖥️ [MobileImagePicker] Mostrando Alert estándar');
      Alert.alert(
        'Seleccionar Imagen',
        'Elige una opción',
        [
          { text: 'Tomar Foto', onPress: onTakePhoto },
          { text: 'Galería', onPress: onPickGallery },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  }
};

export default MobileImagePicker;
