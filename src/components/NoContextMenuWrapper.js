import React from 'react';
import { Platform } from 'react-native';

/**
 * Wrapper que deshabilita el menú contextual (clic derecho) en web
 * para evitar que se abran links en nueva pestaña
 */
const NoContextMenuWrapper = ({ children, style }) => {
  if (Platform.OS === 'web') {
    return (
      <div
        style={style}
        onContextMenu={(e) => {
          e.preventDefault();
          return false;
        }}
        onAuxClick={(e) => {
          // Prevenir clic con botón del medio
          e.preventDefault();
          return false;
        }}
      >
        {children}
      </div>
    );
  }
  
  return children;
};

export default NoContextMenuWrapper;
