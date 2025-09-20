// Servicio híbrido que maneja localStorage Y MySQL
import TreeStorageService from './TreeStorageService';
import mySQLService from './MySQLService';
import UserDataManager from '../utils/UserDataManager';
import SimpleTreeStorage from './SimpleTreeStorage';

class HybridTreeService {
  constructor() {
    this.preferMySQL = true; // Preferir MySQL si está disponible
  }

  // Crear árbol con soporte híbrido (localStorage + MySQL)
  async createTree(treeData, imageUri = null) {
    try {
      console.log('🌳 [HybridTreeService] Iniciando creación de árbol...');
      console.log('📋 [HybridTreeService] Datos recibidos:', treeData);

      // Limpiar y validar datos
      const cleanTreeData = {
        user_id: treeData.user_id || 1, // Usuario por defecto
        common_name: treeData.common_name?.trim(),
        scientific_name: treeData.scientific_name?.trim() || null,
        description: treeData.description?.trim() || null,
        latitude: parseFloat(treeData.latitude),
        longitude: parseFloat(treeData.longitude),
        location_description: treeData.location_description?.trim() || null,
        height_meters: treeData.height_meters ? parseFloat(treeData.height_meters) : null,
        diameter_cm: treeData.diameter_cm ? parseFloat(treeData.diameter_cm) : null,
        health_status: treeData.health_status?.trim() || null,
        type: 'flora' // Por defecto es flora
      };

      // Validaciones básicas
      if (!cleanTreeData.common_name || !cleanTreeData.latitude || !cleanTreeData.longitude) {
        throw new Error('Faltan campos requeridos: nombre común, latitud, longitud');
      }

      console.log('✅ [HybridTreeService] Datos validados:', cleanTreeData);

      // Procesar imagen si existe
      let processedImageUrl = null;
      if (imageUri) {
        try {
          console.log('📸 [HybridTreeService] Procesando imagen...');
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          const reader = new FileReader();
          processedImageUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          
          console.log('✅ [HybridTreeService] Imagen convertida a base64');
        } catch (error) {
          console.error('❌ [HybridTreeService] Error procesando imagen:', error);
          processedImageUrl = imageUri; // Fallback
        }
      }

      // Intentar guardar en MySQL primero
      let mysqlResult = null;
      let localResult = null;

      if (this.preferMySQL) {
        try {
          console.log('🗄️ [HybridTreeService] Intentando guardar en MySQL...');
          
          // Filtrar image_url para evitar URLs muy largas, blob o base64
          let filteredImageUrl = null;
          if (processedImageUrl) {
            // Si es una URL blob, base64 o muy larga, usar imagen por defecto
            if (processedImageUrl.startsWith('blob:') || 
                processedImageUrl.startsWith('data:image/') || 
                processedImageUrl.length > 2000) {
              filteredImageUrl = `https://picsum.photos/300/200?random=${Date.now()}`;
              console.log(`📷 [HybridTreeService] Imagen base64/blob reemplazada en createTree (longitud: ${processedImageUrl.length} caracteres)`);
            } else {
              filteredImageUrl = processedImageUrl;
              console.log(`📷 [HybridTreeService] Imagen válida en createTree (longitud: ${processedImageUrl.length} caracteres)`);
            }
          }
          
          const mysqlData = {
            ...cleanTreeData,
            image_url: filteredImageUrl
          };

          mysqlResult = await mySQLService.createRecord(mysqlData);
          console.log('✅ [HybridTreeService] Guardado en MySQL exitoso:', mysqlResult.record?.id);
          
          // Si MySQL funciona, también guardar en localStorage para sincronización
          const localData = {
            ...cleanTreeData,
            image_url: filteredImageUrl, // Usar la imagen filtrada
            mysql_id: mysqlResult.record?.id,
            syncStatus: 'synced',
            source: 'mysql',
            createdAt: new Date().toISOString()
          };
          
          localResult = await TreeStorageService.saveTreeLocally(localData);
          console.log('✅ [HybridTreeService] También guardado en localStorage para cache');

        } catch (mysqlError) {
          console.error('❌ [HybridTreeService] Error en MySQL:', mysqlError.message);
          console.log('🔄 [HybridTreeService] Fallback a localStorage...');
        }
      }

      // Si MySQL falló o no está disponible, guardar solo en localStorage
      if (!mysqlResult) {
        console.log('💾 [HybridTreeService] Guardando en localStorage...');
        
        const localData = {
          ...cleanTreeData,
          image_url: processedImageUrl,
          syncStatus: 'pending',
          source: 'local',
          createdAt: new Date().toISOString()
        };
        
        localResult = await TreeStorageService.saveTreeLocally(localData);
        console.log('✅ [HybridTreeService] Guardado en localStorage:', localResult.id);
      }

      // Determinar el resultado final
      const finalResult = mysqlResult || localResult;
      const resultTree = mysqlResult ? {
        ...mysqlResult.record,
        id: `mysql_${mysqlResult.record.id}`,
        source: 'mysql'
      } : localResult;

      console.log('🎉 [HybridTreeService] Árbol creado exitosamente');
      console.log('📊 [HybridTreeService] Guardado en:', mysqlResult ? 'MySQL + localStorage' : 'localStorage');
      
      return {
        success: true,
        tree: resultTree,
        source: mysqlResult ? 'mysql' : 'localStorage',
        message: mysqlResult ? 
          'Árbol guardado en base de datos' : 
          'Árbol guardado localmente (se sincronizará cuando haya conexión)'
      };

    } catch (error) {
      console.error('❌ [HybridTreeService] Error creando árbol:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error creando el árbol'
      };
    }
  }

