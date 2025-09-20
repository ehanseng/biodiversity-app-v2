import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Supabase removido - usando datos mock

const MapScreen = () => {
  const [trees, setTrees] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    fetchData();
    if (Platform.OS === 'web') {
      loadLeafletMap();
    }
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && (trees.length > 0 || animals.length > 0)) {
      updateMapMarkers();
    }
  }, [trees, animals, selectedFilter]);

  const fetchData = async () => {
    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos mock para árboles
      const mockTrees = [
        {
          id: 1,
          common_name: 'Ceiba',
          scientific_name: 'Ceiba pentandra',
          latitude: 4.6097,
          longitude: -74.0817,
          approval_status: 'approved'
        },
        {
          id: 2,
          common_name: 'Guayacán',
          scientific_name: 'Tabebuia chrysantha',
          latitude: 4.6100,
          longitude: -74.0820,
          approval_status: 'approved'
        }
      ];

      // Datos mock para animales
      const mockAnimals = [
        {
          id: 1,
          common_name: 'Colibrí',
          scientific_name: 'Trochilidae',
          latitude: 4.6095,
          longitude: -74.0815,
          approval_status: 'approved'
        }
      ];

      setTrees(mockTrees);
      setAnimals(mockAnimals);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeafletMap = () => {
    if (typeof window !== 'undefined') {
      // Load Leaflet CSS and JS dynamically
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initializeMap;
      document.head.appendChild(script);
    }
  };

  const initializeMap = () => {
    if (typeof window !== 'undefined' && window.L && mapRef.current) {
      // Initialize map centered on a default location
      const map = window.L.map(mapRef.current).setView([19.4326, -99.1332], 10); // Mexico City default

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      updateMapMarkers();
    }
  };

  const updateMapMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer);
      }
    });

    const bounds = [];

    // Add tree markers
    if (selectedFilter === 'all' || selectedFilter === 'trees') {
      trees.forEach((tree) => {
        if (tree.latitude && tree.longitude) {
          const marker = window.L.marker([tree.latitude, tree.longitude])
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #2d5016;"> ${tree.common_name}</h3>
                ${tree.scientific_name ? `<p style="margin: 0 0 4px 0; font-style: italic; color: #666;">${tree.scientific_name}</p>` : ''}
                ${tree.description ? `<p style="margin: 0 0 4px 0; color: #333;">${tree.description}</p>` : ''}
                ${tree.location_description ? `<p style="margin: 0 0 4px 0; color: #666;"> ${tree.location_description}</p>` : ''}
                ${tree.height_meters ? `<p style="margin: 0 0 4px 0; color: #666;"> Altura: ${tree.height_meters}m</p>` : ''}
                <p style="margin: 0; color: #999; font-size: 12px;"> ${new Date(tree.created_at).toLocaleDateString()}</p>
              </div>
            `);
          bounds.push([tree.latitude, tree.longitude]);
        }
      });
    }

    // Add animal markers
    if (selectedFilter === 'all' || selectedFilter === 'animals') {
      animals.forEach((animal) => {
        if (animal.latitude && animal.longitude) {
          const marker = window.L.marker([animal.latitude, animal.longitude])
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #8b4513;"> ${animal.common_name}</h3>
                ${animal.scientific_name ? `<p style="margin: 0 0 4px 0; font-style: italic; color: #666;">${animal.scientific_name}</p>` : ''}
                ${animal.description ? `<p style="margin: 0 0 4px 0; color: #333;">${animal.description}</p>` : ''}
                ${animal.location_description ? `<p style="margin: 0 0 4px 0; color: #666;"> ${animal.location_description}</p>` : ''}
                ${animal.behavior_notes ? `<p style="margin: 0 0 4px 0; color: #666;"> ${animal.behavior_notes}</p>` : ''}
                <p style="margin: 0; color: #999; font-size: 12px;"> ${new Date(animal.created_at).toLocaleDateString()}</p>
              </div>
            `);
          bounds.push([animal.latitude, animal.longitude]);
        }
      });
    }

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  const getFilteredData = () => {
    switch (selectedFilter) {
      case 'trees':
        return trees;
      case 'animals':
        return animals;
      default:
        return [...trees, ...animals];
    }
  };

  const FilterButton = ({ filter, label, icon, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={selectedFilter === filter ? '#ffffff' : '#2d5016'} 
      />
      <Text style={[
        styles.filterText,
        selectedFilter === filter && styles.filterTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}> Mapa de Biodiversidad</Text>
        <Text style={styles.subtitle}>
          {trees.length} árboles • {animals.length} animales registrados
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton
          filter="all"
          label="Todos"
          icon="apps"
          count={trees.length + animals.length}
        />
        <FilterButton
          filter="trees"
          label="Árboles"
          icon="leaf"
          count={trees.length}
        />
        <FilterButton
          filter="animals"
          label="Animales"
          icon="paw"
          count={animals.length}
        />
      </View>

      {Platform.OS === 'web' ? (
        <div
          ref={mapRef}
          style={{
            height: 400,
            margin: 20,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={64} color="#2d5016" />
          <Text style={styles.mapText}>
            Mapa interactivo disponible en web
          </Text>
          <Text style={styles.mapSubtext}>
            Usa la versión web para ver el mapa interactivo
          </Text>
        </View>
      )}

      <ScrollView style={styles.dataList}>
        <Text style={styles.listTitle}>
          {selectedFilter === 'trees' ? 'Árboles' : selectedFilter === 'animals' ? 'Animales' : 'Ubicaciones'}
        </Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Cargando datos...</Text>
        ) : getFilteredData().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#6c757d" />
            <Text style={styles.emptyText}>
              No hay datos con ubicación
            </Text>
            <Text style={styles.emptySubtext}>
              Los registros aparecerán aquí una vez que incluyan coordenadas
            </Text>
          </View>
        ) : (
          getFilteredData().map((item) => (
            <TouchableOpacity key={`${item.id}-${item.common_name}`} style={styles.dataItem}>
              <View style={styles.dataInfo}>
                <Text style={styles.dataName}>
                  {trees.includes(item) ? '' : ''} {item.common_name}
                </Text>
                {item.scientific_name && (
                  <Text style={styles.dataScientific}>{item.scientific_name}</Text>
                )}
                <Text style={styles.dataLocation}>
                  {item.location_description || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`}
                </Text>
                <Text style={styles.dataDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6c757d" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2d5016',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  filterButton: {
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2d5016',
  },
  filterText: {
    fontSize: 16,
    color: '#2d5016',
    marginLeft: 8,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  mapPlaceholder: {
    backgroundColor: '#e9ecef',
    height: 300,
    margin: 20,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d5016',
    marginTop: 10,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
    textAlign: 'center',
  },
  dataList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 15,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 10,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  dataInfo: {
    flex: 1,
  },
  dataName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 2,
  },
  dataScientific: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6c757d',
    marginBottom: 4,
  },
  dataLocation: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  dataDate: {
    fontSize: 12,
    color: '#6c757d',
  },
});

export default MapScreen;
