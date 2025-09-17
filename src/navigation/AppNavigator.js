import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Explorer') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Scientist') {
            iconName = focused ? 'flask' : 'flask-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Add Tree') {
            iconName = focused ? 'ios-add-circle' : 'ios-add-circle-outline';
          } else if (route.name === 'Add Animal') {
            iconName = focused ? 'ios-add-circle' : 'ios-add-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2d5016',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      
      {(profile?.role === 'explorer' || profile?.role === 'scientist' || profile?.role === 'admin') && (
        <Tab.Screen name="Explorer" component={ExplorerScreen} />
      )}
      
      {profile?.role === 'scientist' && (
        <Tab.Screen name="Scientist" component={ScientistScreen} />
      )}
      
      {profile?.role === 'admin' && (
        <Tab.Screen name="Admin" component={AdminScreen} />
      )}
      
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Add Tree" component={AddTreeScreen} />
      <Tab.Screen name="Add Animal" component={AddAnimalScreen} />
    </Tab.Navigator>
  );
};

// Stack Navigator principal que incluye las tabs y pantallas adicionales
const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="ScientistApproval" component={ScientistApprovalScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2d5016" />
      </View>
    );
  }

  return user ? <MainStack /> : <AuthStack />;
};

export default AppNavigator;