  // Obtener todos los árboles (híbrido)
  async getAllTrees() {
    try {
      console.log('📋 [HybridTreeService] Obteniendo todos los árboles...');
      
      let mysqlTrees = [];
      let localTrees = [];

      // Intentar obtener de MySQL
      try {
        const mysqlRecords = await mySQLService.getAllRecords();
        mysqlTrees = mysqlRecords.map(record => ({
          ...record,
          id: `mysql_${record.id}`,
          source: 'mysql',
          syncStatus: 'synced'
        }));
        console.log(`✅ [HybridTreeService] ${mysqlTrees.length} árboles de MySQL`);
      } catch (error) {
        console.error('❌ [HybridTreeService] Error obteniendo de MySQL:', error.message);
      }

      // Obtener de localStorage
      try {
        localTrees = await TreeStorageService.getLocalTrees();
        // Filtrar los que no están ya en MySQL
        localTrees = localTrees.filter(tree => 
          !tree.mysql_id || !mysqlTrees.find(mt => mt.id === `mysql_${tree.mysql_id}`)
        );
        console.log(`✅ [HybridTreeService] ${localTrees.length} árboles locales únicos`);
      } catch (error) {
        console.error('❌ [HybridTreeService] Error obteniendo localStorage:', error.message);
      }

      // Combinar resultados
      const allTrees = [...mysqlTrees, ...localTrees];
      console.log(`📊 [HybridTreeService] Total: ${allTrees.length} árboles`);
      
      return allTrees;
    } catch (error) {
      console.error('❌ [HybridTreeService] Error obteniendo árboles:', error);
      return [];
    }
  }

  // Configurar preferencia de almacenamiento
  setPreferMySQL(prefer = true) {
    this.preferMySQL = prefer;
    console.log(`⚙️ [HybridTreeService] Preferencia MySQL: ${prefer ? 'Activada' : 'Desactivada'}`);
  }

