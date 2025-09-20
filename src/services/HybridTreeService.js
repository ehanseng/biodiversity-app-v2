// Servicio híbrido que maneja localStorage Y MySQL
import TreeStorageService from './TreeStorageService';
import mySQLService from './MySQLService';
import { useAuth } from '../contexts/NewAuthContext';

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
          
          const mysqlData = {
            ...cleanTreeData,
            image_url: processedImageUrl
          };

          mysqlResult = await mySQLService.createRecord(mysqlData);
          console.log('✅ [HybridTreeService] Guardado en MySQL exitoso:', mysqlResult.record?.id);
          
          // Si MySQL funciona, también guardar en localStorage para sincronización
          const localData = {
            ...cleanTreeData,
            image_url: processedImageUrl,
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
      const pendingTrees = localTrees.filter(tree => 
        tree.syncStatus === 'pending' && tree.source === 'local'
      );

      console.log(`📊 [HybridTreeService] ${pendingTrees.length} árboles pendientes de sincronizar`);

      let synced = 0;
      let errors = 0;

      for (const tree of pendingTrees) {
        try {
          const mysqlData = {
            user_id: tree.user_id,
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
            image_url: tree.image_url
          };

          const result = await mySQLService.createRecord(mysqlData);
          
          // Actualizar el árbol local con el ID de MySQL
          tree.mysql_id = result.record.id;
          tree.syncStatus = 'synced';
          tree.source = 'mysql';
          
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
}

// Exportar instancia singleton
const hybridTreeService = new HybridTreeService();
export default hybridTreeService;
