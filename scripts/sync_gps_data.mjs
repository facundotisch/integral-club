import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTT1xqcpoyD_LWD3oqbY-38nHpRKAJyX_DG5BBHJQPPVZIyInRTnXSYtYkj9V-1S7c/exec';
const CATEGORIAS = ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena', 'Reserva'];

const outDir = path.resolve(__dirname, '..', 'public', 'data', 'gps');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Función para descargar con reintentos y timeout de 45s por categoría
async function fetchWithRetry(url, catName, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    try {
      if (attempt > 1) {
        console.log(`    [Reintento ${attempt}/${maxRetries} para ${catName}]...`);
      }
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json || json.error) {
        throw new Error(json?.error || 'Respuesta inválida de Google Apps Script');
      }
      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt === maxRetries) {
        throw err;
      }
      // Esperar 2 segundos antes del reintento
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function run() {
  console.log('========================================================');
  console.log('   RACING CLUB · SINCRONIZADOR DE PLANILLAS GPS');
  console.log('========================================================\n');
  console.log(`Conectando con Google Sheets (${CATEGORIAS.length} divisiones)...\n`);

  const tStart = Date.now();
  let exitosas = 0;

  for (let i = 0; i < CATEGORIAS.length; i++) {
    const cat = CATEGORIAS[i];
    const catSlug = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const outPath = path.join(outDir, `${catSlug}.json`);
    const targetUrl = `${SCRIPT_URL}?api=1&cat=${encodeURIComponent(cat)}&_t=${Date.now()}`;
    
    process.stdout.write(`[${i + 1}/${CATEGORIAS.length}] Descargando ${cat.padEnd(8)} `);
    const t0 = Date.now();
    
    try {
      const data = await fetchWithRetry(targetUrl, cat);
      const sesiones = data.data?.sesiones?.length || 0;
      const roster = data.data?.roster?.length || 0;
      
      fs.writeFileSync(outPath, JSON.stringify(data), 'utf-8');
      const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
      const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
      
      console.log(`-> OK (${sesiones} fechas, ${roster} jugs | ${sizeKb} KB en ${elapsedSec}s)`);
      exitosas++;
    } catch (err) {
      console.log(`-> ERROR: ${err.message}`);
    }

    // Pausa breve de 800ms entre llamadas para no saturar los límites de Google Apps Script
    if (i < CATEGORIAS.length - 1) {
      await new Promise(r => setTimeout(r, 800));
    }
  }

  const totalSec = ((Date.now() - tStart) / 1000).toFixed(1);
  console.log('\n--------------------------------------------------------');
  console.log(`Resultado: ${exitosas}/${CATEGORIAS.length} divisiones sincronizadas en ${totalSec}s.`);
  console.log('Archivos guardados en: public/data/gps/');
  console.log('========================================================\n');

  if (exitosas === 0) {
    process.exit(1);
  }
}

run();
