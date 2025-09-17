import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScientistScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔬 Panel del Científico</Text>
      <Text style={styles.subtitle}>
        Aquí podrás revisar y aprobar los árboles pendientes de validación
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default ScientistScreen;
