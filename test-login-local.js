// Script de prueba local para verificar el sistema de login
// Ejecutar con: node test-login-local.js

const fetch = require('node-fetch');

const API_BASE_URL = 'https://explora.ieeetadeo.org/biodiversity-app.php/api';

async function testAPIHealth() {
    console.log('🌐 Probando conexión a la API...');
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const result = await response.json();
        console.log('✅ API Health:', result);
        return true;
    } catch (error) {
        console.error('❌ Error conectando a API:', error.message);
        return false;
    }
}

async function testLogin(email, password) {
    console.log(`🔐 Probando login: ${email}`);
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const user = await response.json();
            console.log(`✅ Login exitoso: ${user.email} (${user.role})`);
            return user;
        } else {
            console.log(`❌ Login fallido: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error en login: ${error.message}`);
        return null;
    }
}

async function testGetUsers() {
    console.log('👥 Obteniendo lista de usuarios...');
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const users = await response.json();
        console.log(`✅ Usuarios encontrados: ${users.length}`);
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - ID: ${user.id}`);
        });
        return users;
    } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error.message);
        return [];
    }
}

async function runTests() {
    console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA DE LOGIN\n');

    // 1. Probar conexión API
    const apiHealthy = await testAPIHealth();
    if (!apiHealthy) {
        console.log('❌ No se puede continuar sin conexión a la API');
        return;
    }

    console.log('\n' + '='.repeat(50));

    // 2. Obtener usuarios existentes
    await testGetUsers();

    console.log('\n' + '='.repeat(50));

    // 3. Probar login con usuarios de prueba
    const testCredentials = [
        { email: 'admin@biodiversidad.com', password: 'admin123' },
        { email: 'scientist@biodiversidad.com', password: 'scientist123' },
        { email: 'explorer@biodiversidad.com', password: 'explorer123' },
        { email: 'test@test.com', password: 'test123' },
        { email: 'usuario_inexistente@test.com', password: 'wrong123' }
    ];

    for (const cred of testCredentials) {
        await testLogin(cred.email, cred.password);
    }

    console.log('\n🎉 PRUEBAS COMPLETADAS');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Abrir la app en el navegador');
    console.log('2. Probar login con las credenciales de prueba');
    console.log('3. Verificar que la navegación funcione correctamente');
    console.log('4. Confirmar que los datos sean específicos por usuario');
}

// Ejecutar pruebas
runTests().catch(console.error);
