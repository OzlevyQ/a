import express from 'express';
import qrcode from 'qrcode';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class QRCodeServer {
    app;
    server = null;
    currentQR = null;
    port = 3000;
    constructor() {
        this.app = express();
        this.setupRoutes();
    }
    setupRoutes() {
        // Serve static files if needed
        this.app.use(express.static(path.join(__dirname, 'public')));
        // Main QR page
        this.app.get('/', (req, res) => {
            const html = this.generateQRPage();
            res.send(html);
        });
        // API endpoint to get current QR as image
        this.app.get('/api/qr', async (req, res) => {
            if (!this.currentQR) {
                return res.json({ error: 'אין קוד QR זמין / No QR code available' });
            }
            try {
                // Generate QR code as data URL
                const qrDataURL = await qrcode.toDataURL(this.currentQR, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                res.json({
                    qr: qrDataURL,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                res.status(500).json({ error: 'שגיאה ביצירת QR / Error generating QR' });
            }
        });
        // Status endpoint
        this.app.get('/api/status', (req, res) => {
            res.json({
                hasQR: !!this.currentQR,
                timestamp: new Date().toISOString()
            });
        });
    }
    generateQRPage() {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp QR Code | קוד QR ווטסאפ</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #25D366, #075E54);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
        }
        
        .logo {
            font-size: 3em;
            margin-bottom: 20px;
        }
        
        h1 {
            margin-bottom: 10px;
            font-size: 2em;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .subtitle {
            margin-bottom: 30px;
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .qr-container {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .qr-placeholder {
            color: #666;
            font-size: 1.2em;
            padding: 50px;
        }
        
        .qr-code {
            max-width: 100%;
            height: auto;
        }
        
        .instructions {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            line-height: 1.6;
        }
        
        .step {
            margin: 10px 0;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            text-align: right;
        }
        
        .step-number {
            background: #25D366;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 15px;
            font-weight: bold;
        }
        
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 5px;
            font-weight: bold;
        }
        
        .status.waiting {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
        }
        
        .status.connected {
            background: rgba(40, 167, 69, 0.2);
            color: #28a745;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .footer {
            margin-top: 30px;
            font-size: 0.9em;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📱</div>
        <h1>חיבור ווטסאפ</h1>
        <div class="subtitle">WhatsApp Connection</div>
        
        <div class="qr-container" id="qrContainer">
            <div class="qr-placeholder" id="qrPlaceholder">
                <div class="loading"></div><br>
                טוען קוד QR...<br>
                Loading QR code...
            </div>
            <img class="qr-code" id="qrImage" style="display: none;" alt="QR Code">
        </div>
        
        <div class="instructions">
            <div class="step">
                <div class="step-number">1</div>
                <div>פתח את אפליקציית ווטסאפ בטלפון</div>
            </div>
            <div class="step">
                <div class="step-number">2</div>
                <div>עבור להגדרות ← מכשירים מקושרים</div>
            </div>
            <div class="step">
                <div class="step-number">3</div>
                <div>לחץ על "קשר מכשיר" וסרוק את הקוד</div>
            </div>
        </div>
        
        <div class="status waiting" id="status">
            ממתין לסריקת QR... / Waiting for QR scan...
        </div>
        
        <div class="footer">
            מתעדכן אוטומטית כל 3 שניות<br>
            Auto-refreshing every 3 seconds
        </div>
    </div>

    <script>
        let lastQRTimestamp = null;
        
        async function checkQRCode() {
            try {
                const response = await fetch('/api/qr');
                const data = await response.json();
                
                if (data.qr && data.timestamp !== lastQRTimestamp) {
                    // New QR code available
                    document.getElementById('qrImage').src = data.qr;
                    document.getElementById('qrImage').style.display = 'block';
                    document.getElementById('qrPlaceholder').style.display = 'none';
                    lastQRTimestamp = data.timestamp;
                    
                    document.getElementById('status').textContent = 'סרוק את הקוד עם ווטסאפ / Scan with WhatsApp';
                    document.getElementById('status').className = 'status waiting';
                } else if (data.error) {
                    // No QR code or error
                    document.getElementById('qrImage').style.display = 'none';
                    document.getElementById('qrPlaceholder').style.display = 'block';
                    document.getElementById('qrPlaceholder').innerHTML = 
                        '<div class="loading"></div><br>ממתין לקוד QR...<br>Waiting for QR code...';
                }
            } catch (error) {
                console.error('Error fetching QR:', error);
                document.getElementById('status').textContent = 'שגיאה בטעינת QR / Error loading QR';
                document.getElementById('status').className = 'status waiting';
            }
        }
        
        async function checkConnectionStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                
                if (!data.hasQR) {
                    // Might be connected
                    document.getElementById('status').textContent = 'מחובר! / Connected!';
                    document.getElementById('status').className = 'status connected';
                    document.getElementById('qrPlaceholder').innerHTML = 
                        '✅<br>מחובר בהצלחה!<br>Successfully connected!';
                }
            } catch (error) {
                console.error('Error checking status:', error);
            }
        }
        
        // Check for QR code immediately and then every 3 seconds
        checkQRCode();
        setInterval(() => {
            checkQRCode();
            checkConnectionStatus();
        }, 3000);
    </script>
</body>
</html>
    `;
    }
    async updateQR(qrString) {
        this.currentQR = qrString;
        console.error('🔄 QR הועלה לדף האינטרנט / QR updated on web page');
    }
    clearQR() {
        this.currentQR = null;
        console.error('🧹 QR נוקה מהדף / QR cleared from web page');
    }
    async start() {
        return new Promise((resolve, reject) => {
            // Try different ports if 3000 is busy
            const tryPort = (port) => {
                this.server = this.app.listen(port, () => {
                    this.port = port;
                    const url = `http://localhost:${port}`;
                    console.error(`🌐 שרת QR פועל על: ${url}`);
                    console.error(`🌐 QR server running on: ${url}`);
                    // Open browser automatically
                    open(url).catch(err => {
                        console.error('❌ שגיאה בפתיחת דפדפן / Error opening browser:', err.message);
                        console.error(`🖱️ פתח ידנית: ${url}`);
                        console.error(`🖱️ Open manually: ${url}`);
                    });
                    resolve(url);
                }).on('error', (err) => {
                    if (err.code === 'EADDRINUSE' && port < 3010) {
                        console.error(`⚠️ פורט ${port} תפוס, מנסה ${port + 1}...`);
                        tryPort(port + 1);
                    }
                    else {
                        reject(err);
                    }
                });
            };
            tryPort(3000);
        });
    }
    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.error('🛑 שרת QR נסגר / QR server stopped');
                    resolve();
                });
            });
        }
    }
    getURL() {
        return `http://localhost:${this.port}`;
    }
}
export const qrServer = new QRCodeServer();
//# sourceMappingURL=qr-server.js.map