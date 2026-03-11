

// Función auxiliar para convertir imágenes locales a Base64
const getBase64ImageFromUrl = async (imageUrl) => {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`No se pudo cargar la imagen: ${imageUrl}`);
    return null;
  }
};

export const construirWorkbook = async (reportData) => {
  const ExcelJS = (await import('exceljs')).default;
  const response = await fetch('/templates/Plantilla_Preventivo.xlsx');
  const arrayBuffer = await response.arrayBuffer();
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const ws = workbook.worksheets[0];

  // ---------------------------------------------------------
  // 1. INYECCIÓN FORZADA DE ENCABEZADO Y PIE DE PÁGINA
  // ---------------------------------------------------------
  const headerBase64 = await getBase64ImageFromUrl('/templates/header.png');
  const footerBase64 = await getBase64ImageFromUrl('/templates/footer.png');

  // Ajustamos el alto del footer (32) para que quede perfecto y no tape firmas
  // Ajustamos el ancho (650) para que cubra de lado a lado
  const headerConfig = { ext: { width: 650, height: 75 } }; 
  const footerConfig = { ext: { width: 650, height: 32 } };

  if (headerBase64) {
    const headerId = workbook.addImage({ base64: headerBase64, extension: 'png' });
    // Página 1: Header 
    ws.addImage(headerId, { tl: { col: 0.5, row: 0 }, ext: headerConfig.ext });
    
    // Página 2: Header (Fila 60, asumiendo que tu salto está en la 59/60)
    ws.addImage(headerId, { tl: { col: 0.5, row: 60 }, ext: headerConfig.ext });
    
    // Página 3: Header (Fila 124, asumiendo que tu salto está en la 123/124)
    ws.addImage(headerId, { tl: { col: 0.5, row: 124 }, ext: headerConfig.ext });
  }

  if (footerBase64) {
    const footerId = workbook.addImage({ base64: footerBase64, extension: 'png' });
    // Página 1: Footer (Fila 58, justo arriba del primer salto de página)
    ws.addImage(footerId, { tl: { col: 0.5, row: 58 }, ext: footerConfig.ext });
    
    // Página 2: Footer (Fila 119, justo arriba del segundo salto de página)
    ws.addImage(footerId, { tl: { col: 0.5, row: 119 }, ext: footerConfig.ext });
    
    // Página 3: Footer (Fila 173, al final de todo el formato)
    ws.addImage(footerId, { tl: { col: 0.5, row: 173 }, ext: footerConfig.ext });
  }

  // ---------------------------------------------------------
  // 2. LLENADO DE DATOS NORMALES
  // ---------------------------------------------------------

  // --- PÁGINA 1 ---
  ws.getCell('D2').value = reportData.serial;
  ws.getCell('D3').value = reportData.date;
  ws.getCell('C5').value = reportData.client;
  ws.getCell('C6').value = reportData.direccion;
  ws.getCell('D10').value = reportData.contrato;
  ws.getCell('J10').value = reportData.partida;
  ws.getCell('C23').value = reportData.equipo;
  ws.getCell('C24').value = reportData.marca;
  ws.getCell('C25').value = reportData.modelo;
  ws.getCell('J23').value = reportData.numSerieEq;
  ws.getCell('J24').value = reportData.folioSsm;
  ws.getCell('J25').value = reportData.ubicacion;
  ws.getCell('C27').value = reportData.falla;
  ws.getCell('D29').value = reportData.condiciones;

  const tituloObs = "Trabajos realizados/Notas/Observaciones/Recomendaciones:\n\n";
  ws.getCell('B33').value = tituloObs + (reportData.trabajos || reportData.description || '');

  const celdasRefacciones = ['E45', 'B46', 'B47', 'B48'];
  reportData.refacciones?.forEach((ref, index) => {
    if(index < 4 && ref) ws.getCell(celdasRefacciones[index]).value = ref;
  });

  const filasMedicion = [52, 53, 54];
  reportData.medicion?.forEach((med, index) => {
    if(index < 3) {
      ws.getCell(`B${filasMedicion[index]}`).value = med.equipo;
      ws.getCell(`D${filasMedicion[index]}`).value = med.marca;
      ws.getCell(`G${filasMedicion[index]}`).value = med.modelo;
      ws.getCell(`L${filasMedicion[index]}`).value = med.serie;
    }
  });

  ws.getCell('B55').value = reportData.firmaEntrega;
  ws.getCell('D55').value = reportData.firmaRecibe;
  ws.getCell('G55').value = reportData.firmaValida;

  // --- PÁGINA 2 ---
  ws.getCell('D62').value = reportData.serial;
  ws.getCell('D63').value = reportData.date;
  ws.getCell('C65').value = reportData.client;
  ws.getCell('C66').value = reportData.direccion;
  ws.getCell('E70').value = reportData.contrato;
  ws.getCell('J70').value = reportData.partida;
  ws.getCell('C76').value = reportData.equipo;
  ws.getCell('C77').value = reportData.marca;
  ws.getCell('C78').value = reportData.modelo;
  ws.getCell('J76').value = reportData.numSerieEq;
  ws.getCell('J77').value = reportData.folioSsm;
  ws.getCell('J78').value = reportData.ubicacion;

  for (let i = 0; i < 28; i++) {
    if (reportData.checklist && reportData.checklist[i]) {
      const celda = ws.getCell(`K${82 + i}`);
      celda.value = 'X';
      celda.font = { bold: true };
    }
  }

  ws.getCell('B115').value = reportData.firmaEntrega;
  ws.getCell('D115').value = reportData.firmaRecibe;
  ws.getCell('G115').value = reportData.firmaValida;

  // --- PÁGINA 3 ---
  ws.getCell('D126').value = reportData.serial;
  ws.getCell('D127').value = reportData.date;
  ws.getCell('C129').value = reportData.client;
  ws.getCell('C131').value = reportData.contrato;
  ws.getCell('J131').value = reportData.partida;
  ws.getCell('B169').value = reportData.firmaEntrega;
  ws.getCell('D169').value = reportData.firmaRecibe;
  ws.getCell('G169').value = reportData.firmaValida;

  // ---------------------------------------------------------
  // 3. INYECCIÓN FOTOS DE EVIDENCIA
  // ---------------------------------------------------------
  const addImageToExcel = (base64Str, celda) => {
    if(!base64Str) return;
    try {
      const imgId = workbook.addImage({ base64: base64Str, extension: 'jpeg' });
      ws.addImage(imgId, { tl: celda, ext: { width: 180, height: 180 } });
    } catch(e) { console.error(e) }
  };

  if(reportData.fotos) {
    addImageToExcel(reportData.fotos.antes1, 'B137');
    addImageToExcel(reportData.fotos.antes2, 'C137');
    addImageToExcel(reportData.fotos.antes3, 'E137');
    addImageToExcel(reportData.fotos.durante1, 'G137');
    addImageToExcel(reportData.fotos.durante2, 'J137');
    addImageToExcel(reportData.fotos.despues1, 'B150');
    addImageToExcel(reportData.fotos.despues2, 'D150');
    addImageToExcel(reportData.fotos.etiqueta, 'H150');
  }

  return workbook;
};

export const generarExcel = async (reportData) => {
  try {
    const FileSaver = await import('file-saver');
    const saveAs = FileSaver.saveAs || FileSaver.default?.saveAs || FileSaver.default;

    const workbook = await construirWorkbook(reportData);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${reportData.serial}.xlsx`);
  } catch (error) {
    console.error("Error generando Excel:", error);
    alert("Error al generar Excel.");
  }
};

export const generarExcelBuffer = async (reportData) => {
  const workbook = await construirWorkbook(reportData);
  return await workbook.xlsx.writeBuffer();
};