const mongoose = require('mongoose');
const misrifasSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true
  },
  estatus: {
    type: String,
    enum: ['activa', 'finalizada'],
    required: true
  },
  fecha_sorteo: {
    type: Date,
    required: true
  },
  hora_sorteo: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    required: true
  },
  oportunidades: {
    type: Number,
    default: 1
  },
  cantidad_boletos: {
    type: Number,
    required: true
  },
  precio: {
    type: Number,
    required: true
  },
  imagen: {
    data: Buffer,
    contentType: String
  },
  // NUEVO: Array de boletos ocupados
  boletosOcupados: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('Misrifas', misrifasSchema);

