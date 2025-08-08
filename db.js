const mongoose = require('mongoose');

const uri = 'mongodb+srv://soporteverifiacion:Admin123@cluster0.d7ymyji.mongodb.net/Rifas?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
}).catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err);
});

module.exports = mongoose;
