import React from 'react';
import { Image as RNImage, Platform } from 'react-native';

/**
 * Wrapper seguro para el componente Image de React Native
 * Para evitar conflictos con el constructor Image del DOM
 */
const SafeImage = (props) => {
  try {
    // En web, asegurarse de que no hay conflictos
    if (Platform.OS === 'web') {
      // Verificar que las props son válidas
      if (!props.source) {
        console.warn('⚠️ [SafeImage] No source provided');
        return null;
      }
      
      // Si es una URI, verificar que sea válida
      if (props.source.uri && typeof props.source.uri !== 'string') {
        console.warn('⚠️ [SafeImage] Invalid URI:', props.source.uri);
        return null;
      }
    }
    
    return <RNImage {...props} />;
  } catch (error) {
    console.error('❌ [SafeImage] Error rendering image:', error);
    return null;
  }
};

export default SafeImage;