  // Sincronizar localStorage con MySQL
  async syncLocalToMySQL() {
    try {
      console.log('🔄 [HybridTreeService] Sincronizando localStorage → MySQL...');
      
      const localTrees = await TreeStorageService.getLocalTrees();
      
      // Obtener IDs de MySQL que ya existen para evitar duplicados
      let existingMySQLIds = [];
      try {
        const mysqlRecords = await mySQLService.getAllRecords();
        existingMySQLIds = mysqlRecords.map(r => r.id);
        console.log(`📋 [HybridTreeService] IDs existentes en MySQL: ${existingMySQLIds.length}`);
      } catch (error) {
        console.warn('⚠️ [HybridTreeService] No se pudieron obtener registros de MySQL:', error.message);
      }

      // Filtrar árboles que no han sido sincronizados
      const pendingTrees = localTrees.filter(tree => {
        // Si ya tiene mysql_id y existe en el servidor, no sincronizar
        if (tree.mysql_id && existingMySQLIds.includes(parseInt(tree.mysql_id))) {
          console.log(`⏭️ [HybridTreeService] Saltando ${tree.common_name} - ya existe en MySQL (ID: ${tree.mysql_id})`);
          return false;
        }
        
        // Debe tener nombre común y coordenadas válidas
        return tree.common_name && 
               tree.latitude && tree.longitude &&
               !isNaN(parseFloat(tree.latitude)) && !isNaN(parseFloat(tree.longitude));
      });

      console.log(`📊 [HybridTreeService] ${pendingTrees.length} árboles pendientes de sincronizar`);
      console.log(`🔍 [HybridTreeService] Total árboles locales: ${localTrees.length}`);

      let synced = 0;
      let errors = 0;

      for (const tree of pendingTrees) {
        try {
          console.log(`🌳 [HybridTreeService] Sincronizando: ${tree.common_name}`);
          
          // Convertir user_id a entero (MySQL espera INT, no UUID)
          let userId = 1; // Default
          if (tree.user_id) {
            // Si es un número, usarlo
            if (!isNaN(parseInt(tree.user_id))) {
              userId = parseInt(tree.user_id);
            } else {
              // Si es UUID o string, mapear a usuario por defecto
              userId = 1; // Explorer por defecto
            }
          }
          
          // Filtrar image_url para evitar URLs muy largas, blob o base64
          let imageUrl = null;
          if (tree.image_url) {
            // Si es una URL blob, base64 o muy larga, usar imagen por defecto
            if (tree.image_url.startsWith('blob:') || 
                tree.image_url.startsWith('data:image/') || 
                tree.image_url.length > 2000) {
              imageUrl = `https://picsum.photos/300/200?random=${tree.id || Date.now()}`;
              console.log(`📷 [HybridTreeService] URL de imagen problemática reemplazada para: ${tree.common_name} (tipo: ${tree.image_url.substring(0, 20)}..., longitud: ${tree.image_url.length} caracteres)`);
            } else {
              imageUrl = tree.image_url;
              console.log(`📷 [HybridTreeService] URL de imagen válida para: ${tree.common_name} (longitud: ${tree.image_url.length} caracteres)`);
            }
          }

          const mysqlData = {
            user_id: userId,
            type: tree.type || 'flora',
            common_name: tree.common_name,
            scientific_name: tree.scientific_name,
            description: tree.description,
            latitude: tree.latitude,
            longitude: tree.longitude,
            location_description: tree.location_description,
            height_meters: tree.height_meters,
            diameter_cm: tree.diameter_cm,
            health_status: tree.health_status,
            animal_class: tree.animal_class,
            habitat: tree.habitat,
            behavior: tree.behavior,
            image_url: imageUrl
          };

          const result = await mySQLService.createRecord(mysqlData);
          
          // Actualizar el árbol local con el ID de MySQL
          tree.mysql_id = result.record.id;
          tree.syncStatus = 'synced';
          tree.source = 'mysql';
          
          // Actualizar en localStorage
          await TreeStorageService.saveTreeLocally(tree);
          
          synced++;
          console.log(`✅ [HybridTreeService] Sincronizado: ${tree.common_name}`);
        } catch (error) {
          errors++;
          console.error(`❌ [HybridTreeService] Error sincronizando ${tree.common_name}:`, error.message);
        }
      }

      console.log(`🎉 [HybridTreeService] Sincronización completada: ${synced} exitosos, ${errors} errores`);
      
      return { synced, errors, total: pendingTrees.length };
    } catch (error) {
      console.error('❌ [HybridTreeService] Error en sincronización:', error);
      throw error;
    }
  }

