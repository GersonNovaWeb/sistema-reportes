import ExcelJS from 'exceljs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(join(__dirname, '../public/templates/Plantilla_Preventivo.xlsx'));
const ws = workbook.worksheets[0];

const headerBuffer = fs.readFileSync(join(__dirname, '../public/templates/header.png'));
const footerBuffer = fs.readFileSync(join(__dirname, '../public/templates/footer.png'));

const headerId = workbook.addImage({ buffer: headerBuffer, extension: 'png' });
const footerId = workbook.addImage({ buffer: footerBuffer, extension: 'png' });

[[0,3],[67,70],[134,137]].forEach(([tl,br]) => {
  ws.addImage(headerId, { tl:{col:0,row:tl}, br:{col:12,row:br} });
});

[[61,64],[128,131],[195,198]].forEach(([tl,br]) => {
  ws.addImage(footerId, { tl:{col:0,row:tl}, br:{col:12,row:br} });
});

await workbook.xlsx.writeFile(join(__dirname, '../public/templates/Plantilla_con_header.xlsx'));
console.log('✅ Plantilla creada con imágenes incrustadas');
