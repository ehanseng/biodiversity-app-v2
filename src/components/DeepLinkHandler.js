import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Componente que maneja deep links y URLs directas
 */
const DeepLinkHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleInitialURL = () => {
        const path = window.location.pathname;
        console.log('🔗 [DeepLinkHandler] URL inicial:', path);

        // Mapear URLs a pantallas
        const routeMap = {
          '/MainTabs/Plantas': () => navigation.navigate('MainTabs', { screen: 'Plantas' }),
          '/MainTabs/Animales': () => navigation.navigate('MainTabs', { screen: 'Animales' }),
          '/MainTabs/Map': () => navigation.navigate('MainTabs', { screen: 'Map' }),
          '/MainTabs/Profile': () => navigation.navigate('MainTabs', { screen: 'Profile' }),
          '/MainTabs/Home': () => navigation.navigate('MainTabs', { screen: 'Home' }),
          '/plantas': () => navigation.navigate('MainTabs', { screen: 'Plantas' }),
          '/animales': () => navigation.navigate('MainTabs', { screen: 'Animales' }),
          '/mapa': () => navigation.navigate('MainTabs', { screen: 'Map' }),
          '/perfil': () => navigation.navigate('MainTabs', { screen: 'Profile' }),
          '/home': () => navigation.navigate('MainTabs', { screen: 'Home' }),
          '/registrar-planta': () => navigation.navigate('AddTree'),
          '/registrar-animal': () => navigation.navigate('AddAnimal'),
        };

        // Buscar coincidencia exacta o parcial
        const matchedRoute = Object.keys(routeMap).find(route => 
          path === route || path.startsWith(route)
        );

        if (matchedRoute) {
          console.log('✅ [DeepLinkHandler] Navegando a:', matchedRoute);
          // Pequeño delay para asegurar que la navegación esté lista
          setTimeout(() => {
            routeMap[matchedRoute]();
          }, 100);
        } else if (path !== '/' && path !== '') {
          console.log('⚠️ [DeepLinkHandler] URL no reconocida, redirigiendo a Home');
          setTimeout(() => {
            navigation.navigate('MainTabs', { screen: 'Home' });
          }, 100);
        }
      };

      // Manejar URL inicial
      handleInitialURL();

      // Escuchar cambios de URL (para navegación del navegador)
      const handlePopState = () => {
        handleInitialURL();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [navigation]);

  return null; // Este componente no renderiza nada
};

export default DeepLinkHandler;