  // Limpiar datos locales duplicados o corruptos
  async cleanLocalData() {
    try {
      console.log('🧹 [HybridTreeService] Limpiando datos locales...');
      
      const localTrees = SimpleTreeStorage.getLocalTrees();
      console.log(`📊 [HybridTreeService] Árboles locales antes de limpiar: ${localTrees.length}`);
      
      // Obtener registros existentes en MySQL
      let mysqlRecords = [];
      try {
        mysqlRecords = await mySQLService.getAllRecords();
        console.log(`📋 [HybridTreeService] Registros en MySQL: ${mysqlRecords.length}`);
      } catch (error) {
        console.warn('⚠️ [HybridTreeService] No se pudieron obtener registros de MySQL:', error.message);
      }
      
      // Filtrar y limpiar árboles
      const cleanedTrees = [];
      let removed = 0;
      let marked_synced = 0;
      
      for (const tree of localTrees) {
        // Validar que tenga datos básicos
        if (!tree.common_name || !tree.latitude || !tree.longitude ||
            isNaN(parseFloat(tree.latitude)) || isNaN(parseFloat(tree.longitude))) {
          console.log(`🗑️ [HybridTreeService] Eliminando árbol inválido: ${tree.common_name || 'Sin nombre'}`);
          removed++;
          continue;
        }
        
        // Limpiar imágenes base64 problemáticas
        if (tree.image_url && (tree.image_url.startsWith('data:image/') || tree.image_url.startsWith('blob:'))) {
          tree.image_url = `https://picsum.photos/300/200?random=${tree.id || Date.now()}`;
          console.log(`📷 [HybridTreeService] Imagen base64/blob limpiada para: ${tree.common_name}`);
        }
        
        // Buscar si ya existe en MySQL (por nombre y coordenadas similares)
        const existsInMySQL = mysqlRecords.find(mysql => 
          mysql.common_name === tree.common_name &&
          Math.abs(parseFloat(mysql.latitude) - parseFloat(tree.latitude)) < 0.0001 &&
          Math.abs(parseFloat(mysql.longitude) - parseFloat(tree.longitude)) < 0.0001
        );
        
        if (existsInMySQL) {
          // Marcar como sincronizado
          tree.mysql_id = existsInMySQL.id;
          tree.syncStatus = 'synced';
          tree.source = 'mysql';
          marked_synced++;
          console.log(`✅ [HybridTreeService] Marcando como sincronizado: ${tree.common_name} (MySQL ID: ${existsInMySQL.id})`);
        }
        
        // Verificar duplicados locales
        const isDuplicate = cleanedTrees.find(existing => 
          existing.common_name === tree.common_name &&
          Math.abs(parseFloat(existing.latitude) - parseFloat(tree.latitude)) < 0.0001 &&
          Math.abs(parseFloat(existing.longitude) - parseFloat(tree.longitude)) < 0.0001
        );
        
        if (!isDuplicate) {
          cleanedTrees.push(tree);
        } else {
          console.log(`🗑️ [HybridTreeService] Eliminando duplicado local: ${tree.common_name}`);
          removed++;
        }
      }
      
      console.log(`🧹 [HybridTreeService] Limpieza completada:`);
      console.log(`   📊 Original: ${localTrees.length}`);
      console.log(`   ✅ Limpios: ${cleanedTrees.length}`);
      console.log(`   🗑️ Eliminados: ${removed}`);
      console.log(`   🔄 Marcados como sincronizados: ${marked_synced}`);
      
      // Guardar datos limpios
      SimpleTreeStorage.saveLocalTrees(cleanedTrees);
      
      return {
        original: localTrees.length,
        cleaned: cleanedTrees.length,
        removed: removed,
        marked_synced: marked_synced
      };
    } catch (error) {
      console.error('❌ [HybridTreeService] Error limpiando datos:', error);
      throw error;
    }
  }

  // Sincronización automática al iniciar la app
  async autoSync() {
    try {
      console.log('🔄 [HybridTreeService] Iniciando sincronización automática...');
      
      // 1. Limpiar datos locales y marcar como sincronizados los que ya existen
      const cleanResult = await this.cleanLocalData();
      console.log(`🧹 [HybridTreeService] Auto-limpieza: ${cleanResult.marked_synced} marcados como sincronizados`);
      
      // 2. Obtener registros del servidor para detectar nuevos
      let serverRecords = [];
      try {
        serverRecords = await mySQLService.getAllRecords();
        console.log(`📥 [HybridTreeService] Registros del servidor: ${serverRecords.length}`);
      } catch (error) {
        console.warn('⚠️ [HybridTreeService] No se pudieron obtener registros del servidor:', error.message);
        return { cleaned: cleanResult, server_records: 0, local_pending: 0 };
      }
      
      // Obtener árboles locales pendientes de sincronizar (específicos del usuario)
      const userStorageKey = UserDataManager.getUserStorageKey();
      const treesJson = localStorage.getItem(userStorageKey);
      const localTrees = treesJson ? JSON.parse(treesJson) : [];
      const pendingTrees = localTrees.filter(tree => 
        !tree.mysql_id && 
        (tree.syncStatus !== 'synced') && 
        tree.common_name &&
        tree.latitude && tree.longitude &&
        !isNaN(parseFloat(tree.latitude)) && !isNaN(parseFloat(tree.longitude))
      );
      
      console.log(`📊 [HybridTreeService] Auto-sync completado:`);
      console.log(`   🧹 Limpiados: ${cleanResult.removed}`);
      console.log(`   ✅ Marcados sincronizados: ${cleanResult.marked_synced}`);
      console.log(`   📥 Registros servidor: ${serverRecords.length}`);
      console.log(`   ⏳ Locales pendientes: ${pendingTrees.length}`);
      
      return {
        cleaned: cleanResult,
        server_records: serverRecords.length,
        local_pending: pendingTrees.length
      };
      
    } catch (error) {
      console.error('❌ [HybridTreeService] Error en sincronización automática:', error);
      return { error: error.message };
    }
  }
}

// Exportar instancia singleton
const hybridTreeService = new HybridTreeService();
export default hybridTreeService;
