import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const TREES_STORAGE_KEY = '@biodiversity_trees';
const SYNC_STATUS_KEY = '@biodiversity_sync_status';

class TreeStorageService {
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
      
      console.log('✅ Árbol guardado localmente:', newTree.id);
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
      return treesJson ? JSON.parse(treesJson) : [];
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
        height: localTree.height || null,
        diameter: localTree.diameter || null,
        health_status: localTree.health_status || null,
        approval_status: 'pending',
        created_at: localTree.createdAt,
      };

      const { data, error } = await supabase
        .from('trees')
        .insert([treeData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar el árbol local con el ID de la base de datos
      await this.updateLocalTreeSyncStatus(localTree.id, 'approved', data.id);
      
      console.log('✅ Árbol sincronizado con BD:', data.id);
      return data;
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
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('✅ Árboles obtenidos de BD:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error obteniendo árboles de BD:', error);
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
      
      const [localTrees, databaseTrees] = await Promise.all([
        this.getLocalTrees(),
        this.getTreesFromDatabase()
      ]);

      console.log('🔍 [TreeStorageService] Árboles locales:', localTrees.length);
      console.log('🔍 [TreeStorageService] Árboles de BD:', databaseTrees.length);

      // Los árboles locales son aquellos que no se han enviado al servidor
      const localTreesOnly = localTrees.filter(tree => 
        !tree.databaseId // Si no tiene databaseId, es puramente local
      );

      console.log('🔍 [TreeStorageService] Árboles puramente locales:', localTreesOnly.length);

      const allTrees = [
        ...localTreesOnly.map(tree => ({ 
          ...tree, 
          source: 'local', 
          canEdit: true 
        })),
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
