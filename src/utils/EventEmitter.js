// Sistema simple de eventos para React Native
class EventEmitter {
  constructor() {
    this.events = {};
  }

  // Suscribirse a un evento
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);

    // Retornar función para desuscribirse
    return () => {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    };
  }

  // Emitir un evento
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en evento ${eventName}:`, error);
        }
      });
    }
  }

  // Remover todos los listeners de un evento
  removeAllListeners(eventName) {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }
}

// Instancia global
const eventEmitter = new EventEmitter();

// Eventos específicos de la app
export const EVENTS = {
  TREE_CREATED: 'tree_created',
  TREE_UPDATED: 'tree_updated',
  TREE_DELETED: 'tree_deleted',
  TREES_SYNCED: 'trees_synced',
  DATA_REFRESH_NEEDED: 'data_refresh_needed',
  TREE_UPDATED_BY_SCIENTIST: 'tree_updated_by_scientist',
};

export default eventEmitter;
