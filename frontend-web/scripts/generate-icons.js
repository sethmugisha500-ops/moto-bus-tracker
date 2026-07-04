// scripts/generate-icons.js
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// For each size, create a simple SVG icon
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.1875)}" fill="#00C26F"/>
  <text x="${size/2}" y="${size * 0.65}" font-size="${size * 0.4}" text-anchor="middle" fill="white">🚐</text>
</svg>`;
  
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`✅ Created icon-${size}x${size}.svg`);
});

console.log('✅ All icons generated!');