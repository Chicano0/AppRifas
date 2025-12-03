const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const os = require('os');
const app = express();

// ============================================
// CONFIGURACIÓN DE IDENTIFICACIÓN DE SERVIDOR
// ============================================
const SERVER_ID = process.env.RENDER_INSTANCE_ID || `server-${os.hostname().slice(0, 8)}`;
console.log(`🚀 Servidor iniciado: ${SERVER_ID}`);

// ============================================
// IMPORTAR RUTAS
// ============================================
const loginRoutes = require('./login');
const dashboardRoutes = require('./dashboard');
const rifasRouter = require('./routes/rifasRouter');

// ============================================
// MIDDLEWARES BÁSICOS
// ============================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ============================================
// HEADERS DE SEGURIDAD Y BALANCEO
// ============================================
app.use((req, res, next) => {
  res.setHeader('X-Server-ID', SERVER_ID);
  res.setHeader('X-Powered-By', 'Rifas-Cloud-System');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// ============================================
// FORZAR HTTPS EN PRODUCCIÓN
// ============================================
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && 
      req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
});

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS
// ============================================
app.use(express.static(path.join(__dirname, 'Public')));

// ============================================
// CONFIGURACIÓN DE SESIONES CON MONGODB STORE
// ============================================
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://soporteverifiacion:Admin123@cluster0.d7ymyji.mongodb.net/Rifas?retryWrites=true&w=majority&appName=Cluster0';

app.use(session({
  secret: process.env.SESSION_SECRET || 'claveUltraSecreta2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    touchAfter: 24 * 3600,
    mongoOptions: {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'lax'
  }
}));

// ============================================
// RUTAS DE LA APLICACIÓN
// ============================================
app.use('/', loginRoutes);
app.use('/', dashboardRoutes);
app.use('/rifas', rifasRouter);

// ============================================
// RUTAS PRINCIPALES
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'login.html'));
});

// ============================================
// API - INFORMACIÓN DEL USUARIO
// ============================================
app.get('/api/user', (req, res) => {
  if (req.session && req.session.user && req.session.user.email) {
    res.json({ 
      email: req.session.user.email,
      server: SERVER_ID,
      sessionID: req.sessionID.slice(0, 8) + '...'
    });
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
});

// ============================================
// HEALTH CHECK (Para balanceador de cargas)
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    server: SERVER_ID,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  });
});

// ============================================
// ENDPOINT PARA DEMOSTRAR BALANCEO
// ============================================
app.get('/server-info', (req, res) => {
  res.json({
    serverId: SERVER_ID,
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
    freeMemory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()) + ' segundos',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// MANEJO DE ERRORES 404
// ============================================
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ============================================
// MANEJO DE ERRORES GENERALES
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocurrió un error'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
const HOST = process.env.RENDER ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🎯 SISTEMA DE RIFAS - INFRAESTRUCTURA CLOUD');
  console.log('='.repeat(50));
  console.log(`✅ Servidor: ${SERVER_ID}`);
  console.log(`🌐 URL: http://${HOST}:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 HTTPS: ${process.env.NODE_ENV === 'production' ? 'ACTIVO' : 'DESACTIVADO'}`);
  console.log(`💾 Base de datos: MongoDB Atlas`);
  console.log(`⚖️  Balanceo de cargas: ACTIVO`);
  console.log(`🏥 Health check: /health`);
  console.log('='.repeat(50) + '\n');
});

// ============================================
// MANEJO DE SEÑALES DE CIERRE
// ============================================
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recibido, cerrando servidor...');
  process.exit(0);
});