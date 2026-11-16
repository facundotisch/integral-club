const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'C:/Users/facun/Documents/RACING/racing-gps-vercel';
const baseFotos = path.join(rootDir, 'public/fotos');

// 1. Lists of files for each division based strictly on Racing Club Official website

const filesNovena = [
  'Allende D.png',
  'Allende G.webp',
  'Alvarez M.png',
  'Arregui J.webp',
  'Balsano F.png',
  'Banega B.png',
  'Barreto B.webp',
  'Bogarin U.webp',
  'Bordon Noguera B.webp',
  'Correa J.webp',
  'Cubilla Troncoso J.webp',
  'Fernandez D.png',
  'Gomis J.png',
  'Gonzalez Rivero J.webp',
  'Kiefer E.png',
  'Llodra G.png',
  'Mancuello B.png',
  'Medina F.png',
  'Medina Santa Cruz J.webp',
  'Mendoza I.png',
  'Montenegro B.webp',
  'Nazareno B.png',
  'Pachi E.png',
  'Pereira B.png',
  'Pereira Caceres E.webp',
  'Ruiz Diaz F.png',
  'Sagasta D.png',
  'Veltri S.png',
  'Villa L.webp'
];

const filesOctava = [
  'Alvarez Roldan M.webp',
  'Archila J.webp',
  'Benavidez F.webp',
  'Borda A.webp',
  'Buch B.webp',
  'Caballero V.webp',
  'Cabrera B.webp',
  'Calli V.webp',
  'Cespedez O.webp',
  'Chavez Capdeville P.webp',
  'Cueto B.webp',
  'Elosu Larumbe M.webp',
  'Ermida del Soldato C.webp',
  'Gomez M.webp',
  'Gonzalez R.webp',
  'Gutierrez J.webp',
  'Klid B.webp',
  'La Rosa Fuenmayor S.webp',
  'Livio M.webp',
  'Molina G.webp',
  'Mosqueria Leguizamon I.webp',
  'Navarro B.webp',
  'Pereyra G.webp',
  'Pimentel Llanes U.webp',
  'Ramos Cristaldo T.webp',
  'Robledo E.webp',
  'Rolon A.webp',
  'Ruiz Bartolomey V.webp',
  'Saavedra L.webp',
  'Toloza S.webp',
  'Tuninetti S.webp'
];

const filesSeptima = [
  'Alcaraz Meza F.webp',
  'Alfonso J.webp',
  'Baez S.webp',
  'Bravo N.webp',
  'Caamaño B.webp',
  'Careaga A.webp',
  'Carrasco D.webp',
  'Centurion Borche M.webp',
  'Cuenca M.webp',
  'Cueto B.webp',
  'Davis Martinez T.webp',
  'De Brito T.webp',
  'Diaz Lencina V.webp',
  'Elosu S.webp',
  'Garcia S.webp',
  'Gonzalez Bartucci R.webp',
  'Ianacce S.webp',
  'Lopez Astrada T.webp',
  'Lopez Fernandez A.webp',
  'Montenegro D.webp',
  'Olivera N.webp',
  'Pereyra D.webp',
  'Possadino S.webp',
  'Ruiz Behr S.webp',
  'Russo J.webp',
  'Saldaña E.webp',
  'Salome Maldonado D.webp',
  'Santiago S.webp',
  'Segovia E.webp',
  'Soria Bustos E.webp',
  'Soto D.webp',
  'Unchalo J.webp',
  'Velardes M.webp',
  'Velazquez A.webp'
];

// Cuarta: 41 from bundle + Aguirre S (Santino Aguirre)
const filesCuartaFromBundle = [
  'Aguero L.webp',
  'Alvez L.webp',
  'Cabellos Vazquez A.webp',
  'Campo Deusa D.webp',
  'Carabajal D.webp',
  'Castreje Rodriguez B.webp',
  'Contreras M.webp',
  'Costa Storniolo S.webp',
  'Deraco D.webp',
  'Encina E.webp',
  'Escudero G.webp',
  'Firmapaz L.webp',
  'Fraga F.webp',
  'Gagliardi Piris S.webp',
  'Godoy M.webp',
  'Gonzalez B.webp',
  'Igon F.webp',
  'Lazo M.webp',
  'Leiva Aguero G.webp',
  'Macias F.webp',
  'Martinez L.webp',
  'Merino J.webp',
  'Meza S.webp',
  'Milito Bonetto L.webp',
  'Naranjo L.webp',
  'Orrabalis A.webp',
  'Ortiz L.webp',
  'Perez A.webp',
  'Ranalli S.webp',
  'Rivas Saleski L.webp',
  'Schaare F.webp',
  'Segura E.webp',
  'Solarte L.webp',
  'Taborda T.webp',
  'Tello Larrory L.webp',
  'Torres E.webp',
  'Trujillo Pineda J.webp',
  'Velazques Fernandez J.webp',
  'Wolfert L.webp',
  'Yegros A.webp',
  'Zakalic A.webp'
];

// Quinta: 32 files
const filesQuinta = [
  'Aguilera S.webp',
  'Ansaldo D.webp',
  'Arias J.webp',
  'Benavidez R.webp',
  'Cabrera J.webp',
  'Carmona m.webp',
  'Celasco A.webp',
  'Chatruc B.webp',
  'Dobal J.webp',
  'Falaq S.webp',
  'Ferrer Correa D.webp',
  'Garcia Perez F.webp',
  'Gonzalez F.webp',
  'Loto R.webp',
  'Marecco G.webp',
  'Mareco A.webp',
  'Marelican Bottaro R.webp',
  'Marocco M.webp',
  'Martinez M.webp',
  'Melluso M.webp',
  'Mondolo L.webp',
  'Muñoz N.webp',
  'Oddo J.webp',
  'Ohaco M.webp',
  'Perez B.webp',
  'Perez E.webp',
  'Quiroz J.webp',
  'Rojas Y.webp',
  'Romero B.webp',
  'Tello A.webp',
  'Villalba O.webp',
  'Walter C.webp'
];

