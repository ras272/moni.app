/**
 * Script para generar iconos PNG desde el JPEG original
 * Requiere: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [512, 192, 144, 96];
const inputFile = path.join(__dirname, '../public/pwd.jpg');

async function generateIcons() {
  console.log('🎨 Generando iconos PNG desde pwd.jpg...');

  for (const size of sizes) {
    const outputFile = path.join(
      __dirname,
      `../public/icon-${size}x${size}.png`
    );

    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 100 })
        .toFile(outputFile);

      console.log(`✅ Generado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(
        `❌ Error generando icon-${size}x${size}.png:`,
        error.message
      );
    }
  }

  console.log('✨ ¡Iconos generados exitosamente!');
}

generateIcons().catch(console.error);
