import AsyncStorage from '@react-native-async-storage/async-storage';
// Supabase removido - usando sistema simple

const TREES_STORAGE_KEY = '@biodiversity_trees';
const SYNC_STATUS_KEY = '@biodiversity_sync_status';

class TreeStorageService {
  // Inicializar datos de prueba si no existen
  async initializeSampleData() {
    try {
      const existingTrees = await this.getLocalTrees();
      
      // Si ya hay árboles locales, no agregar más datos de prueba
      if (existingTrees.length > 0) {
        console.log('📋 [TreeStorageService] Ya existen árboles locales, no agregando datos de prueba');
        return;
      }
      
      console.log('🌱 [TreeStorageService] Inicializando datos de prueba...');
      
      const sampleTrees = [
        {
          id: 'local_1',
          common_name: 'Árbol Local Pendiente',
          scientific_name: 'Ficus benjamina',
          description: 'Árbol creado localmente, pendiente de sincronización',
          latitude: 4.6092,
          longitude: -74.0812,
          height_meters: 8,
          diameter_cm: 25,
          health_status: 'Bueno',
          syncStatus: 'pending',
          source: 'local',
          image_url: 'https://via.placeholder.com/300x200/87CEEB/000000?text=Local+Pendiente',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
          user_id: '1'
        },
        {
          id: 'local_2',
          common_name: 'Palma Local',
          scientific_name: 'Phoenix canariensis',
          description: 'Palma registrada desde la app móvil',
          latitude: 4.6088,
          longitude: -74.0808,
          height_meters: 6,
          diameter_cm: 30,
          health_status: 'Excelente',
          syncStatus: 'error',
          source: 'local',
          image_url: 'https://via.placeholder.com/300x200/FF6347/FFFFFF?text=Local+Error',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          user_id: '1'
        }
      ];
      
      // Guardar cada árbol de prueba
      for (const tree of sampleTrees) {
        await this.saveTreeLocally(tree);
      }
      
      console.log('✅ [TreeStorageService] Datos de prueba inicializados');
    } catch (error) {
      console.error('❌ [TreeStorageService] Error inicializando datos de prueba:', error);
    }
  }

  // Guardar árbol localmente
  async saveTreeLocally(treeData) {
    try {
      const existingTrees = await this.getLocalTrees();
      const newTree = {
        ...treeData,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isLocal: true,
        syncStatus: 'pending', // pending, error
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedTrees = [...existingTrees, newTree];
      await AsyncStorage.setItem(TREES_STORAGE_KEY, JSON.stringify(updatedTrees));
      
      console.log('✅ [TreeStorageService] Árbol guardado localmente:', newTree.id);
      console.log('📊 [TreeStorageService] Total árboles en storage:', updatedTrees.length);
      console.log('🔍 [TreeStorageService] Árbol guardado completo:', newTree);
      return newTree;
    } catch (error) {
      console.error('❌ Error guardando árbol localmente:', error);
      throw error;
    }
  }

  // Obtener árboles locales
  async getLocalTrees() {
    try {
      const treesJson = await AsyncStorage.getItem(TREES_STORAGE_KEY);
      const trees = treesJson ? JSON.parse(treesJson) : [];
      console.log('📋 [TreeStorageService] Árboles locales recuperados:', trees.length);
      if (trees.length > 0) {
        console.log('🔍 [TreeStorageService] Primer árbol local:', trees[0]);
      }
      return trees;
    } catch (error) {
      console.error('❌ Error obteniendo árboles locales:', error);
      return [];
    }
  }

  // Sincronizar árbol local con la base de datos
  async syncTreeToDatabase(localTree, userId) {
    try {
      const treeData = {
        user_id: userId,
        common_name: localTree.common_name,
        scientific_name: localTree.scientific_name || null,
        description: localTree.description || null,
        latitude: localTree.latitude,
        longitude: localTree.longitude,
        location_description: localTree.location_description || null,
        height_meters: localTree.height || null,
        diameter_cm: localTree.diameter || null,
        health_status: localTree.health_status || null,
        image_url: localTree.image_url || null,
        status: 'pending',
        created_at: localTree.createdAt,
      };

      // Simular sincronización exitosa
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        id: Date.now(),
        ...treeData
      };

      // Actualizar el árbol local con el ID simulado
      await this.updateLocalTreeSyncStatus(localTree.id, 'approved', mockData.id);
      
      console.log('✅ Árbol "sincronizado" (mock):', mockData.id);
      return mockData;
    } catch (error) {
      console.error('❌ Error sincronizando árbol:', error);
      await this.updateLocalTreeSyncStatus(localTree.id, 'error');
      throw error;
    }
  }

