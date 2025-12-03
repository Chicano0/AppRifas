const https = require('https');

// ============================================
// CONFIGURACIÓN
// ============================================
const URL = 'https://rifasmx.onrender.com/'; // ← TU URL
const NUM_REQUESTS = 20;
const DELAY_MS = 300;

console.log('\n' + '='.repeat(60));
console.log('🧪 PRUEBA DE BALANCEO DE CARGAS');
console.log('='.repeat(60));
console.log(`📡 URL: ${URL}`);
console.log(`🔢 Peticiones: ${NUM_REQUESTS}`);
console.log(`⏱️  Delay: ${DELAY_MS}ms`);
console.log('='.repeat(60) + '\n');

// ============================================
// FUNCIÓN PARA HACER PETICIONES
// ============================================
function makeRequest(num) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const info = JSON.parse(data);
          const serverHeader = res.headers['x-server-id'] || 'unknown';
          
          console.log(
            `✅ Petición ${num.toString().padStart(2, '0')}: ` +
            `Servidor [${info.serverId}] | ` +
            `CPUs: ${info.cpus} | ` +
            `Tiempo: ${responseTime}ms`
          );
          
          resolve({
            serverId: info.serverId,
            serverHeader: serverHeader,
            responseTime: responseTime,
            cpus: info.cpus
          });
        } catch (error) {
          reject(new Error('Error al parsear respuesta'));
        }
      });
    }).on('error', (error) => {
      console.error(`❌ Error en petición ${num}:`, error.message);
      reject(error);
    });
  });
}

// ============================================
// EJECUTAR PRUEBAS
// ============================================
async function testLoadBalancing() {
  const results = [];
  const serverCounts = {};
  const responseTimes = [];

  try {
    for (let i = 1; i <= NUM_REQUESTS; i++) {
      const result = await makeRequest(i);
      results.push(result);
      
      serverCounts[result.serverId] = (serverCounts[result.serverId] || 0) + 1;
      responseTimes.push(result.responseTime);
      
      if (i < NUM_REQUESTS) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DEL BALANCEO DE CARGAS');
    console.log('='.repeat(60) + '\n');

    console.log('🖥️  Distribución de peticiones por servidor:');
    Object.entries(serverCounts).forEach(([server, count]) => {
      const percentage = ((count / NUM_REQUESTS) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`   ${server}: ${count} peticiones (${percentage}%) ${bar}`);
    });

    const avgTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);

    console.log('\n⏱️  Tiempos de respuesta:');
    console.log(`   Promedio: ${avgTime}ms`);
    console.log(`   Mínimo: ${minTime}ms`);
    console.log(`   Máximo: ${maxTime}ms`);

    const numServers = Object.keys(serverCounts).length;
    console.log('\n✅ Verificación:');
    console.log(`   Servidores detectados: ${numServers}`);
    
    if (numServers > 1) {
      console.log('   ✅ Balanceo de cargas ACTIVO');
    } else {
      console.log('   ⚠️  Solo 1 servidor detectado (Free tier de Render)');
      console.log('   💡 El balanceo se activará automáticamente con más carga');
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

testLoadBalancing().catch(console.error);