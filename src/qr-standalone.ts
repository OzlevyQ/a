#!/usr/bin/env node

import { qrServer } from './qr-server.js';

async function startQRServer() {
  try {
    console.error('🌐 מתחיל שרת QR... / Starting QR server...');
    const url = await qrServer.start();
    console.error(`✅ שרת QR זמין: ${url}`);
    console.error(`✅ QR server available: ${url}`);
    console.error('📱 ממתין לקוד QR מהשרת הראשי... / Waiting for QR from main server...');
  } catch (error) {
    console.error('❌ שגיאה בהפעלת שרת QR:', error);
    process.exit(1);
  }
}

startQRServer(); 