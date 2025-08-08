const express = require('express');
const router = express.Router();
const path = require('path');

// Middleware para validar sesión
function checkAuth(req, res, next) {
  if (req.session && req.session.user && req.session.user.email) next();
  else res.redirect('/index.html'); // O '/login' si tienes ruta de login
}

// Ruta protegida para servir dashboard.html con headers anti-cache
router.get('/dashboard', checkAuth, (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Ruta para logout
router.post('/dashboard/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Error al cerrar sesión:', err);
        return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión.' });
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true });
    });
  } else {
    return res.json({ success: true });
  }
});

module.exports = router;
