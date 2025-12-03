const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// Importar rutas
const loginRoutes = require('./login');
const dashboardRoutes = require('./dashboard');
const rifasRouter = require('./routes/rifasRouter');

// Configurar middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir solo archivos públicos que no necesitan autenticación
app.use(express.static(path.join(__dirname, 'Public'))); // ← "Public" con P mayúscula

// Configurar sesión
app.use(session({
  secret: 'claveUltraSecreta',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Rutas
app.use('/', loginRoutes);
app.use('/', dashboardRoutes);
app.use('/rifas', rifasRouter);

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'login.html'));
});

// API para obtener usuario actual
app.get('/api/user', (req, res) => {
  if (req.session && req.session.user && req.session.user.email) {
    res.json({ email: req.session.user.email });
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
});

// Iniciar servidor: local = localhost, Render = 0.0.0.0
const PORT = process.env.PORT || 3000;
const HOST = process.env.RENDER ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});

// AL FINAL de tu index.js, antes del app.listen()

// ============================================
// 🆓 BALANCEO DE CARGAS GRATIS (para Render)
// ============================================

// 1. Health Check Endpoint (obligatorio para Render)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Rifas System',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
  });
});

// 2. Stats para ver balanceo GRATIS
let requestCount = 0;
const instanceId = `server-${Math.random().toString(36).substr(2, 4)}`;

app.use((req, res, next) => {
  requestCount++;
  console.log(`📦 Request #${requestCount} to ${req.path} - Server: ${instanceId}`);
  next();
});

app.get('/balance-info', (req, res) => {
  res.json({
    message: '✅ Balanceo de Cargas Activado (Gratis)',
    instance: instanceId,
    totalRequests: requestCount,
    uptime: `${Math.floor(process.uptime())} segundos`,
    memoryUsage: {
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
    },
    loadAvg: require('os').loadavg(),
    platform: process.platform
  });
});

// 3. Página de prueba de balanceo (HTML simple)
app.get('/test-balanceo', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🆓 Test Balanceo Gratis</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Arial'; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 30px;
                margin-top: 50px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            h1 { color: #fff; margin-bottom: 20px; text-align: center; }
            .server-card {
                background: rgba(255,255,255,0.15);
                padding: 20px;
                border-radius: 15px;
                margin: 15px 0;
                border-left: 5px solid #4CAF50;
            }
            .btn {
                background: linear-gradient(45deg, #4CAF50, #45a049);
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 50px;
                font-size: 18px;
                cursor: pointer;
                margin: 10px;
                transition: transform 0.3s;
                text-decoration: none;
                display: inline-block;
            }
            .btn:hover { transform: translateY(-3px); }
            .result { 
                background: rgba(0,0,0,0.3); 
                padding: 15px; 
                border-radius: 10px; 
                margin-top: 20px;
                font-family: monospace;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎯 TEST DE BALANCEO GRATIS</h1>
            
            <div class="server-card">
                <h3>🆓 Información del Servidor Actual</h3>
                <p><strong>ID Instancia:</strong> ${instanceId}</p>
                <p><strong>Total Requests:</strong> ${requestCount}</p>
                <p><strong>Tiempo Activo:</strong> ${Math.floor(process.uptime())} segundos</p>
            </div>
            
            <button class="btn" onclick="testBalanceo()">🔄 Probar Balanceo</button>
            <a href="/balance-info" class="btn" target="_blank">📊 Ver Info Técnica</a>
            <a href="/health" class="btn" target="_blank">❤️ Health Check</a>
            
            <div id="resultados" class="result"></div>
        </div>
        
        <script>
            async function testBalanceo() {
                const resultados = document.getElementById('resultados');
                resultados.innerHTML = '🔄 Probando... (10 peticiones)';
                
                let servers = {};
                
                for(let i = 1; i <= 10; i++) {
                    try {
                        const response = await fetch('/balance-info');
                        const data = await response.json();
                        const server = data.instance;
                        
                        servers[server] = (servers[server] || 0) + 1;
                        
                        resultados.innerHTML = 
                            \`Testando... (\${i}/10) - Último servidor: \${server}<br>\` +
                            Object.entries(servers).map(([srv, count]) => 
                                \`• \${srv}: \${count} peticiones\`
                            ).join('<br>');
                            
                        await new Promise(r => setTimeout(r, 500));
                    } catch(e) {
                        console.error(e);
                    }
                }
                
                const totalServers = Object.keys(servers).length;
                const conclusion = totalServers > 1 
                    ? \`✅ ¡BALANCEO DETECTADO! (\${totalServers} servidores)\`
                    : \`⚠️ Solo un servidor detectado\`;
                
                resultados.innerHTML += \`<br><br><strong>\${conclusion}</strong>\`;
            }
            
            // Test automático
            window.onload = testBalanceo;
        </script>
    </body>
    </html>
  `);
});

console.log('✅ Balanceo de cargas gratis activado!');
console.log(`🏷️ ID de esta instancia: ${instanceId}`);