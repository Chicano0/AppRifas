const express = require('express');
const multer = require('multer');
const path = require('path');
const Misrifas = require('../models/Misrifas');
const router = express.Router();

// Middleware para validar sesión
function checkAuth(req, res, next) {
  if (req.session && req.session.user && req.session.user.email) {
    next();
  } else {
    res.status(401).json({ message: 'No autorizado' });
  }
}

// Multer para imagen en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Validar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Ruta para mostrar página Rifas.html
router.get('/', checkAuth, (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '..', 'views', 'Rifas.html'));
});

// Ruta para la página de listado (agregar esta ruta)
router.get('/listado', checkAuth, (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '..', 'views', 'ListadoRifas.html'));
});

// API para verificar sesión (mover esta ruta antes que las otras)
router.get('/api/user', (req, res) => {
  if (req.session && req.session.user && req.session.user.email) {
    res.json({ email: req.session.user.email });
  } else {
    res.status(401).json({ message: 'No autorizado' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Error al cerrar sesión:', err);
        return res.status(500).json({ success: false, message: 'No se pudo cerrar sesión.' });
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true });
    });
  } else {
    res.json({ success: true });
  }
});

// Registrar rifa
router.post('/register', checkAuth, upload.single('imagen'), async (req, res) => {
  try {
    const {
      titulo,
      estatus,
      fecha_sorteo,
      hora_sorteo,
      categoria,
      oportunidades,
      cantidad_boletos,
      precio
    } = req.body;

    // Validaciones
    if (!titulo || !estatus || !fecha_sorteo || !hora_sorteo || !categoria || !precio) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'La imagen es obligatoria' });
    }

    const nuevaRifa = new Misrifas({
      titulo,
      estatus,
      fecha_sorteo: new Date(fecha_sorteo),
      hora_sorteo,
      categoria,
      oportunidades: Number(oportunidades) || 1,
      cantidad_boletos: Number(cantidad_boletos) || 1,
      precio: Number(precio),
      imagen: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    });

    await nuevaRifa.save();
    console.log('Rifa registrada exitosamente:', nuevaRifa._id);
    res.json({ message: 'Rifa registrada correctamente', rifaId: nuevaRifa._id });
  } catch (error) {
    console.error('Error en registrar rifa:', error);
    res.status(500).json({ message: 'Error al registrar la rifa: ' + error.message });
  }
});

// Listar rifas
router.get('/list', checkAuth, async (req, res) => {
  try {
    console.log('Obteniendo lista de rifas...');
    const rifas = await Misrifas.find({}).sort({ createdAt: -1 });
    console.log(`Se encontraron ${rifas.length} rifas`);
    
    res.json(rifas);
  } catch (error) {
    console.error('Error en listar rifas:', error);
    res.status(500).json({ message: 'Error al obtener rifas: ' + error.message });
  }
});

// Obtener una rifa específica
router.get('/get/:id', checkAuth, async (req, res) => {
  try {
    const rifa = await Misrifas.findById(req.params.id);
    if (!rifa) {
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }
    res.json(rifa);
  } catch (error) {
    console.error('Error al obtener rifa:', error);
    res.status(500).json({ message: 'Error al obtener la rifa: ' + error.message });
  }
});

