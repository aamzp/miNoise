
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
