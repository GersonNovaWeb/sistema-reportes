const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/Report_MHOS' : '';

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

const cropToSquare = (base64Str) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => {
    const size = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, (img.width-size)/2, (img.height-size)/2, size, size, 0, 0, size, size);
    resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
  };
  img.onerror = () => resolve(base64Str);
  img.src = `data:image/jpeg;base64,${base64Str}`;
});

export const construirWorkbook = async (reportData) => {
  const ExcelJS = (await import('exceljs')).default;
  const response = await fetch(`${base}/templates/Plantilla_Preventivo.xlsx`);
  const arrayBuffer = await response.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const ws = workbook.worksheets[0];

  // Calcular la altura total de las filas 1-64 para saber exactamente dónde está el salto
  // La plantilla tiene filas 1-64 para página 1, 65-128 para página 2, 129-192 para página 3
  // Insertamos las imágenes EXACTAMENTE donde están esas filas en la plantilla

  const headerBase64 = await getBase64ImageFromUrl(`${base}/templates/header.png`);
  const footerBase64 = await getBase64ImageFromUrl(`${base}/templates/footer.png`);

  if (headerBase64) {
    const headerId = workbook.addImage({ base64: headerBase64, extension: 'png' });
    [[0,3],[64,67],[128,131]].forEach(([tl,br]) => {
      try { ws.mergeCells(`A${tl+1}:I${tl+3}`); } catch(e) {}
      ws.addImage(headerId, { tl:{col:1,row:tl}, br:{col:10,row:br}, editAs:'absolute' });
    });
  }

  if (footerBase64) {
    const footerId = workbook.addImage({ base64: footerBase64, extension: 'png' });
    [[61,64],[125,128],[189,192]].forEach(([tl,br]) => {
      try { ws.mergeCells(`C${tl+1}:I${tl+3}`); } catch(e) {}
      ws.addImage(footerId, { tl:{col:2,row:tl}, br:{col:10,row:br}, editAs:'absolute' });
    });
  }

  // PÁGINA 1 - filas originales de la plantilla, NO cambian
  ws.getCell('D5').value = reportData.serial;
  ws.getCell('D6').value = reportData.date;
  ws.getCell('C8').value = reportData.client;
  ws.getCell('C10').value = reportData.direccion;
  ws.getCell('D13').value = reportData.contrato;
  ws.getCell('J13').value = reportData.partida;
  ws.getCell('C26').value = reportData.equipo;
  ws.getCell('C27').value = reportData.marca;
  ws.getCell('C28').value = reportData.modelo;
  ws.getCell('J26').value = reportData.numSerieEq;
  ws.getCell('J27').value = reportData.folioSsm;
  ws.getCell('J28').value = reportData.ubicacion;
  ws.getCell('C31').value = reportData.falla;
  ws.getCell('D33').value = reportData.condiciones;
  ws.getCell('B37').value = "Trabajos realizados/Notas/Observaciones/Recomendaciones:\n\n" + (reportData.trabajos || reportData.description || '');

  const celdasRefacciones = ['E48','B49','B50','B51'];
  reportData.refacciones?.forEach((ref, i) => {
    if(i < 4 && ref) ws.getCell(celdasRefacciones[i]).value = ref;
  });

  [54,55,56].forEach((fila, i) => {
    const med = reportData.medicion?.[i];
    if(med) {
      ws.getCell(`B${fila}`).value = med.equipo;
      ws.getCell(`D${fila}`).value = med.marca;
      ws.getCell(`G${fila}`).value = med.modelo;
      ws.getCell(`L${fila}`).value = med.serie;
    }
  });

  ws.getCell('B58').value = reportData.firmaEntrega;
  ws.getCell('D58').value = reportData.firmaRecibe;
  ws.getCell('G58').value = reportData.firmaValida;

  // PÁGINA 2 - filas originales de la plantilla, NO cambian
  ws.getCell('D68').value = reportData.serial;
  ws.getCell('D69').value = reportData.date;
  ws.getCell('C71').value = reportData.client;
  ws.getCell('C72').value = reportData.direccion;
  ws.getCell('E76').value = reportData.contrato;
  ws.getCell('J76').value = reportData.partida;
  ws.getCell('C82').value = reportData.equipo;
  ws.getCell('C83').value = reportData.marca;
  ws.getCell('C84').value = reportData.modelo;
  ws.getCell('J82').value = reportData.numSerieEq;
  ws.getCell('J83').value = reportData.folioSsm;
  ws.getCell('J84').value = reportData.ubicacion;

  for (let i = 0; i < 28; i++) {
    if (reportData.checklist?.[i]) {
      const celda = ws.getCell(`K${88+i}`);
      celda.value = 'X';
      celda.font = { bold: true };
    }
  }

  ws.getCell('B121').value = reportData.firmaEntrega;
  ws.getCell('D121').value = reportData.firmaRecibe;
  ws.getCell('G121').value = reportData.firmaValida;

  // PÁGINA 3 - filas originales de la plantilla, NO cambian
  ws.getCell('D132').value = reportData.serial;
  ws.getCell('D133').value = reportData.date;
  ws.getCell('C135').value = reportData.client;
  ws.getCell('C137').value = reportData.contrato;
  ws.getCell('J137').value = reportData.partida;

  ws.getCell('B175').value = reportData.firmaEntrega;
  ws.getCell('D175').value = reportData.firmaRecibe;
  ws.getCell('G175').value = reportData.firmaValida;

  const writeLabel = (addr, l1, l2) => {
    try {
      const cell = ws.getCell(addr);
      cell.value = { richText: [{text:l1+'\n'},{text:l2,font:{bold:true}}] };
      cell.alignment = { wrapText:true, vertical:'top', horizontal:'center' };
    } catch(e) {}
  };
  writeLabel('B178','Ing/Tec que realizo servicio (MANHOS)','Nombre y Firma (Entrega)');
  writeLabel('D178','Director/Administrador','Recibe/Autoriza');
  writeLabel('G178','Ing. Adrián Martinez Robles','Valida');
  try {
    const c = ws.getCell('K178');
    c.value = 'Sello de la Unidad';
    c.alignment = { wrapText:true, vertical:'top', horizontal:'center' };
  } catch(e) {}

  // FOTOS
  const addImg = async (b64, col, row) => {
    if(!b64) return;
    try {
      const sq = await cropToSquare(b64);
      const id = workbook.addImage({ base64:sq, extension:'jpeg' });
      ws.addImage(id, { tl:{col,row}, ext:{width:180,height:180}, editAs:'absolute' });
    } catch(e) {}
  };

  if(reportData.fotos) {
    await addImg(reportData.fotos.antes1,   1, 141);
    await addImg(reportData.fotos.antes2,   2, 141);
    await addImg(reportData.fotos.antes3,   3, 141);
    await addImg(reportData.fotos.durante1, 6, 141);
    await addImg(reportData.fotos.durante2, 9, 141);
    await addImg(reportData.fotos.despues1, 1, 154);
    await addImg(reportData.fotos.despues2, 2, 154);
    await addImg(reportData.fotos.etiqueta, 8, 154);
  }

  // PAGE SETUP - saltos exactos en filas 64 y 128
  ws.pageSetup.margins = { left:0.5, right:0.5, top:0.5, bottom:0.5, header:0, footer:0 };
  ws.pageSetup.printArea = 'A1:L192';
  ws.pageSetup.paperSize = 1;
  ws.pageSetup.orientation = 'portrait';
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 3;

  return workbook;
};

export const generarExcel = async (reportData) => {
  try {
    const FileSaver = await import('file-saver');
    const saveAs = FileSaver.saveAs || FileSaver.default?.saveAs || FileSaver.default;
    const workbook = await construirWorkbook(reportData);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_${reportData.serial}.xlsx`);
  } catch (error) {
    console.error("Error:", error);
    alert("Error al generar el archivo.");
  }
};

export const generarExcelBuffer = async (reportData) => {
  const workbook = await construirWorkbook(reportData);
  return await workbook.xlsx.writeBuffer();
};
