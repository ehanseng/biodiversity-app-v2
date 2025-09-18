import React, { useState, useEffect, forwardRef } from 'react';
import { View, Text, Platform } from 'react-native';

const DynamicMapView = forwardRef(({ 
  style, 
  initialRegion, 
  children, 
  onMarkerDragEnd,
  markerCoordinate,
  showUrlTile = true,
  markerTitle,
  markerDescription
}, ref) => {
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Importación dinámica asíncrona para evitar problemas de bundling
      import('react-native-maps')
        .then((RNMaps) => {
          setMapComponents({
            MapView: RNMaps.default,
            Marker: RNMaps.Marker,
            UrlTile: RNMaps.UrlTile,
          });
        })
        .catch((error) => {
          console.warn('Could not load react-native-maps:', error);
        });
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={[style, { padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#2d5016', textAlign: 'center' }}>
          El mapa nativo no está disponible en web. Continúa en móvil para ajustar el punto o ingresa latitud/longitud manualmente.
        </Text>
      </View>
    );
  }

  if (!MapComponents) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }]}>
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  const { MapView, Marker, UrlTile } = MapComponents;

  return (
    <MapView ref={ref} style={style} initialRegion={initialRegion}>
      {showUrlTile && (
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />
      )}
      {markerCoordinate && (
        <Marker
          coordinate={markerCoordinate}
          title={markerTitle}
          description={markerDescription}
          draggable
          onDragEnd={onMarkerDragEnd}
        />
      )}
      {children}
    </MapView>
  );
});

export default DynamicMapView;
