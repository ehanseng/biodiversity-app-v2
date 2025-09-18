import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import { useNavigation } from '@react-navigation/native';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';

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
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Explorer') {
            iconName = focused ? 'albums' : 'albums-outline';
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
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explorer" component={ExplorerScreen} />
      
      {profile?.role === 'scientist' && <Tab.Screen name="Scientist" component={ScientistScreen} />}
      {profile?.role === 'admin' && <Tab.Screen name="Admin" component={AdminScreen} />}

      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="AddTree" component={AddTreeScreen} />
    <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
    <Stack.Screen name="ScientistApproval" component={ScientistApprovalScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <MainStack /> : <AuthStack />;
};

export default AppNavigator;
