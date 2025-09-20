import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BiodiversityMenuScreen = ({ navigation }) => {
  const handleFloraPress = () => {
    navigation.navigate('TreeExplorer');
  };

  const handleFaunaPress = () => {
    navigation.navigate('AnimalExplorer');
  };

  const handleCombinedPress = () => {
    navigation.navigate('Explorer');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorador de Biodiversidad</Text>
        <Text style={styles.subtitle}>Selecciona qué tipo de registros quieres explorar</Text>
      </View>

      <View style={styles.menuContainer}>
        {/* Flora Option */}
        <TouchableOpacity style={[styles.menuCard, styles.floraCard]} onPress={handleFloraPress}>
          <View style={styles.iconContainer}>
            <Ionicons name="leaf" size={48} color="#28a745" />
          </View>
          <Text style={styles.menuTitle}>Flora</Text>
          <Text style={styles.menuSubtitle}>Explorar árboles y plantas registradas</Text>
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={24} color="#28a745" />
          </View>
        </TouchableOpacity>

        {/* Fauna Option */}
        <TouchableOpacity style={[styles.menuCard, styles.faunaCard]} onPress={handleFaunaPress}>
          <View style={styles.iconContainer}>
            <Ionicons name="paw" size={48} color="#007bff" />
          </View>
          <Text style={styles.menuTitle}>Fauna</Text>
          <Text style={styles.menuSubtitle}>Explorar animales registrados</Text>
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={24} color="#007bff" />
          </View>
        </TouchableOpacity>

        {/* Combined Option */}
        <TouchableOpacity style={[styles.menuCard, styles.combinedCard]} onPress={handleCombinedPress}>
          <View style={styles.iconContainer}>
            <Ionicons name="earth" size={48} color="#6f42c1" />
          </View>
          <Text style={styles.menuTitle}>Vista Combinada</Text>
          <Text style={styles.menuSubtitle}>Ver flora y fauna juntas</Text>
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={24} color="#6f42c1" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Cada sección tiene sus propios filtros y funcionalidades optimizadas
        </Text>
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
    padding: 24,
    marginBottom: 20,
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
    marginRight: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    flex: 1,
  },
  arrowContainer: {
    marginLeft: 10,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BiodiversityMenuScreen;
