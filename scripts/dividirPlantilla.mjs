import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plantillaPath = path.join(__dirname, '../public/templates/Plantilla_Preventivo.xlsx');
const headerPath = path.join(__dirname, '../public/templates/header.png');
const footerPath = path.join(__dirname, '../public/templates/footer.png');

const headerBuffer = fs.readFileSync(headerPath);
const footerBuffer = fs.readFileSync(footerPath);

const wbOrig = new ExcelJS.Workbook();
await wbOrig.xlsx.readFile(plantillaPath);
const wsOrig = wbOrig.worksheets[0];

const wbNuevo = new ExcelJS.Workbook();

// Función para copiar un rango de filas a una nueva hoja
const copiarHoja = (nombre, filaInicio, filaFin) => {
  const wsNueva = wbNuevo.addWorksheet(nombre);

  // Copiar anchos de columnas
  wsOrig.columns.forEach((col, i) => {
    wsNueva.getColumn(i+1).width = col.width || 10;
  });

  // Copiar filas
  let filaDestino = 1;
  for (let i = filaInicio; i <= filaFin; i++) {
    const filaOrig = wsOrig.getRow(i);
    const filaNueva = wsNueva.getRow(filaDestino);
    filaNueva.height = filaOrig.height;
    filaOrig.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const newCell = filaNueva.getCell(colNum);
      newCell.value = cell.value;
      newCell.style = JSON.parse(JSON.stringify(cell.style));
    });
    filaNueva.commit();
    filaDestino++;
  }

  // Agregar header y footer como imágenes
  const headerId = wbNuevo.addImage({ buffer: headerBuffer, extension: 'png' });
  const footerId = wbNuevo.addImage({ buffer: footerBuffer, extension: 'png' });
  wsNueva.addImage(headerId, { tl:{col:1,row:0}, br:{col:10,row:3}, editAs:'absolute' });
  wsNueva.addImage(footerId, { tl:{col:2,row:filaFin-filaInicio-2}, br:{col:10,row:filaFin-filaInicio+1}, editAs:'absolute' });

  // Page setup
  wsNueva.pageSetup.paperSize = 1;
  wsNueva.pageSetup.orientation = 'portrait';
  wsNueva.pageSetup.fitToPage = true;
  wsNueva.pageSetup.fitToWidth = 1;
  wsNueva.pageSetup.fitToHeight = 1;
  wsNueva.pageSetup.margins = { left:0.5, right:0.5, top:0.5, bottom:0.5, header:0, footer:0 };

  return wsNueva;
};

// Página 1: filas 1-64, Página 2: filas 65-128, Página 3: filas 129-192
copiarHoja('Hoja1', 1, 64);
copiarHoja('Hoja2', 65, 128);
copiarHoja('Hoja3', 129, 192);

const nuevaRuta = path.join(__dirname, '../public/templates/Plantilla_3Hojas.xlsx');
await wbNuevo.xlsx.writeFile(nuevaRuta);
console.log('✅ Plantilla con 3 hojas creada en', nuevaRuta);
