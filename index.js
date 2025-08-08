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
app.use(express.static(path.join(__dirname, 'public')));

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
app.use('/rifas', rifasRouter); // ⬅️ El archivo Rifas.html ya no está en public

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// API para obtener usuario actual
app.get('/api/user', (req, res) => {
  if (req.session && req.session.user && req.session.user.email) {
    res.json({ email: req.session.user.email });
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
});

// Iniciar servidor
app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor corriendo en http://192.168.1.14:3000');
});
