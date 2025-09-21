import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
// Importar polyfill ANTES que cualquier otro código
import './src/utils/LocalStoragePolyfill';
import { AuthProvider } from './src/contexts/SimpleAuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Configuración de deep linking
const linking = {
  prefixes: ['http://localhost:8081', 'https://biodiversidad.tadeo.edu.co'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Plantas: 'plantas',
          Animales: 'animales',
          Map: 'mapa',
          Profile: 'perfil',
        },
      },
      AddTree: 'registrar-planta',
      AddAnimal: 'registrar-animal',
      Login: 'login',
      Register: 'registro',
    },
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}
