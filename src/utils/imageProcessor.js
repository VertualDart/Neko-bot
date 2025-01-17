const { createCanvas, loadImage } = require('canvas');

async function addWatermark(imageUrl, version, serialNumber) {
  try {
    // Set canvas dimensions
    const canvas = createCanvas(400, 600);
    const ctx = canvas.getContext('2d');

    // Load the base card image
    const image = await loadImage(imageUrl);

    // Draw the image on the canvas
    ctx.drawImage(image, 0, 0, 400, 600); // dimnensions not proper, mujhe samjha nahi kitna rakhna suitable rahega

    // Configure text properties
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 20px Arial';

    // Add version watermark
    ctx.fillText(`v${version}`, 20, 580);

    // Add serial number - this function may not be needed tho ig
    ctx.textAlign = 'right'; // Align serial number to the right
    ctx.fillText(`#${serialNumber}`, 380, 580);

    // Return buffer
    return canvas.toBuffer();
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}

module.exports = { addWatermark };
