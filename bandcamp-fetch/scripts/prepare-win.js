import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import path from 'path';

// === eliminar carpeta dist ===
const distPath = path.resolve('dist');
if (existsSync(distPath)) {
    console.log('[INFO] Eliminando dist...');
    rmSync(distPath, { recursive: true, force: true });
}

// === construir ESM ===
console.log('[INFO] Compilando versión ESM...');
execSync('npx tsc -p tsconfig-esm.json', { stdio: 'inherit' });

// === construir CJS ===
console.log('[INFO] Compilando versión CJS...');
execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });

// === fixup equivalente ===
console.log('[INFO] Ajustando exports...');
const fixup = `
import fs from 'fs';
import path from 'path';
const dist = path.resolve('dist');
const pkg = path.join(dist, 'package.json');
if (fs.existsSync(pkg)) {
  let data = JSON.parse(fs.readFileSync(pkg, 'utf-8'));
  data.type = 'module';
  fs.writeFileSync(pkg, JSON.stringify(data, null, 2));
  console.log('[OK] package.json corregido en dist/');
}
`;
await import('fs').then(fs => fs.writeFileSync('scripts/fixup.js', fixup));
execSync('node scripts/fixup.js', { stdio: 'inherit' });

console.log('[OK] Compilación completa para Windows ✅');
