import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimpleTreeService from '../services/SimpleTreeService';
import SimpleAnimalService from '../services/SimpleAnimalService';

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

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.warn('🗺️ [MapScreen] Error limpiando mapa:', error.message);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && (trees.length > 0 || animals.length > 0)) {
      updateMapMarkers();
    }
  }, [trees, animals, selectedFilter]);

  const fetchData = async () => {
    try {
      console.log('🗺️ [MapScreen] Cargando datos de biodiversidad...');
      
      // Cargar árboles desde SimpleTreeService
      const treeService = new SimpleTreeService();
      const allTrees = await treeService.getAllTrees();
      
      // Cargar animales desde SimpleAnimalService
      const animalService = new SimpleAnimalService();
      const allAnimals = await animalService.getAllAnimals();
      
      // Filtrar solo los aprobados para el mapa
      const approvedTrees = allTrees.filter(tree => {
        const status = tree.status || tree.approval_status;
        return status === 'approved' && tree.latitude && tree.longitude;
      });
      
      const approvedAnimals = allAnimals.filter(animal => {
        const status = animal.status || animal.approval_status;
        return status === 'approved' && animal.latitude && animal.longitude;
      });
      
      console.log('🌳 [MapScreen] Árboles aprobados:', approvedTrees.length);
      console.log('🐾 [MapScreen] Animales aprobados:', approvedAnimals.length);

      setTrees(approvedTrees);
      setAnimals(approvedAnimals);
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

  const createCustomIcon = (color, type) => {
    if (typeof window !== 'undefined' && window.L) {
      const iconHtml = type === 'tree' ? 
        `<div style="
          background-color: ${color};
          width: 25px;
          height: 25px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid #ffffff;
          transform: rotate(-45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            color: white;
            font-size: 12px;
            font-weight: bold;
            transform: rotate(45deg);
          ">🌳</span>
        </div>` :
        `<div style="
          background-color: ${color};
          width: 25px;
          height: 25px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid #ffffff;
          transform: rotate(-45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            color: white;
            font-size: 12px;
            font-weight: bold;
            transform: rotate(45deg);
          ">🐾</span>
        </div>`;

      return window.L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [25, 25],
        iconAnchor: [12, 25],
        popupAnchor: [0, -25]
      });
    }
    return null;
  };

  const initializeMap = () => {
    if (typeof window !== 'undefined' && window.L && mapRef.current && !mapInstanceRef.current) {
      try {
        // Initialize map centered on a default location
        const map = window.L.map(mapRef.current).setView([19.4326, -99.1332], 10); // Mexico City default

        // Add tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: ' OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
        updateMapMarkers();
      } catch (error) {
        console.warn('🗺️ [MapScreen] Error inicializando mapa:', error.message);
        // Si el mapa ya existe, solo actualizar marcadores
        if (mapInstanceRef.current) {
          updateMapMarkers();
        }
      }
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
          const treeIcon = createCustomIcon('#28a745', 'tree'); // Verde para árboles
          const marker = window.L.marker([tree.latitude, tree.longitude], { icon: treeIcon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 250px; max-width: 300px;">
                ${tree.image_url ? `
                  <div style="margin-bottom: 10px;">
                    <img src="${tree.image_url}" 
                         style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" 
                         alt="${tree.common_name}"
                         onerror="this.style.display='none';" />
                  </div>
                ` : ''}
                <h3 style="margin: 0 0 8px 0; color: #2d5016;">🌳 ${tree.common_name}</h3>
                ${tree.scientific_name ? `<p style="margin: 0 0 4px 0; font-style: italic; color: #666;">${tree.scientific_name}</p>` : ''}
                ${tree.description ? `<p style="margin: 0 0 4px 0; color: #333;">${tree.description}</p>` : ''}
                ${tree.location_description ? `<p style="margin: 0 0 4px 0; color: #666;">📍 ${tree.location_description}</p>` : ''}
                ${tree.height_meters ? `<p style="margin: 0 0 4px 0; color: #666;">📏 Altura: ${tree.height_meters}m</p>` : ''}
                <p style="margin: 0; color: #999; font-size: 12px;">📅 ${new Date(tree.created_at).toLocaleDateString()}</p>
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
          const animalIcon = createCustomIcon('#CD853F', 'animal'); // Café claro para animales
          const marker = window.L.marker([animal.latitude, animal.longitude], { icon: animalIcon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 250px; max-width: 300px;">
                ${animal.image_url ? `
                  <div style="margin-bottom: 10px;">
                    <img src="${animal.image_url}" 
                         style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" 
                         alt="${animal.common_name}"
                         onerror="this.style.display='none';" />
                  </div>
                ` : ''}
                <h3 style="margin: 0 0 8px 0; color: #8b4513;">🐾 ${animal.common_name}</h3>
                ${animal.scientific_name ? `<p style="margin: 0 0 4px 0; font-style: italic; color: #666;">${animal.scientific_name}</p>` : ''}
                ${animal.description ? `<p style="margin: 0 0 4px 0; color: #333;">${animal.description}</p>` : ''}
                ${animal.location_description ? `<p style="margin: 0 0 4px 0; color: #666;">📍 ${animal.location_description}</p>` : ''}
                ${animal.behavior_notes ? `<p style="margin: 0 0 4px 0; color: #666;">🐾 ${animal.behavior_notes}</p>` : ''}
                <p style="margin: 0; color: #999; font-size: 12px;">📅 ${new Date(animal.created_at).toLocaleDateString()}</p>
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
        <Text style={styles.title}>🗺️ Mapa de Biodiversidad</Text>
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
            height: 'calc(100vh - 200px)',
            margin: 20,
            marginBottom: 20,
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
            Usa la versión web para ver el mapa interactivo con marcadores temáticos
          </Text>
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Leyenda:</Text>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>🌳</Text>
              <Text style={styles.legendText}>Plantas aprobadas</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>🐾</Text>
              <Text style={styles.legendText}>Animales aprobados</Text>
            </View>
          </View>
        </View>
      )}
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
  legendContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignSelf: 'center',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 10,
    textAlign: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#495057',
  },
});

export default MapScreen;
