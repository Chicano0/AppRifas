const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
require('./db');
const mongoose = require('mongoose');
const path = require('path');

// Esquema de usuario
const UserSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Usa exactamente la colección 'Users' como en MongoDB Atlas
const User = mongoose.model('User', UserSchema, 'Users');

// Ruta de registro
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const userExist = await User.findOne({ email: normalizedEmail });
        if (userExist) return res.send('El usuario ya existe');

        const hash = await bcrypt.hash(password, 10);
        const user = new User({ email: normalizedEmail, password: hash });
        await user.save();

        res.redirect('/login');
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.send('Usuario no encontrado');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.send('Contraseña incorrecta');

        req.session.user = { email: user.email }; // Guardar solo lo necesario
        console.log('🟢 Usuario logueado:', user.email);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta de logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
