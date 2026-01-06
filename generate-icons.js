const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImage = './public/logo.png';
const outputDir = './public/icons';

// Tạo thư mục icons nếu chưa có
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Các kích thước icon cần thiết cho PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Tạo các icon thông thường
async function generateIcons() {
  console.log('Đang tạo icons từ logo.png...\n');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Đã tạo: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Lỗi khi tạo icon ${size}x${size}:`, error.message);
    }
  }

  // Tạo maskable icons (với padding để đảm bảo safe zone)
  console.log('\nĐang tạo maskable icons...\n');
  
  for (const size of [192, 512]) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}-maskable.png`);
    const padding = Math.floor(size * 0.1); // 10% padding cho safe zone
    const logoSize = size - (padding * 2);
    
    try {
      // Tạo canvas màu nền
      const canvas = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 25, g: 118, b: 210, alpha: 1 } // Màu theme
        }
      });

      // Resize logo và đặt vào giữa với padding
      const logo = await sharp(inputImage)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();

      await canvas
        .composite([{
          input: logo,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Đã tạo: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Lỗi khi tạo maskable icon ${size}x${size}:`, error.message);
    }
  }

  // Tạo favicon
  console.log('\nĐang tạo favicon...\n');
  
  try {
    await sharp(inputImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile('./public/favicon.png');
    
    console.log('✅ Đã tạo: ./public/favicon.png');
  } catch (error) {
    console.error('❌ Lỗi khi tạo favicon:', error.message);
  }

  // Tạo Apple Touch Icon
  try {
    await sharp(inputImage)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile('./public/apple-touch-icon.png');
    
    console.log('✅ Đã tạo: ./public/apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Lỗi khi tạo apple-touch-icon:', error.message);
  }

  console.log('\n🎉 Hoàn thành! Tất cả icons đã được tạo.');
}

generateIcons().catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});