// Sexta: 35 files
const filesSexta = [
  'Acevedo L.webp',
  'Aguirre S.webp',
  'Ahumada Lamensa V.webp',
  'Almaraz S.webp',
  'Alvarez L.webp',
  'Ardiles C.webp',
  'Avalos Rios E.webp',
  'Bado J.webp',
  'Balbuena A.webp',
  'Barcena S.webp',
  'Borowik Mattus B.webp',
  'Burriel T.webp',
  'Cabellos Galeano U.webp',
  'Caceres B.webp',
  'Cayuqueo T.webp',
  'Cerullo F.webp',
  'Enrique J.webp',
  'Fischer B.webp',
  'Florentin E.webp',
  'Gomez T.webp',
  'Ibarras E.webp',
  'Lima V.webp',
  'Lopez B.webp',
  'Lopez S.webp',
  'Maimo L.webp',
  'Medina J.webp',
  'Ortiz Heredia J.webp',
  'Rodriguez Dotzel L.webp',
  'Rodriguez Luna E.webp',
  'Rodriguez S.webp',
  'Santoro M.webp',
  'Sinnot T.webp',
  'Torterola L.webp',
  'Tulipan Enriquez A.webp',
  'Zotelo R.webp'
];

console.log('Sanity count check:');
console.log('  Cuarta files (bundle + web):', filesCuartaFromBundle.length + 1);
console.log('  Quinta files:', filesQuinta.length);
console.log('  Sexta files:', filesSexta.length);
console.log('  Bundle total (41 + 32 + 35):', filesCuartaFromBundle.length + filesQuinta.length + filesSexta.length);

// 2. Clear current directories and recreate cleanly
const categories = ['cuarta', 'quinta', 'sexta', 'septima', 'octava', 'novena', 'reserva'];

categories.forEach(cat => {
  const dir = path.join(baseFotos, cat);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
});

// Helper to extract a file from git commit efd6e36
function restoreFromGit(srcPathInCommit, destFullPath) {
  try {
    const buf = execSync(`git show efd6e36:"${srcPathInCommit}"`);
    fs.writeFileSync(destFullPath, buf);
  } catch (err) {
    console.error(`Failed to restore ${srcPathInCommit}:`, err.message);
  }
}

// Restore Novena
console.log('\nRestoring Novena...');
filesNovena.forEach(f => {
  restoreFromGit(`public/fotos/novena/${f}`, path.join(baseFotos, 'novena', f));
});

// Restore Octava
console.log('Restoring Octava...');
filesOctava.forEach(f => {
  restoreFromGit(`public/fotos/octava/${f}`, path.join(baseFotos, 'octava', f));
});

// Restore Septima
console.log('Restoring Septima...');
filesSeptima.forEach(f => {
  restoreFromGit(`public/fotos/septima/${f}`, path.join(baseFotos, 'septima', f));
});

// Restore Sexta
console.log('Restoring Sexta...');
filesSexta.forEach(f => {
  restoreFromGit(`public/fotos/sexta/${f}`, path.join(baseFotos, 'sexta', f));
});

// Restore Quinta
console.log('Restoring Quinta...');
filesQuinta.forEach(f => {
  restoreFromGit(`public/fotos/sexta/${f}`, path.join(baseFotos, 'quinta', f));
});

// Restore Cuarta
console.log('Restoring Cuarta...');
filesCuartaFromBundle.forEach(f => {
  restoreFromGit(`public/fotos/sexta/${f}`, path.join(baseFotos, 'cuarta', f));
});
// Add Santino Aguirre (Cuarta) from scripts/aguirre_cuarta.webp
if (fs.existsSync(path.join(rootDir, 'scripts/aguirre_cuarta.webp'))) {
  fs.copyFileSync(
    path.join(rootDir, 'scripts/aguirre_cuarta.webp'),
    path.join(baseFotos, 'cuarta/Aguirre S.webp')
  );
  console.log('  Added Aguirre S.webp (Santino Aguirre) to Cuarta');
}

// 3. Generate src/data/fotosCatalog.js
const catalog = {};
categories.forEach(cat => {
  const dir = path.join(baseFotos, cat);
  if (fs.existsSync(dir)) {
    catalog[cat] = fs.readdirSync(dir).sort();
  } else {
    catalog[cat] = [];
  }
});

const catalogContent = `/**
 * Catálogo auto-generado de fotografías de jugadores disponibles en /public/fotos/
 * Organizado estrictamente por categorías oficiales de Racing Club:
 * - Cuarta: ${catalog.cuarta.length} fotos
 * - Quinta: ${catalog.quinta.length} fotos
 * - Sexta: ${catalog.sexta.length} fotos
 * - Séptima: ${catalog.septima.length} fotos
 * - Octava: ${catalog.octava.length} fotos
 * - Novena: ${catalog.novena.length} fotos
 * - Reserva: ${catalog.reserva.length} fotos
 */

export const FOTOS_CATALOG = ${JSON.stringify(catalog, null, 2)};
`;

fs.writeFileSync(path.join(rootDir, 'src/data/fotosCatalog.js'), catalogContent, 'utf8');
console.log('\nRegenerated src/data/fotosCatalog.js successfully!');

console.log('\nFinal folder counts:');
categories.forEach(c => {
  const dir = path.join(baseFotos, c);
  console.log(`  ${c}: ${fs.existsSync(dir) ? fs.readdirSync(dir).length : 0} fotos`);
});
