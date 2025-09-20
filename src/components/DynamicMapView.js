import React, { useState, useEffect, forwardRef, useRef } from 'react';
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
  const [webMapLoaded, setWebMapLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

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
    } else {
      // Cargar Leaflet para web
      loadLeafletMap();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && leafletMapRef.current && markerCoordinate) {
      updateWebMapMarker();
    }
  }, [markerCoordinate]);

  const loadLeafletMap = async () => {
    try {
      // Cargar CSS de Leaflet
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Cargar JS de Leaflet
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Inicializar mapa después de un pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        initializeWebMap();
      }, 100);
    } catch (error) {
      console.error('Error loading Leaflet:', error);
    }
  };

  const initializeWebMap = () => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    try {
      const { latitude, longitude } = initialRegion || { latitude: 19.4326, longitude: -99.1332 };
      
      // Detectar si es dispositivo móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       ('ontouchstart' in window) || 
                       (navigator.maxTouchPoints > 0);
      
      // Crear mapa con configuraciones optimizadas para móvil
      const map = window.L.map(mapContainerRef.current, {
        tap: isMobile, // Habilitar tap en móvil
        tapTolerance: isMobile ? 20 : 15, // Mayor tolerancia en móvil
        touchZoom: isMobile,
        bounceAtZoomLimits: false
      }).setView([latitude, longitude], 15);
      
      // Agregar tiles de OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Agregar marcador si hay coordenadas
      if (markerCoordinate) {
        const marker = window.L.marker([markerCoordinate.latitude, markerCoordinate.longitude], {
          draggable: true,
          // Hacer el marcador más grande en móvil para facilitar el arrastre
          icon: window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color: #e74c3c;
              width: ${isMobile ? '24px' : '20px'};
              height: ${isMobile ? '24px' : '20px'};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: ${isMobile ? 'pointer' : 'move'};
            "></div>`,
            iconSize: [isMobile ? 30 : 26, isMobile ? 30 : 26],
            iconAnchor: [isMobile ? 15 : 13, isMobile ? 15 : 13]
          })
        }).addTo(map);
        
        if (markerTitle) {
          marker.bindPopup(`<b>${markerTitle}</b><br>${markerDescription || ''}<br><small>${isMobile ? 'Mantén presionado para mover' : 'Arrastra para mover'}</small>`);
        }

        // Manejar arrastre del marcador
        marker.on('dragend', (e) => {
          const position = e.target.getLatLng();
          if (onMarkerDragEnd) {
            onMarkerDragEnd({
              nativeEvent: {
                coordinate: {
                  latitude: position.lat,
                  longitude: position.lng
                }
              }
            });
          }
        });

        // En móvil, agregar feedback visual durante el arrastre
        if (isMobile) {
          marker.on('dragstart', () => {
            marker.setOpacity(0.7);
          });
          
          marker.on('dragend', () => {
            marker.setOpacity(1);
          });
        }

        markerRef.current = marker;
      }

      // Manejar clic en el mapa para mover marcador
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          // Actualizar el icono si es necesario
          if (isMobile) {
            markerRef.current.setIcon(window.L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: #e74c3c;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                cursor: pointer;
              "></div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            }));
          }
        } else {
          const newMarker = window.L.marker([lat, lng], { 
            draggable: true,
            icon: window.L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: #e74c3c;
                width: ${isMobile ? '24px' : '20px'};
                height: ${isMobile ? '24px' : '20px'};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                cursor: ${isMobile ? 'pointer' : 'move'};
              "></div>`,
              iconSize: [isMobile ? 30 : 26, isMobile ? 30 : 26],
              iconAnchor: [isMobile ? 15 : 13, isMobile ? 15 : 13]
            })
          }).addTo(map);
          
          if (markerTitle) {
            newMarker.bindPopup(`<b>${markerTitle}</b><br>${markerDescription || ''}<br><small>${isMobile ? 'Mantén presionado para mover' : 'Arrastra para mover'}</small>`);
          }
          
          newMarker.on('dragend', (e) => {
            const position = e.target.getLatLng();
            if (onMarkerDragEnd) {
              onMarkerDragEnd({
                nativeEvent: {
                  coordinate: {
                    latitude: position.lat,
                    longitude: position.lng
                  }
                }
              });
            }
          });

          // Feedback visual para móvil
          if (isMobile) {
            newMarker.on('dragstart', () => {
              newMarker.setOpacity(0.7);
            });
            
            newMarker.on('dragend', () => {
              newMarker.setOpacity(1);
            });
          }
          
          markerRef.current = newMarker;
        }

        if (onMarkerDragEnd) {
          onMarkerDragEnd({
            nativeEvent: {
              coordinate: {
                latitude: lat,
                longitude: lng
              }
            }
          });
        }
      });

      leafletMapRef.current = map;
      setWebMapLoaded(true);
      
      // Invalidar el tamaño del mapa después de un momento para asegurar renderizado correcto
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

    } catch (error) {
      console.error('Error initializing Leaflet map:', error);
    }
  };

  const updateWebMapMarker = () => {
    if (!leafletMapRef.current || !markerCoordinate) return;

    try {
      if (markerRef.current) {
        markerRef.current.setLatLng([markerCoordinate.latitude, markerCoordinate.longitude]);
      } else {
        const marker = window.L.marker([markerCoordinate.latitude, markerCoordinate.longitude], {
          draggable: true
        }).addTo(leafletMapRef.current);
        
        if (markerTitle) {
          marker.bindPopup(`<b>${markerTitle}</b><br>${markerDescription || ''}`);
        }

        marker.on('dragend', (e) => {
          const position = e.target.getLatLng();
          if (onMarkerDragEnd) {
            onMarkerDragEnd({
              nativeEvent: {
                coordinate: {
                  latitude: position.lat,
                  longitude: position.lng
                }
              }
            });
          }
        });

        markerRef.current = marker;
      }

      // Centrar el mapa en el marcador
      leafletMapRef.current.setView([markerCoordinate.latitude, markerCoordinate.longitude], 15);
    } catch (error) {
      console.error('Error updating web map marker:', error);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[style, { position: 'relative' }]}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '300px',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
        {!webMapLoaded && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f0f0f0',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8
          }}>
            <Text style={{ color: '#2d5016', fontSize: 16 }}>Cargando mapa...</Text>
          </View>
        )}
        {webMapLoaded && (
          <View style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: 8,
            borderRadius: 4,
            maxWidth: '80%'
          }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              💡 {Platform.OS === 'web' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? 'Toca el mapa para colocar el marcador. Mantén presionado el marcador para moverlo'
                : 'Haz clic en el mapa para colocar el marcador o arrastra el marcador existente'}
            </Text>
          </View>
        )}
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