  // Actualizar estado de sincronización
  async updateLocalTreeSyncStatus(localId, status, databaseId = null) {
    try {
      const trees = await this.getLocalTrees();
      const updatedTrees = trees.map(tree => {
        if (tree.id === localId) {
          return {
            ...tree,
            syncStatus: status,
            databaseId: databaseId || tree.databaseId,
            updatedAt: new Date().toISOString(),
          };
        }
        return tree;
      });
      
      await AsyncStorage.setItem(TREES_STORAGE_KEY, JSON.stringify(updatedTrees));
    } catch (error) {
      console.error('❌ Error actualizando estado de sync:', error);
    }
  }

  // Obtener árboles de la base de datos
  async getTreesFromDatabase() {
    try {
      console.log('🔍 [TreeStorageService] Consultando árboles en base de datos...');
      
      // Timeout para esta consulta específica
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout en getTreesFromDatabase')), 3000);
      });
      
      // Simular consulta a BD con datos mock más completos
      const mockPromise = new Promise(resolve => {
        setTimeout(() => {
          const mockTrees = [
            {
              id: 'mock_1',
              common_name: 'Ceiba del Campus',
              scientific_name: 'Ceiba pentandra',
              description: 'Árbol emblemático ubicado en la entrada principal',
              latitude: 4.6097,
              longitude: -74.0817,
              height_meters: 25,
              diameter_cm: 80,
              health_status: 'Excelente',
              syncStatus: 'approved',
              status: 'approved',
              image_url: 'https://picsum.photos/300/200?random=1',
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días atrás
              user_id: '1',
              type: 'flora'
            },
            {
              id: 'mock_2',
              common_name: 'Guayacán Amarillo',
              scientific_name: 'Tabebuia chrysantha',
              description: 'Hermoso árbol con flores amarillas en primavera',
              latitude: 4.6100,
              longitude: -74.0820,
              height_meters: 15,
              diameter_cm: 45,
              health_status: 'Bueno',
              syncStatus: 'pending',
              status: 'pending',
              image_url: 'https://picsum.photos/300/200?random=2',
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días atrás
              user_id: '1',
              type: 'flora'
            },
            {
              id: 'mock_3',
              common_name: 'Nogal Cafetero',
              scientific_name: 'Cordia alliodora',
              description: 'Árbol nativo usado tradicionalmente en construcción',
              latitude: 4.6095,
              longitude: -74.0815,
              height_meters: 20,
              diameter_cm: 60,
              health_status: 'Regular',
              syncStatus: 'rejected',
              status: 'rejected',
              image_url: 'https://picsum.photos/300/200?random=3',
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días atrás
              user_id: '2',
              type: 'flora'
            },
            {
              id: 'mock_4',
              common_name: 'Jacaranda',
              scientific_name: 'Jacaranda mimosifolia',
              description: 'Árbol ornamental con flores moradas',
              latitude: 4.6105,
              longitude: -74.0825,
              height_meters: 12,
              diameter_cm: 35,
              health_status: 'Excelente',
              syncStatus: 'approved',
              status: 'approved',
              image_url: 'https://picsum.photos/300/200?random=4',
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
              user_id: '1',
              type: 'flora'
            },
            {
              id: 'mock_5',
              common_name: 'Samán',
              scientific_name: 'Samanea saman',
              description: 'Árbol de gran copa, ideal para sombra',
              latitude: 4.6090,
              longitude: -74.0810,
              height_meters: 30,
              diameter_cm: 120,
              health_status: 'Bueno',
              syncStatus: 'pending',
              status: 'pending',
              image_url: 'https://picsum.photos/300/200?random=5',
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días atrás
              user_id: '1',
              type: 'flora'
            },
            // FAUNA - Animales mock
            {
              id: 'mock_animal_1',
              common_name: 'Colibrí Esmeralda',
              scientific_name: 'Amazilia tzacatl',
              description: 'Pequeño colibrí con plumaje verde brillante',
              latitude: 4.6095,
              longitude: -74.0815,
              animal_class: 'Aves',
              habitat: 'Jardines y áreas florales',
              behavior: 'Diurno, se alimenta de néctar',
              syncStatus: 'approved',
              status: 'approved',
              image_url: 'https://picsum.photos/300/200?random=6&blur=1',
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
              user_id: '1',
              type: 'fauna'
            },
            {
              id: 'mock_animal_2',
              common_name: 'Ardilla Común',
              scientific_name: 'Sciurus granatensis',
              description: 'Ardilla nativa de color gris con cola esponjosa',
              latitude: 4.6102,
              longitude: -74.0818,
              animal_class: 'Mamíferos',
              habitat: 'Árboles y zonas verdes',
              behavior: 'Diurno, muy activa en las mañanas',
              syncStatus: 'pending',
              status: 'pending',
              image_url: 'https://picsum.photos/300/200?random=7&blur=1',
              created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 horas atrás
              user_id: '1',
              type: 'fauna'
            },
            {
              id: 'mock_animal_3',
              common_name: 'Mariposa Monarca',
              scientific_name: 'Danaus plexippus',
              description: 'Mariposa migratoria de color naranja con bordes negros',
              latitude: 4.6088,
              longitude: -74.0812,
              animal_class: 'Insectos',
              habitat: 'Jardines con flores',
              behavior: 'Diurno, migratoria estacional',
              syncStatus: 'approved',
              status: 'approved',
              image_url: 'https://picsum.photos/300/200?random=8&blur=1',
              created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
              user_id: '2',
              type: 'fauna'
            }
          ];
          resolve(mockTrees);
        }, 500);
      });

