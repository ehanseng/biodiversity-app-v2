import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ExplorerMenuScreen = ({ navigation }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mostrar el menú automáticamente cuando se carga la pantalla
    showMenu();
  }, []);

  const showMenu = () => {
    setMenuVisible(true);
    Animated.spring(animation, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const hideMenu = () => {
    Animated.spring(animation, {
      toValue: 0,
      friction: 5,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const navigateToFlora = () => {
    hideMenu();
    setTimeout(() => {
      navigation.navigate('TreeExplorer');
    }, 200);
  };

  const navigateToFauna = () => {
    hideMenu();
    setTimeout(() => {
      navigation.navigate('AnimalExplorer');
    }, 200);
  };

  const navigateToCombined = () => {
    hideMenu();
    setTimeout(() => {
      navigation.navigate('Explorer');
    }, 200);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorador de Biodiversidad</Text>
        <Text style={styles.subtitle}>Selecciona qué tipo de registros quieres explorar</Text>
      </View>

      <View style={styles.menuContainer}>
        {/* Flora Option */}
        <TouchableOpacity style={[styles.menuCard, styles.floraCard]} onPress={navigateToFlora}>
          <View style={styles.iconContainer}>
            <Ionicons name="leaf" size={48} color="#28a745" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.menuTitle}>Flora</Text>
            <Text style={styles.menuSubtitle}>Explorar árboles y plantas</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#28a745" />
        </TouchableOpacity>

        {/* Fauna Option */}
        <TouchableOpacity style={[styles.menuCard, styles.faunaCard]} onPress={navigateToFauna}>
          <View style={styles.iconContainer}>
            <Ionicons name="paw" size={48} color="#007bff" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.menuTitle}>Fauna</Text>
            <Text style={styles.menuSubtitle}>Explorar animales registrados</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#007bff" />
        </TouchableOpacity>

        {/* Combined Option */}
        <TouchableOpacity style={[styles.menuCard, styles.combinedCard]} onPress={navigateToCombined}>
          <View style={styles.iconContainer}>
            <Ionicons name="earth" size={48} color="#6f42c1" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.menuTitle}>Vista Combinada</Text>
            <Text style={styles.menuSubtitle}>Ver flora y fauna juntas</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#6f42c1" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
  },
  floraCard: {
    borderLeftColor: '#28a745',
  },
  faunaCard: {
    borderLeftColor: '#007bff',
  },
  combinedCard: {
    borderLeftColor: '#6f42c1',
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default ExplorerMenuScreen;
