import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const InteractiveMap = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  height = 250,
  showCoordinates = true 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      loadLeafletMap();
    }
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      updateMapLocation(latitude, longitude);
    }
  }, [latitude, longitude, mapLoaded]);

  const loadLeafletMap = () => {
    if (typeof window !== 'undefined' && !window.L) {
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    } else if (window.L) {
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Coordenadas por defecto (Costa Rica)
      const defaultLat = latitude || 9.928069;
      const defaultLng = longitude || -84.090725;

      // Crear el mapa
      const map = window.L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
      });

      // Agregar tiles de OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Crear marcador draggable
      const marker = window.L.marker([defaultLat, defaultLng], {
        draggable: true,
        title: 'Arrastra para ajustar la ubicación'
      }).addTo(map);

      // Evento cuando se mueve el marcador
      marker.on('dragend', function(e) {
        const position = e.target.getLatLng();
        const newLat = parseFloat(position.lat.toFixed(6));
        const newLng = parseFloat(position.lng.toFixed(6));
        
        if (onLocationChange) {
          onLocationChange(newLat, newLng);
        }
      });

      // Evento de click en el mapa para mover el marcador
      map.on('click', function(e) {
        const newLat = parseFloat(e.latlng.lat.toFixed(6));
        const newLng = parseFloat(e.latlng.lng.toFixed(6));
        
        marker.setLatLng([newLat, newLng]);
        
        if (onLocationChange) {
          onLocationChange(newLat, newLng);
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapLoaded(true);

      console.log('✅ Mapa interactivo inicializado');
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
    }
  };

  const updateMapLocation = (lat, lng) => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    try {
      const newPosition = [parseFloat(lat), parseFloat(lng)];
      
      // Actualizar posición del marcador
      markerRef.current.setLatLng(newPosition);
      
      // Centrar el mapa en la nueva posición
      mapInstanceRef.current.setView(newPosition, 15);
      
      console.log('📍 Mapa actualizado a:', lat, lng);
    } catch (error) {
      console.error('❌ Error actualizando mapa:', error);
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            📱 Mapa interactivo disponible en versión web
          </Text>
          {showCoordinates && latitude && longitude && (
            <Text style={styles.coordinates}>
              📍 {latitude}, {longitude}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      />
      {showCoordinates && latitude && longitude && (
        <View style={styles.coordinatesOverlay}>
          <Text style={styles.coordinatesText}>
            📍 {latitude}, {longitude}
          </Text>
        </View>
      )}
      <View style={styles.instructionsOverlay}>
        <Text style={styles.instructionsText}>
          💡 Arrastra el PIN o haz click para ajustar la ubicación
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 14,
    color: '#495057',
    fontFamily: 'monospace',
  },
  coordinatesOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#495057',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  instructionsOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(45, 80, 22, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  instructionsText: {
    fontSize: 11,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default InteractiveMap;
