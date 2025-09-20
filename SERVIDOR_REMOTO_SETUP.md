# 🌐 Configuración para Servidor MySQL Remoto

## 📋 Pasos para Conectar a Servidor Remoto

### 1️⃣ **Preparar Servidor MySQL Remoto**

#### **Crear Base de Datos:**
```sql
-- Ejecutar en tu servidor MySQL remoto
CREATE DATABASE biodiversity_db;
USE biodiversity_db;

-- Ejecutar el contenido de: backend/database/schema.sql
-- O usar el script: backend/setup-database.js
```

#### **Configurar Usuario MySQL:**
```sql
-- Crear usuario para la aplicación
CREATE USER 'biodiversity_user'@'%' IDENTIFIED BY 'password_seguro_aqui';

-- Dar permisos a la base de datos
GRANT ALL PRIVILEGES ON biodiversity_db.* TO 'biodiversity_user'@'%';
FLUSH PRIVILEGES;
```

#### **Configurar Firewall:**
- Abrir puerto **3306** para conexiones externas
- Permitir conexiones desde la IP de tu servidor backend
- Configurar SSL si es necesario

### 2️⃣ **Configurar Backend para Servidor Remoto**

#### **Archivo de Configuración:**
```bash
# En el directorio backend/
cp .env.production .env

# Editar .env con tus datos reales:
DB_HOST=tu-servidor-mysql.com
DB_USER=biodiversity_user
DB_PASSWORD=password_seguro_aqui
DB_NAME=biodiversity_db
```

#### **Probar Conexión:**
```bash
cd backend
node check-mysql.js
```

### 3️⃣ **Configurar Frontend para Servidor Remoto**

#### **Actualizar URL de API:**
```javascript
// En src/services/MySQLService.js
constructor() {
  this.baseURL = 'https://tu-servidor-backend.com/api';
  // O usar variable de entorno
  this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
}
```

#### **Variables de Entorno Frontend:**
```bash
# Crear .env en la raíz del proyecto
REACT_APP_API_URL=https://tu-servidor-backend.com/api
REACT_APP_ENVIRONMENT=production
```

### 4️⃣ **Despliegue del Backend**

#### **Opción A: Servidor VPS/Dedicado**
```bash
# Subir archivos del backend a tu servidor
scp -r backend/ usuario@tu-servidor.com:/path/to/app/

# En el servidor:
cd /path/to/app/backend
npm install
npm start
```

#### **Opción B: Servicios Cloud**
- **Heroku**: Agregar addon MySQL
- **DigitalOcean App Platform**: Configurar base de datos
- **AWS EC2 + RDS**: Instancia + base de datos
- **Google Cloud Run**: Con Cloud SQL

### 5️⃣ **Script de Migración de Datos**

#### **Migrar Datos Locales a Remoto:**
```javascript
// Usar MySQLTestScreen en la app
// O ejecutar script de migración:
cd backend
node migrate-to-remote.js
```

## 🔧 **Configuración Específica por Proveedor**

### **📊 cPanel/Shared Hosting:**
```env
DB_HOST=localhost
DB_USER=cpanel_usuario
DB_PASSWORD=password_cpanel
DB_NAME=cpanel_biodiversity_db
```

### **🌊 DigitalOcean:**
```env
DB_HOST=db-mysql-nyc3-12345-do-user-123456-0.b.db.ondigitalocean.com
DB_PORT=25060
DB_USER=doadmin
DB_PASSWORD=password_do
DB_NAME=biodiversity_db
DB_SSL=true
```

### **☁️ AWS RDS:**
```env
DB_HOST=biodiversity.cluster-abc123.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=password_aws
DB_NAME=biodiversity_db
```

### **🔵 Azure Database:**
```env
DB_HOST=biodiversity-server.mysql.database.azure.com
DB_USER=admin@biodiversity-server
DB_PASSWORD=password_azure
DB_NAME=biodiversity_db
DB_SSL=true
```

## 🧪 **Scripts de Prueba**

### **Probar Conexión Remota:**
```bash
cd backend
node -e "
const mysql = require('mysql2/promise');
async function test() {
  try {
    const conn = await mysql.createConnection({
      host: 'TU_HOST',
      user: 'TU_USER', 
      password: 'TU_PASSWORD',
      database: 'biodiversity_db'
    });
    console.log('✅ Conexión exitosa');
    await conn.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}
test();
"
```

### **Migrar Datos:**
```bash
# Ejecutar desde MySQLTestScreen en la app:
# Botón "Migrar desde localStorage"

# O usar script directo:
cd backend
node migrate-local-to-remote.js
```

## 🔒 **Seguridad**

### **SSL/TLS:**
- Usar conexiones cifradas
- Certificados válidos
- Configurar `DB_SSL=true`

### **Firewall:**
- Restringir acceso por IP
- Usar puertos no estándar si es posible
- Configurar fail2ban

### **Credenciales:**
- Passwords fuertes
- Rotar credenciales regularmente
- Usar variables de entorno

## 📊 **Monitoreo**

### **Logs del Backend:**
```bash
# Ver logs en tiempo real
tail -f /path/to/app/logs/backend.log

# O usar PM2
pm2 logs biodiversity-backend
```

### **Métricas MySQL:**
```sql
-- Ver conexiones activas
SHOW PROCESSLIST;

-- Ver estado de tablas
SHOW TABLE STATUS FROM biodiversity_db;

-- Ver tamaño de base de datos
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'biodiversity_db';
```

## 🎯 **Resultado Final**

Una vez configurado tendrás:
- ✅ **Backend** conectado a MySQL remoto
- ✅ **Frontend** apuntando al backend remoto
- ✅ **Datos sincronizados** entre local y remoto
- ✅ **App funcionando** desde cualquier lugar
- ✅ **Datos persistentes** en la nube

**¡Tu app de biodiversidad estará completamente en la nube!** 🌐🌳🦋