      const data = await Promise.race([mockPromise, timeoutPromise]);
      
      console.log('✅ Árboles obtenidos de BD (mock):', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error obteniendo árboles de BD:', error);
      if (error.message === 'Timeout en getTreesFromDatabase') {
        console.warn('⏰ Timeout en consulta de BD - continuando sin árboles de BD');
      }
      return [];
    }
  }

  // Sincronizar todos los árboles pendientes
  async syncAllPendingTrees(userId) {
    try {
      const localTrees = await this.getLocalTrees();
      const pendingTrees = localTrees.filter(tree => tree.syncStatus === 'pending');
      
      console.log(`🔄 Sincronizando ${pendingTrees.length} árboles pendientes...`);
      
      const results = [];
      for (const tree of pendingTrees) {
        try {
          const syncedTree = await this.syncTreeToDatabase(tree, userId);
          results.push({ success: true, tree: syncedTree });
        } catch (error) {
          results.push({ success: false, error, tree });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`✅ Sincronización completada: ${successful} exitosos, ${failed} fallidos`);
      
      return {
        total: pendingTrees.length,
        successful,
        failed,
        results
      };
    } catch (error) {
      console.error('❌ Error en sincronización masiva:', error);
      throw error;
    }
  }

  // Obtener todos los árboles (locales + base de datos)
  async getAllTrees(userId) {
    try {
      console.log('🔍 [TreeStorageService] getAllTrees - User ID:', userId);
      
      // Timeout para evitar colgarse
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout en getAllTrees')), 5000);
      });
      
      const dataPromise = Promise.all([
        this.getLocalTrees(),
        this.getTreesFromDatabase()
      ]);
      
      const [localTrees, databaseTrees] = await Promise.race([dataPromise, timeoutPromise]);

      console.log('🔍 [TreeStorageService] Árboles locales:', localTrees.length);
      console.log('🔍 [TreeStorageService] Árboles de BD:', databaseTrees.length);

      // Los árboles locales son aquellos que no se han enviado al servidor
      const localTreesOnly = localTrees.filter(tree => 
        tree.syncStatus === 'pending' || tree.syncStatus === 'error'
      ).map(tree => ({
        ...tree,
        source: 'local',
        canEdit: true
      }));

      // Combinar árboles locales y de base de datos
      const allTrees = [
        ...localTreesOnly,
        ...databaseTrees.map(tree => ({
          ...tree,
          source: 'database',
          canEdit: tree.user_id === userId 
        }))
      ];

      // Ordenar por fecha de creación
      allTrees.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

      console.log(`📊 [TreeStorageService] Total de árboles: ${allTrees.length} (${localTreesOnly.length} locales, ${databaseTrees.length} de BD)`);
      console.log('🔍 [TreeStorageService] Primer árbol resultado:', allTrees[0]);
      
      return allTrees;
    } catch (error) {
      console.error('❌ [TreeStorageService] Error obteniendo todos los árboles:', error);
      
      // Si hay timeout, intentar solo con árboles locales
      if (error.message === 'Timeout en getAllTrees') {
        console.log('⏰ Timeout detectado, cargando solo árboles locales...');
        try {
          const localTrees = await this.getLocalTrees();
          return localTrees.map(tree => ({
            ...tree,
            source: 'local',
            canEdit: true
          }));
        } catch (localError) {
          console.error('❌ Error cargando árboles locales:', localError);
          return [];
        }
      }
      
      return [];
    }
  }

  // Limpiar árboles sincronizados exitosamente (opcional)
  async cleanupSyncedTrees() {
    try {
      const trees = await this.getLocalTrees();
      const unsyncedTrees = trees.filter(tree => tree.syncStatus !== 'approved');
      await AsyncStorage.setItem(TREES_STORAGE_KEY, JSON.stringify(unsyncedTrees));
      
      console.log(`🧹 Limpieza completada: ${trees.length - unsyncedTrees.length} árboles sincronizados eliminados`);
    } catch (error) {
      console.error('❌ Error en limpieza:', error);
    }
  }

  // Obtener estadísticas de sincronización
  async getSyncStats() {
    try {
      const localTrees = await this.getLocalTrees();
      const pending = localTrees.filter(tree => tree.syncStatus === 'pending').length;
      const approved = localTrees.filter(tree => tree.syncStatus === 'approved').length;
      const errors = localTrees.filter(tree => tree.syncStatus === 'error').length;
      
      return { total: localTrees.length, pending, approved, errors };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { total: 0, pending: 0, approved: 0, errors: 0 };
    }
  }
}

export default new TreeStorageService();
