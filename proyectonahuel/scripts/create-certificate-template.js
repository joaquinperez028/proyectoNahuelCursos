const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Crear una plantilla de certificado
function createCertificateTemplate() {
  // Tamaño del certificado (tamaño estándar tipo A4 en landscape)
  const width = 1754;
  const height = 1240;
  
  // Crear el canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fondo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Borde decorativo
  ctx.strokeStyle = '#3b82f6'; // Color azul
  ctx.lineWidth = 15;
  ctx.strokeRect(40, 40, width - 80, height - 80);
  
  // Borde interior
  ctx.strokeStyle = '#10b981'; // Color verde
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, width - 120, height - 120);
  
  // Título
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICADO', width / 2, 200);
  
  // Subtítulo
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 40px Arial';
  ctx.fillText('DE FINALIZACIÓN', width / 2, 260);
  
  // Línea decorativa
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, 300);
  ctx.lineTo(width / 2 + 200, 300);
  ctx.stroke();
  
  // Área para nombre del estudiante
  ctx.fillStyle = '#334155';
  ctx.font = '30px Arial';
  ctx.fillText('Este certificado se otorga a:', width / 2, 400);
  
  // Línea para el nombre (será reemplazado)
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 20px Arial';
  ctx.fillText('[NOMBRE DEL ESTUDIANTE]', width / 2, 500);
  
  // Descripción
  ctx.fillStyle = '#334155';
  ctx.font = '30px Arial';
  ctx.fillText('Por haber completado con éxito el curso:', width / 2, 600);
  
  // Línea para el curso (será reemplazado)
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 20px Arial';
  ctx.fillText('[NOMBRE DEL CURSO]', width / 2, 650);
  
  // Fecha
  ctx.fillStyle = '#334155';
  ctx.font = '24px Arial';
  ctx.fillText('Fecha de emisión:', width / 2, 750);
  
  // Línea para fecha (será reemplazado)
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 20px Arial';
  ctx.fillText('[FECHA DE EMISIÓN]', width / 2, 800);
  
  // ID
  ctx.fillStyle = '#334155';
  ctx.font = '18px Arial';
  ctx.fillText('ID del certificado:', width / 2, 850);
  
  // Línea para ID (será reemplazado)
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 16px Arial';
  ctx.fillText('[ID CERTIFICADO]', width / 2, 880);
  
  // Verificación
  ctx.fillStyle = '#64748b';
  ctx.font = '16px Arial';
  ctx.fillText('Verifica la autenticidad de este certificado en:', width / 2, 930);
  ctx.fillText('proyectonahuel.vercel.app/certificados/verificar', width / 2, 960);
  
  // Guardar a archivo
  const outputDir = path.join(__dirname, '..', 'public', 'images');
  const outputFile = path.join(outputDir, 'certificate-template.png');
  
  // Asegurarse de que el directorio existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Guardar el canvas como imagen PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputFile, buffer);
  
  console.log(`Template created at ${outputFile}`);
}

// Ejecutar la función
try {
  createCertificateTemplate();
} catch (error) {
  console.error('Error creating certificate template:', error);
} 