// Editar rifa
router.put('/edit/:id', checkAuth, upload.single('imagen'), async (req, res) => {
  try {
    const id = req.params.id;
    console.log('=== EDITANDO RIFA ===');
    console.log('ID:', id);
    console.log('Body recibido:', req.body);
    console.log('Archivo recibido:', req.file ? req.file.originalname : 'Sin archivo');

    // Verificar que la rifa existe
    const rifaExistente = await Misrifas.findById(id);
    if (!rifaExistente) {
      console.log('Rifa no encontrada con ID:', id);
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    const updateData = { ...req.body };

    // Convertir tipos de datos
    if (updateData.oportunidades) {
      updateData.oportunidades = Number(updateData.oportunidades);
    }
    if (updateData.cantidad_boletos) {
      updateData.cantidad_boletos = Number(updateData.cantidad_boletos);
    }
    if (updateData.precio) {
      updateData.precio = Number(updateData.precio);
    }
    if (updateData.fecha_sorteo) {
      updateData.fecha_sorteo = new Date(updateData.fecha_sorteo);
    }

    // Actualizar imagen solo si se envió una nueva
    if (req.file) {
      updateData.imagen = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
      console.log('Nueva imagen agregada');
    }

    // Actualizar timestamp
    updateData.updatedAt = new Date();

    console.log('Datos a actualizar:', {
      ...updateData,
      imagen: updateData.imagen ? 'Imagen incluida' : 'Sin cambio de imagen'
    });

    // Realizar la actualización
    const rifaActualizada = await Misrifas.findByIdAndUpdate(
      id, 
      updateData, 
      { 
        new: true,
        runValidators: true
      }
    );

    if (!rifaActualizada) {
      console.log('No se pudo actualizar la rifa');
      return res.status(404).json({ message: 'No se pudo actualizar la rifa' });
    }

    console.log('Rifa actualizada exitosamente');
    res.json({ 
      message: 'Rifa actualizada correctamente', 
      rifa: rifaActualizada 
    });

  } catch (error) {
    console.error('Error en editar rifa:', error);
    res.status(500).json({ message: 'Error al actualizar la rifa: ' + error.message });
  }
});

// Eliminar rifa
router.delete('/delete/:id', checkAuth, async (req, res) => {
  try {
    const id = req.params.id;
    console.log('=== ELIMINANDO RIFA ===');
    console.log('ID a eliminar:', id);

    // Verificar que la rifa existe antes de eliminar
    const rifaExistente = await Misrifas.findById(id);
    if (!rifaExistente) {
      console.log('Rifa no encontrada con ID:', id);
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    console.log('Rifa encontrada, procediendo a eliminar:', rifaExistente.titulo);

    const rifaEliminada = await Misrifas.findByIdAndDelete(id);
    
    if (!rifaEliminada) {
      console.log('No se pudo eliminar la rifa');
      return res.status(500).json({ message: 'No se pudo eliminar la rifa' });
    }

    console.log('Rifa eliminada exitosamente');
    res.json({ 
      message: 'Rifa eliminada correctamente',
      rifaEliminada: {
        id: rifaEliminada._id,
        titulo: rifaEliminada.titulo
      }
    });

  } catch (error) {
    console.error('Error en eliminar rifa:', error);
    res.status(500).json({ message: 'Error al eliminar la rifa: ' + error.message });
  }
});

// *** NUEVA RUTA: Toggle estado de un boleto específico ***
router.post('/toggle-boleto/:id', checkAuth, async (req, res) => {
  try {
    const rifaId = req.params.id;
    const { numeroBoleto } = req.body;

    console.log('=== TOGGLE BOLETO ===');
    console.log('Rifa ID:', rifaId);
    console.log('Número de boleto:', numeroBoleto);

    // Validaciones
    if (!numeroBoleto || numeroBoleto < 1) {
      return res.status(400).json({ message: 'Número de boleto inválido' });
    }

    // Buscar la rifa
    const rifa = await Misrifas.findById(rifaId);
    if (!rifa) {
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    // Verificar que el número de boleto esté en el rango válido
    if (numeroBoleto > rifa.cantidad_boletos) {
      return res.status(400).json({ 
        message: `El número de boleto debe estar entre 1 y ${rifa.cantidad_boletos}` 
      });
    }

    // Inicializar array de boletos ocupados si no existe
    if (!rifa.boletosOcupados) {
      rifa.boletosOcupados = [];
    }

    // Verificar estado actual del boleto
    const index = rifa.boletosOcupados.indexOf(numeroBoleto);
    let accion;

    if (index > -1) {
      // El boleto está ocupado, liberarlo
      rifa.boletosOcupados.splice(index, 1);
      accion = 'liberado';
    } else {
      // El boleto está disponible, ocuparlo
      rifa.boletosOcupados.push(numeroBoleto);
      accion = 'ocupado';
    }

    // Actualizar timestamp
    rifa.updatedAt = new Date();

    // Guardar cambios
    await rifa.save();

    console.log(`Boleto ${numeroBoleto} ${accion} exitosamente`);

    res.json({ 
      message: `Boleto ${numeroBoleto} ${accion} correctamente`,
      numeroBoleto,
      accion,
      totalOcupados: rifa.boletosOcupados.length,
      totalDisponibles: rifa.cantidad_boletos - rifa.boletosOcupados.length
    });

  } catch (error) {
    console.error('Error en toggle boleto:', error);
    res.status(500).json({ message: 'Error al actualizar el boleto: ' + error.message });
  }
});

// Middleware de manejo de errores para multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 5MB.' });
    }
  }
  if (error.message === 'Solo se permiten archivos de imagen') {
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

// Ruta pública: obtener rifas activas (SIN checkAuth)
router.get('/activas', async (req, res) => {
  try {
    const rifasActivas = await Misrifas.find({ estatus: 'activa' }).sort({ createdAt: -1 });
    res.json(rifasActivas);
  } catch (error) {
    console.error('Error al obtener rifas activas:', error);
    res.status(500).json({ message: 'Error al obtener rifas activas: ' + error.message });
  }
});

// Ruta para gestión de boletos
router.get('/boletos', checkAuth, (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '..', 'views', 'GestionBoletos.html'));
});

module.exports = router;