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

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const uniqueId = Date.now().toString();
    const inputPath = path.join(tempDir, `reporte_${uniqueId}.xlsx`);
    const outputPath = path.join(tempDir, `reporte_${uniqueId}.pdf`);

    fs.writeFileSync(inputPath, buffer);

    const isWindows = os.platform() === 'win32';
    const commandName = isWindows
      ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"'
      : 'libreoffice';

    const userProfile = path.join(tempDir, `lo_profile_${uniqueId}`);
    const profileUrl = `file:///${userProfile.replace(/\\/g, '/').replace(/^\//, '')}`;

    const command = `${commandName} --headless -env:UserInstallation=${profileUrl} --convert-to pdf "${inputPath}" --outdir "${tempDir}"`;

    await execAsync(command, { timeout: 60000 });

    const pdfBuffer = fs.readFileSync(outputPath);

    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    try { fs.rmSync(userProfile, { recursive: true }); } catch(e) {}

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error en la conversión:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
