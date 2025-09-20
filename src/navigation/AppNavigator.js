import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/SimpleAuthContext';
import LoadingScreen from '../components/LoadingScreen';
import { StyleSheet } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Role-specific Screens
import ExplorerScreen from '../screens/ExplorerScreen';
import ScientistScreen from '../screens/ScientistScreen';
import AdminScreen from '../screens/AdminScreen';

// New Screens
import AddTreeScreen from '../screens/AddTreeScreen';
import AddAnimalScreen from '../screens/AddAnimalScreen';
import ScientistApprovalScreen from '../screens/ScientistApprovalScreen';
import MySQLTestScreen from '../screens/MySQLTestScreen';

// Biodiversity Screens
import ExplorerMenuScreen from '../screens/ExplorerMenuScreen';
import TreeExplorerScreen from '../screens/TreeExplorerScreen';
import AnimalExplorerScreen from '../screens/AnimalExplorerScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();



const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { profile } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2d5016',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Plantas') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Animales') {
            iconName = focused ? 'paw' : 'paw-outline';
          } else if (route.name === 'Scientist') {
            iconName = focused ? 'flask' : 'flask-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'build' : 'build-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2d5016',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 70,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarLabelStyle: {
          marginBottom: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Plantas" 
        component={TreeExplorerScreen}
        options={{ title: 'Plantas' }}
      />
      <Tab.Screen 
        name="Animales" 
        component={AnimalExplorerScreen}
        options={{ title: 'Animales' }}
      />
      
      {profile?.role === 'scientist' && <Tab.Screen name="Scientist" component={ScientistScreen} />}
      {profile?.role === 'admin' && <Tab.Screen name="Admin" component={AdminScreen} />}

      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Mapa' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainTabsWithMenu = () => {
  return <MainTabs />;
};

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabsWithMenu} />
    <Stack.Screen name="AddTree" component={AddTreeScreen} />
    <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
    <Stack.Screen name="ScientistApproval" component={ScientistApprovalScreen} />
    <Stack.Screen name="MySQLTest" component={MySQLTestScreen} />
    
    {/* Biodiversity Explorers */}
    <Stack.Screen name="TreeExplorer" component={TreeExplorerScreen} />
    <Stack.Screen name="AnimalExplorer" component={AnimalExplorerScreen} />
    <Stack.Screen name="Explorer" component={ExplorerScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <MainStack /> : <AuthStack />;
};


const styles = StyleSheet.create({
  // Estilos limpios - menú flotante removido completamente
});

export default AppNavigator;
