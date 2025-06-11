#!/usr/bin/env node
// Import from whatsapp-web.js with CommonJS compatibility
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { qrServer } from './qr-server.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use absolute paths based on the project directory
const PROJECT_ROOT = path.join(__dirname, '..');
const SESSION_PATH = path.join(PROJECT_ROOT, '.wwebjs_auth');
const CONNECTION_INFO_PATH = path.join(PROJECT_ROOT, 'whatsapp-connection.json');
const QR_CODE_PATH = path.join(PROJECT_ROOT, 'whatsapp-qr.txt');
export class WhatsAppConnectionManager {
    client = null;
    connectionData;
    sessionDir;
    connectionFile;
    _isConnected = false;
    connectionInfo = null;
    currentQR = null;
    constructor() {
        this.sessionDir = path.join(__dirname, '..', 'session');
        this.connectionFile = path.join(this.sessionDir, 'connection.json');
        this.connectionData = {
            isAuthenticated: false,
            isReady: false,
            sessionPath: this.sessionDir
        };
        console.error('🔄 מנהל חיבורים ווטסאפ מתחיל / WhatsApp Connection Manager starting...');
        console.error('📁 נתיב פרויקט:', PROJECT_ROOT);
        console.error('📁 נתיב session:', SESSION_PATH);
        console.error('📁 נתיב חיבור:', CONNECTION_INFO_PATH);
    }
    async saveQRCode(qr, qrText) {
        try {
            this.currentQR = qrText;
            // Update QR server and start if not running
            await qrServer.updateQR(qr);
            // Also save QR as text file for backup
            const qrContent = `WhatsApp QR Code - ${new Date().toLocaleString('he-IL')}
=================================================

סרוק את קוד ה-QR הזה עם ווטסאפ בטלפון:
Scan this QR code with WhatsApp on your phone:

${qrText}

=================================================
פתח את ווטסאפ בטלפון > הגדרות > מכשירים מקושרים > קשר מכשיר
Open WhatsApp on phone > Settings > Linked Devices > Link Device
`;
            await fs.writeFile(QR_CODE_PATH, qrContent, 'utf8');
            console.error(`📄 קוד QR נשמר לקובץ: ${QR_CODE_PATH}`);
            console.error('🌐 קוד QR זמין גם בדפדפן / QR code also available in browser');
        }
        catch (error) {
            console.error('❌ שגיאה בשמירת קוד QR / Error saving QR code:', error);
        }
    }
    async clearQRCode() {
        try {
            this.currentQR = null;
            // Clear QR from server
            qrServer.clearQR();
            if (await fs.pathExists(QR_CODE_PATH)) {
                await fs.remove(QR_CODE_PATH);
            }
        }
        catch (error) {
            console.error('❌ שגיאה בניקוי קוד QR / Error clearing QR code:', error);
        }
    }
    getCurrentQR() {
        return this.currentQR;
    }
    async connect() {
        try {
            console.error('🔄 מתחבר לווטסאפ / Connecting to WhatsApp...');
            // Ensure session directory exists
            await fs.ensureDir(this.sessionDir);
            // Load existing connection data
            await this.loadConnectionData();
            // Initialize WhatsApp client with LocalAuth
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: 'whatsapp-mcp-server',
                    dataPath: this.sessionDir
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu'
                    ]
                }
            });
            // Create a promise that resolves when connection is ready
            const connectionPromise = new Promise((resolve, reject) => {
                let isResolved = false;
                // Event handlers
                this.client.on('qr', async (qr) => {
                    console.error('\n⚠️ Session פג תוקף - נדרש QR חדש / Session expired - New QR required!');
                    console.error('📱 סרוק את קוד ה-QR עם ווטסאפ / Scan QR code with WhatsApp:');
                    // Generate QR code but write to stderr to avoid stdout pollution
                    try {
                        // Capture stdout to redirect QR to stderr
                        const originalWrite = process.stdout.write;
                        let qrOutput = '';
                        // Temporarily override stdout.write to capture QR code
                        process.stdout.write = function (string, encoding, fd) {
                            qrOutput += string;
                            return true;
                        };
                        // Generate QR code
                        qrcode.generate(qr, { small: true });
                        // Restore original stdout.write
                        process.stdout.write = originalWrite;
                        // Write captured QR to stderr
                        process.stderr.write(qrOutput);
                        // Save QR code to file for easy viewing
                        await this.saveQRCode(qr, qrOutput);
                    }
                    catch (error) {
                        console.error('QR Code:', qr);
                    }
                });
                this.client.on('ready', async () => {
                    if (isResolved)
                        return;
                    isResolved = true;
                    console.error('✅ החיבור לווטסאפ מוכן! / WhatsApp connection ready!');
                    this.connectionData.isReady = true;
                    this.connectionData.isAuthenticated = true;
                    this.connectionData.connectedAt = new Date();
                    this._isConnected = true;
                    // Clear QR code file since we're now connected
                    await this.clearQRCode();
                    if (this.client) {
                        this.connectionData.clientInfo = await this.client.info;
                    }
                    await this.saveConnectionData();
                    resolve();
                });
                this.client.on('authenticated', async () => {
                    console.error('🔐 אומת בהצלחה / Successfully authenticated');
                    this.connectionData.isAuthenticated = true;
                    // Clear QR code file since we're authenticated
                    await this.clearQRCode();
                });
                this.client.on('auth_failure', (msg) => {
                    if (isResolved)
                        return;
                    isResolved = true;
                    console.error('❌ כשל באימות / Authentication failed:', msg);
                    this.connectionData.isAuthenticated = false;
                    reject(new Error(`Authentication failed: ${msg}`));
                });
                this.client.on('disconnected', async (reason) => {
                    console.error('🔌 התנתק מווטסאפ / Disconnected from WhatsApp:', reason);
                    this.connectionData.isReady = false;
                    this.connectionData.isAuthenticated = false;
                    this._isConnected = false;
                    await this.saveConnectionData();
                    if (!isResolved) {
                        isResolved = true;
                        reject(new Error(`Disconnected: ${reason}`));
                    }
                });
                // Set a reasonable timeout (5 minutes instead of 30 seconds)
                setTimeout(() => {
                    if (!isResolved) {
                        isResolved = true;
                        reject(new Error('WhatsApp initialization timeout after 5 minutes'));
                    }
                }, 300000);
            });
            // Initialize the client
            console.error('🔄 מאתחל לקוח ווטסאפ / Initializing WhatsApp client...');
            // Start initialization (non-blocking)
            this.client.initialize().catch((error) => {
                console.error('❌ שגיאה באתחול / Initialization error:', error);
            });
            // Wait for connection to be ready
            await connectionPromise;
            console.error('✅ לקוח ווטסאפ מחובר ומוכן לשימוש / WhatsApp client connected and ready for use!');
        }
        catch (error) {
            console.error('❌ שגיאה בהתחברות / Connection error:', error);
            this._isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (this.client) {
            console.error('🔌 מתנתק מווטסאפ / Disconnecting from WhatsApp...');
            await this.client.destroy();
            this.client = null;
            this.connectionData.isReady = false;
            await this.saveConnectionData();
            // Stop QR server
            await qrServer.stop();
            console.error('✅ התנתק בהצלחה / Successfully disconnected');
        }
    }
    isConnected() {
        return this._isConnected && this.client !== null;
    }
    async saveConnectionData() {
        try {
            await fs.ensureDir(this.sessionDir);
            const dataToSave = {
                ...this.connectionData,
                connectedAt: this.connectionData.connectedAt?.toISOString()
            };
            await fs.writeJSON(this.connectionFile, dataToSave, { spaces: 2 });
            console.error('💾 נתוני החיבור נשמרו / Connection data saved');
        }
        catch (error) {
            console.error('❌ שגיאה בשמירת נתוני החיבור / Error saving connection data:', error);
        }
    }
    async loadConnectionData() {
        try {
            if (await fs.pathExists(this.connectionFile)) {
                const data = await fs.readJSON(this.connectionFile);
                this.connectionData = {
                    ...data,
                    connectedAt: data.connectedAt ? new Date(data.connectedAt) : undefined,
                    sessionPath: this.sessionDir
                };
                console.error('📂 נתוני החיבור נטענו / Connection data loaded');
            }
        }
        catch (error) {
            console.error('❌ שגיאה בטעינת נתוני החיבור / Error loading connection data:', error);
        }
    }
    async getConnectionStatus() {
        if (!this.client) {
            return {
                connected: false,
                authenticated: false,
                ready: false,
                message: 'Client not initialized'
            };
        }
        try {
            const state = await this.client.getState();
            return {
                connected: this.isConnected(),
                authenticated: this.connectionData.isAuthenticated,
                ready: this.connectionData.isReady,
                state,
                clientInfo: this.connectionData.clientInfo,
                connectedAt: this.connectionData.connectedAt
            };
        }
        catch (error) {
            return {
                connected: false,
                authenticated: this.connectionData.isAuthenticated,
                ready: this.connectionData.isReady,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async loadExistingConnection() {
        try {
            // Check if connection info exists
            if (!await fs.pathExists(CONNECTION_INFO_PATH)) {
                console.error('❌ לא נמצא מידע חיבור קיים / No existing connection info found');
                console.error('📝 הרץ תחילה: npm run setup');
                console.error('📝 First run: npm run setup');
                return false;
            }
            // Check if session folder exists
            if (!await fs.pathExists(SESSION_PATH)) {
                console.error('❌ לא נמצאו קבצי session / No session files found');
                console.error('📝 הרץ תחילה: npm run setup');
                console.error('📝 First run: npm run setup');
                return false;
            }
            // Load connection info
            this.connectionInfo = await fs.readJson(CONNECTION_INFO_PATH);
            console.error('📖 טוען מידע חיבור קיים / Loading existing connection info...');
            console.error(`👤 משתמש: ${this.connectionInfo.clientInfo?.pushname || 'Unknown'}`);
            console.error(`🕐 חיבור אחרון: ${this.connectionInfo.lastConnection}`);
            return true;
        }
        catch (error) {
            console.error('❌ שגיאה בטעינת מידע חיבור / Error loading connection info:', error);
            return false;
        }
    }
    async connectWithExistingSession() {
        console.error('🔄 מתחבר עם session קיים / Connecting with existing session...');
        // Check if session exists
        const sessionExists = await fs.pathExists(path.join(this.sessionDir, 'session-whatsapp-mcp-server'));
        if (!sessionExists) {
            throw new Error('No existing session found. Please run setup first or use regular connect() method.');
        }
        // Initialize WhatsApp client with existing session
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'whatsapp-mcp-server',
                dataPath: this.sessionDir
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });
        // Create a promise that resolves when connection is ready
        const connectionPromise = new Promise((resolve, reject) => {
            let isResolved = false;
            // Handle QR code if session expired
            this.client.on('qr', async (qr) => {
                console.error('\n⚠️ Session פג תוקף - נדרש QR חדש / Session expired - New QR required!');
                console.error('📱 סרוק את קוד ה-QR עם ווטסאפ / Scan QR code with WhatsApp:');
                try {
                    // Capture stdout to redirect QR to stderr
                    const originalWrite = process.stdout.write;
                    let qrOutput = '';
                    // Temporarily override stdout.write to capture QR code
                    process.stdout.write = function (string, encoding, fd) {
                        qrOutput += string;
                        return true;
                    };
                    // Generate QR code
                    qrcode.generate(qr, { small: true });
                    // Restore original stdout.write
                    process.stdout.write = originalWrite;
                    // Write captured QR to stderr
                    process.stderr.write(qrOutput);
                    // Save QR code to file for easy viewing
                    await this.saveQRCode(qr, qrOutput);
                }
                catch (error) {
                    console.error('QR Code:', qr);
                }
            });
            this.client.on('authenticated', async () => {
                console.error('✅ אימות הצליח! / Authentication successful!');
                // Clear QR code file since we're authenticated
                await this.clearQRCode();
            });
            this.client.on('auth_failure', (msg) => {
                if (isResolved)
                    return;
                isResolved = true;
                console.error('❌ שגיאת אימות / Authentication failed:', msg);
                this._isConnected = false;
                reject(new Error(`Authentication failed: ${msg}`));
            });
            this.client.on('ready', async () => {
                if (isResolved)
                    return;
                isResolved = true;
                console.error('🎉 ווטסאפ מחובר ומוכן! / WhatsApp connected and ready!');
                this._isConnected = true;
                // Clear QR code file since we're now connected
                await this.clearQRCode();
                // Update connection info
                if (this.client?.info) {
                    const info = this.client.info;
                    this.connectionData.isReady = true;
                    this.connectionData.isAuthenticated = true;
                    this.connectionData.connectedAt = new Date();
                    this.connectionData.clientInfo = info;
                    await this.saveConnectionData();
                    console.error('💾 מידע חיבור עודכן / Connection info updated');
                }
                resolve();
            });
            this.client.on('disconnected', (reason) => {
                console.error('🔌 התנתק מווטסאפ / Disconnected from WhatsApp:', reason);
                this._isConnected = false;
                if (reason === 'LOGOUT') {
                    console.error('👋 משתמש התנתק / User logged out');
                    this.cleanup();
                }
            });
            // Set timeout (5 minutes)
            setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    reject(new Error('WhatsApp connection timeout after 5 minutes'));
                }
            }, 300000);
        });
        try {
            console.error('🔄 מאתחל חיבור / Initializing connection...');
            // Start initialization (non-blocking)
            this.client.initialize().catch((error) => {
                console.error('❌ שגיאה באתחול / Initialization error:', error);
            });
            // Wait for connection to be ready
            await connectionPromise;
            console.error('✅ התחברות עם session קיים הושלמה בהצלחה! / Successfully connected with existing session!');
        }
        catch (error) {
            console.error('❌ שגיאה באתחול לקוח / Client initialization error:', error);
            this._isConnected = false;
            throw error;
        }
    }
    async saveConnectionInfo() {
        try {
            await fs.writeJson(CONNECTION_INFO_PATH, this.connectionInfo, { spaces: 2 });
        }
        catch (error) {
            console.error('❌ שגיאה בשמירת מידע חיבור / Error saving connection info:', error);
        }
    }
    async cleanup() {
        try {
            await fs.remove(SESSION_PATH);
            await fs.remove(CONNECTION_INFO_PATH);
            console.error('🧹 נתוני session נוקו / Session data cleaned up');
        }
        catch (error) {
            console.error('❌ שגיאה בניקוי / Cleanup error:', error);
        }
    }
    getConnectionInfo() {
        return this.connectionInfo;
    }
    async smartConnect() {
        console.error('🧠 חיבור חכם מתחיל / Smart connect starting...');
        try {
            // First, check if we have an existing session
            const sessionExists = await fs.pathExists(path.join(this.sessionDir, 'session-whatsapp-mcp-server'));
            if (sessionExists) {
                console.error('🔍 נמצא session קיים, מנסה להתחבר / Found existing session, attempting to connect...');
                try {
                    await this.connectWithExistingSession();
                    console.error('✅ התחברות עם session קיים הצליחה! / Successfully connected with existing session!');
                    return;
                }
                catch (error) {
                    console.error('⚠️ חיבור עם session קיים נכשל, מנסה חיבור רגיל / Existing session connection failed, trying regular connect...');
                    console.error('📝 סיבה:', error instanceof Error ? error.message : error);
                    // Clean up failed client
                    if (this.client) {
                        try {
                            await this.client.destroy();
                        }
                        catch (e) {
                            // Ignore cleanup errors
                        }
                        this.client = null;
                    }
                }
            }
            else {
                console.error('🆕 לא נמצא session קיים / No existing session found');
            }
            // If we get here, either no session exists or session connection failed
            console.error('🔄 מתחבר עם חיבור רגיל / Connecting with regular method...');
            await this.connect();
        }
        catch (error) {
            console.error('❌ חיבור חכם נכשל / Smart connect failed:', error);
            throw error;
        }
    }
}
// Export singleton instance
let whatsAppConnectionInstance = null;
export function getWhatsAppConnection() {
    if (!whatsAppConnectionInstance) {
        whatsAppConnectionInstance = new WhatsAppConnectionManager();
    }
    return whatsAppConnectionInstance;
}
// Create a proxy object that creates the instance only when needed
export const whatsAppConnection = new Proxy({}, {
    get(target, prop) {
        const instance = getWhatsAppConnection();
        const value = instance[prop];
        if (typeof value === 'function') {
            return value.bind(instance);
        }
        return value;
    },
    set(target, prop, value) {
        const instance = getWhatsAppConnection();
        instance[prop] = value;
        return true;
    }
});
//# sourceMappingURL=connection.js.map