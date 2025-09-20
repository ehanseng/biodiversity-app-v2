// Script para debuggear localStorage en el navegador
// Ejecutar en la consola del navegador

console.log('🔍 DEBUGGING STORAGE - Biodiversity App');
console.log('=====================================');

// Ver todas las claves en localStorage
console.log('📋 Todas las claves en localStorage:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`  ${i + 1}. ${key}`);
}

// Ver específicamente los árboles
const treesKey = '@biodiversity_trees';
const treesData = localStorage.getItem(treesKey);

console.log('\n🌳 Datos de árboles en localStorage:');
console.log('Clave:', treesKey);
console.log('Datos raw:', treesData);

if (treesData) {
  try {
    const parsedTrees = JSON.parse(treesData);
    console.log('Árboles parseados:', parsedTrees);
    console.log('Cantidad de árboles:', parsedTrees.length);
    
    parsedTrees.forEach((tree, index) => {
      console.log(`\n  Árbol ${index + 1}:`);
      console.log(`    ID: ${tree.id}`);
      console.log(`    Nombre: ${tree.common_name}`);
      console.log(`    Usuario: ${tree.user_id}`);
      console.log(`    Tipo: ${tree.type || 'Sin tipo'}`);
      console.log(`    Estado: ${tree.syncStatus || tree.status}`);
      console.log(`    Imagen: ${tree.image_url ? 'Sí' : 'No'}`);
    });
  } catch (error) {
    console.error('❌ Error parseando árboles:', error);
  }
} else {
  console.log('❌ No se encontraron datos de árboles en localStorage');
}

// Ver datos del usuario actual
const userKey = '@biodiversity_user';
const userData = localStorage.getItem(userKey);
console.log('\n👤 Usuario actual:');
console.log('Datos:', userData);

if (userData) {
  try {
    const parsedUser = JSON.parse(userData);
    console.log('Usuario parseado:', parsedUser);
    console.log('ID del usuario:', parsedUser.id);
  } catch (error) {
    console.error('❌ Error parseando usuario:', error);
  }
}

console.log('\n🔧 Para limpiar localStorage:');
console.log('localStorage.removeItem("@biodiversity_trees");');
console.log('localStorage.clear(); // Para limpiar todo');
