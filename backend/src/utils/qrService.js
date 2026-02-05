const QRCode = require("qrcode");

// Generate QR code as base64 data URL
const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR Code generation error:", error);
    return null;
  }
};

// Generate unique ticket ID
const generateTicketId = () => {
  const prefix = "FEL";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

module.exports = {
  generateQRCode,
  generateTicketId
};
