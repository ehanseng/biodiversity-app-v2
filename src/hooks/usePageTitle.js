import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Hook para actualizar el título de la página dinámicamente
 * Solo funciona en web - Versión simple y eficiente
 */
const usePageTitle = (title) => {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const fullTitle = title ? `Explora Tadeo - ${title}` : 'Explora Tadeo';
      
      // Actualizar título inmediatamente
      document.title = fullTitle;
      
      // Una verificación adicional después de un breve delay
      const timeoutId = setTimeout(() => {
        if (document.title !== fullTitle) {
          document.title = fullTitle;
        }
      }, 500);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [title]);
};

export default usePageTitle;
