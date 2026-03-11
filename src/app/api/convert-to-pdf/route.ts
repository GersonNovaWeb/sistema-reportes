import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // 1. Convertimos el archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 2. Rutas temporales
    const tempDir = os.tmpdir();
    const uniqueId = Date.now().toString();
    const inputPath = path.join(tempDir, `reporte_${uniqueId}.xlsx`);
    const outputDir = tempDir;
    const outputPath = path.join(tempDir, `reporte_${uniqueId}.pdf`);

    // 3. Escribimos el Excel temporal
    fs.writeFileSync(inputPath, buffer);

    // 4. Comando dinámico (Asegúrate de que la ruta a LibreOffice sea correcta en tu PC)
    const isWindows = os.platform() === 'win32';
    const commandName = isWindows ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"' : 'libreoffice'; 
    
    const command = `${commandName} --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`;

    // 5. Ejecutamos LibreOffice
    await execAsync(command);

    // 6. Leemos el PDF resultante
    const pdfBuffer = fs.readFileSync(outputPath);

    // 7. Limpiamos archivos temporales
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    // 8. Enviamos el PDF a la web
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error en la conversión con LibreOffice:', error);
    return NextResponse.json({ error: 'Error al convertir el documento.' }, { status: 500 });
  }
}