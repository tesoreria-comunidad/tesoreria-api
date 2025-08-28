/**
 * Script de prueba para el CronJob de actualización mensual de balances
 * 
 * Para usar este script:
 * 1. Asegúrate de que el servidor esté corriendo
 * 2. Configura las variables de API_BASE_URL y TOKEN
 * 3. Ejecuta: node test-cronjob.js
 */

const API_BASE_URL = 'http://localhost:3000'; // Ajusta según tu configuración
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Reemplaza con un token válido de MASTER o DIRIGENTE

async function testCronJob() {
  try {
    console.log('🚀 Iniciando pruebas del CronJob de actualización mensual...\n');

    // 1. Verificar estado del cronjob
    console.log('📊 Verificando estado del cronjob...');
    const statusResponse = await fetch(`${API_BASE_URL}/cron-jobs/status`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Estado del cronjob:', JSON.stringify(statusData, null, 2));
    } else {
      console.log('❌ Error al obtener estado:', statusResponse.status, statusResponse.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Ejecutar actualización manual
    console.log('🔧 Ejecutando actualización mensual manualmente...');
    const updateResponse = await fetch(`${API_BASE_URL}/cron-jobs/run-monthly-update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Actualización ejecutada:', JSON.stringify(updateData, null, 2));
    } else {
      console.log('❌ Error en la actualización:', updateResponse.status, updateResponse.statusText);
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('💥 Error durante las pruebas:', error.message);
  }
}

// Verificar configuración antes de ejecutar
if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.log('⚠️  ATENCIÓN: Necesitas configurar un TOKEN válido en el script');
  console.log('   1. Inicia sesión en tu API');
  console.log('   2. Copia el JWT token');
  console.log('   3. Reemplaza YOUR_JWT_TOKEN_HERE con tu token');
  process.exit(1);
}

testCronJob();
