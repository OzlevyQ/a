#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { whatsAppConnection } from './connection.js';
// Import all tool functions
import { sendMessage, sendMedia, getMessages } from './tools/messaging.js';
import { getChats, getChatInfo } from './tools/chats.js';
import { getContacts, searchContacts } from './tools/contacts.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.API_PORT || 3001;
// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Serve static files for web interface
const webPath = path.join(__dirname, 'web');
app.use(express.static(webPath));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
});
app.use(limiter);
// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WhatsApp Web.js API',
            version: '1.0.0',
            description: 'Complete REST API for WhatsApp automation using whatsapp-web.js',
            contact: {
                name: 'Oz Levy',
                email: 'ozlevy@yadbarzel.info',
                url: 'https://github.com/yourusername/whatsapp-webjs-mcp-server'
            }
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Local development server'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key'
                }
            }
        },
        security: [
            {
                ApiKeyAuth: []
            }
        ]
    },
    apis: [__filename], // files containing annotations
};
const specs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API server is running
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        whatsappConnected: whatsAppConnection.isConnected()
    });
});
// Serve web interface on root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
});
// WhatsApp connection status
/**
 * @swagger
 * /whatsapp/status:
 *   get:
 *     summary: Get WhatsApp connection status
 *     description: Check if WhatsApp is connected and get connection info
 *     responses:
 *       200:
 *         description: Connection status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 connectionData:
 *                   type: object
 */
app.get('/whatsapp/status', async (req, res) => {
    try {
        const status = await whatsAppConnection.getConnectionStatus();
        res.json({
            connected: whatsAppConnection.isConnected(),
            connectionData: status
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get connection status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get current QR code
/**
 * @swagger
 * /whatsapp/qr:
 *   get:
 *     summary: Get current QR code
 *     description: Get the current QR code for WhatsApp authentication (if available)
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: No QR code available
 */
app.get('/whatsapp/qr', (req, res) => {
    const qr = whatsAppConnection.getCurrentQR();
    if (qr) {
        res.json({ qrCode: qr });
    }
    else {
        res.status(404).json({ error: 'No QR code available. WhatsApp might already be connected.' });
    }
});
// Helper function to handle API responses
function handleApiResponse(result, res) {
    if (result.isError) {
        const errorMessage = result.content?.[0]?.text || 'Unknown error';
        res.status(400).json({
            error: errorMessage,
            success: false
        });
    }
    else {
        const responseText = result.content?.[0]?.text || 'Success';
        let responseData;
        // Try to parse JSON response
        try {
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                responseData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            else {
                responseData = { message: responseText };
            }
        }
        catch {
            responseData = { message: responseText };
        }
        res.json({
            success: true,
            data: responseData
        });
    }
}
// MESSAGING ENDPOINTS
/**
 * @swagger
 * /whatsapp/send-message:
 *   post:
 *     summary: Send text message
 *     description: Send a text message to a WhatsApp chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *               - message
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: "Chat ID (format: number@c.us for private, id@g.us for groups)"
 *                 example: "972501234567@c.us"
 *               message:
 *                 type: string
 *                 description: Message text to send
 *                 example: "Hello from API!"
 *               replyToMessageId:
 *                 type: string
 *                 description: Message ID to reply to (optional)
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request or WhatsApp error
 */
app.post('/whatsapp/send-message', async (req, res) => {
    try {
        const { chatId, message, replyToMessageId } = req.body;
        if (!chatId || !message) {
            return res.status(400).json({
                error: 'chatId and message are required',
                success: false
            });
        }
        // Call sendMessage with correct parameters
        const result = await sendMessage({ chatId, message });
        handleApiResponse(result, res);
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            success: false
        });
    }
});
/**
 * @swagger
 * /whatsapp/send-media:
 *   post:
 *     summary: Send media file
 *     description: Send image, video, audio, or document to WhatsApp chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *               - media
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: Chat ID
 *                 example: "972501234567@c.us"
 *               media:
 *                 type: string
 *                 description: File path or base64 encoded media
 *                 example: "/path/to/image.jpg"
 *               caption:
 *                 type: string
 *                 description: Caption for the media (optional)
 *                 example: "Check out this image!"
 *     responses:
 *       200:
 *         description: Media sent successfully
 *       400:
 *         description: Invalid request or WhatsApp error
 */
app.post('/whatsapp/send-media', async (req, res) => {
    try {
        const { chatId, media, caption } = req.body;
        if (!chatId || !media) {
            return res.status(400).json({
                error: 'chatId and media are required',
                success: false
            });
        }
        // Call sendMedia with correct parameters
        const result = await sendMedia({ chatId, media, caption });
        handleApiResponse(result, res);
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            success: false
        });
    }
});
/**
 * @swagger
 * /whatsapp/get-messages:
 *   get:
 *     summary: Get chat messages
 *     description: Retrieve messages from a WhatsApp chat
 *     parameters:
 *       - in: query
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID to get messages from
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of messages to retrieve
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       400:
 *         description: Invalid request or WhatsApp error
 */
app.get('/whatsapp/get-messages', async (req, res) => {
    try {
        const { chatId, limit } = req.query;
        if (!chatId) {
            return res.status(400).json({
                error: 'chatId is required',
                success: false
            });
        }
        const result = await getMessages({
            chatId: chatId,
            limit: limit ? parseInt(limit) : undefined
        });
        handleApiResponse(result, res);
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            success: false
        });
    }
});
// CHAT ENDPOINTS
/**
 * @swagger
 * /whatsapp/get-chats:
 *   get:
 *     summary: Get all chats
 *     description: Retrieve all WhatsApp chats
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of chats to retrieve
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, private, group]
 *           default: all
 *         description: Type of chats to retrieve
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 *       400:
 *         description: Invalid request or WhatsApp error
 */
app.get('/whatsapp/get-chats', async (req, res) => {
    try {
        console.log('🔄 API: /whatsapp/get-chats endpoint called');
        const result = await getChats({ limit: 50 });
        console.log('📊 API: get-chats result:', {
            hasError: result.isError,
            contentType: result.content?.[0]?.type,
            contentLength: result.content?.[0]?.text?.length
        });
        if (result.isError) {
            console.error('❌ API: Error from getChats tool:', result.content?.[0]?.text);
            res.status(500).json({
                success: false,
                error: result.content?.[0]?.text || 'Unknown error'
            });
            return;
        }
        // Parse the response from the tool
        const text = result.content?.[0]?.text || '';
        // Extract JSON from the text response
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1]);
            console.log('✅ API: Successfully parsed chat data:', {
                chatsCount: data.chats?.length || 0,
                hasNote: !!data.note,
                hasError: !!data.error
            });
            res.json({
                success: true,
                data: data
            });
        }
        else {
            console.warn('⚠️ API: Could not parse JSON from response');
            res.json({
                success: false,
                error: 'Could not parse chat data',
                rawResponse: text
            });
        }
    }
    catch (error) {
        console.error('❌ API: Exception in get-chats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /whatsapp/chat-info:
 *   get:
 *     summary: Get chat information
 *     description: Get detailed information about a specific chat
 *     parameters:
 *       - in: query
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID to get information about
 *     responses:
 *       200:
 *         description: Chat information retrieved successfully
 *       400:
 *         description: Invalid request or WhatsApp error
 */
app.get('/whatsapp/chat-info', async (req, res) => {
    try {
        const { chatId } = req.query;
        if (!chatId) {
            return res.status(400).json({
                error: 'chatId is required',
                success: false
            });
        }
        const result = await getChatInfo({ chatId: chatId });
        handleApiResponse(result, res);
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            success: false
        });
    }
});
// CONTACT ENDPOINTS
/**
 * @swagger
 * /whatsapp/get-contacts:
 *   get:
 *     summary: Get all contacts
 *     description: Retrieve all WhatsApp contacts
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *       400:
 *         description: Invalid request or WhatsApp error
 */
app.get('/whatsapp/get-contacts', async (req, res) => {
    try {
        const result = await getContacts({});
        handleApiResponse(result, res);
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            success: false
        });
    }
});
/**
 * @swagger
 * /whatsapp/search-contacts:
 *   get:
 *     summary: Search contacts
 *     description: Search for contacts by name or number
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name or number)
 *     responses:
 *       200:
 *         description: Search completed successfully
 *       400:
 *         description: Invalid request or WhatsApp error
 */
app.get('/whatsapp/search-contacts', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({
                error: 'query is required',
                success: false
            });
        }
        const result = await searchContacts({ query: query });
        handleApiResponse(result, res);
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            success: false
        });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        success: false
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
        success: false,
        availableEndpoints: [
            'GET /health',
            'GET /whatsapp/status',
            'GET /whatsapp/qr',
            'POST /whatsapp/send-message',
            'POST /whatsapp/send-media',
            'GET /whatsapp/get-messages',
            'GET /whatsapp/get-chats',
            'GET /whatsapp/chat-info',
            'GET /whatsapp/get-contacts',
            'GET /whatsapp/search-contacts',
            'GET /api-docs (Swagger documentation)'
        ]
    });
});
// Start server
async function startServer() {
    try {
        // Ensure WhatsApp connection is initialized
        console.error('🚀 מתחיל שרת API / Starting API server...');
        // Start the HTTP server first
        const server = app.listen(PORT, () => {
            console.error(`✅ שרת API פועל על פורט ${PORT} / API server running on port ${PORT}`);
            console.error(`📖 תיעוד API זמין ב: http://localhost:${PORT}/api-docs`);
            console.error(`🌐 API Documentation available at: http://localhost:${PORT}/api-docs`);
            console.error(`💡 בדיקת בריאות: http://localhost:${PORT}/health`);
            console.error(`💡 Health check: http://localhost:${PORT}/health`);
        });
        // Handle server startup errors
        server.on('error', (error) => {
            console.error('❌ שגיאה בהפעלת שרת / Server startup error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error(`🔴 פורט ${PORT} תפוס. נסה פורט אחר / Port ${PORT} is in use. Try another port.`);
            }
            process.exit(1);
        });
        // Try to connect to WhatsApp after server is running
        setTimeout(async () => {
            try {
                if (!whatsAppConnection.isConnected()) {
                    console.error('📱 מנסה להתחבר לווטסאפ עם חיבור חכם / Attempting smart connect to WhatsApp...');
                    await whatsAppConnection.smartConnect();
                    console.error('🟢 ווטסאפ מחובר ומוכן לשימוש / WhatsApp connected and ready');
                }
                else {
                    console.error('🟢 ווטסאפ כבר מחובר / WhatsApp already connected');
                }
            }
            catch (error) {
                console.error('⚠️ לא הצליח להתחבר לווטסאפ אוטומטית / Could not auto-connect to WhatsApp');
                console.error('🔗 שרת API פועל, אבל WhatsApp לא מחובר / API server is running, but WhatsApp is not connected');
                console.error(`🔑 קוד QR זמין ב: http://localhost:${PORT}/whatsapp/qr`);
            }
        }, 1000);
    }
    catch (error) {
        console.error('❌ שגיאה בהפעלת שרת API / Error starting API server:', error);
        process.exit(1);
    }
}
// Handle process termination
process.on('SIGINT', async () => {
    console.error('\n🛑 מכבה שרת API / Shutting down API server...');
    try {
        await whatsAppConnection.disconnect();
        console.error('✅ התנתק מווטסאפ בהצלחה / Disconnected from WhatsApp successfully');
    }
    catch (error) {
        console.error('❌ שגיאה בהתנתקות מווטסאפ / Error disconnecting from WhatsApp:', error);
    }
    process.exit(0);
});
// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}
// Debug logging to help identify startup issues
console.error('🔍 Debug: import.meta.url =', import.meta.url);
console.error('🔍 Debug: process.argv[1] =', process.argv[1]);
console.error('🔍 Debug: file:// + process.argv[1] =', `file://${process.argv[1]}`);
// Alternative startup condition for Windows compatibility
const currentFileUrl = import.meta.url;
const scriptPath = process.argv[1];
const isMainModule = currentFileUrl.includes(scriptPath.replace(/\\/g, '/')) ||
    process.argv[1].endsWith('api-server.js');
console.error('🔍 Debug: isMainModule =', isMainModule);
if (isMainModule) {
    console.error('🚀 Starting server based on alternative condition...');
    startServer();
}
app.post('/whatsapp/click-chat', async (req, res) => {
    try {
        console.log('🖱️ API: /whatsapp/click-chat endpoint called');
        const { chatId, chatName } = req.body;
        if (!chatId || !chatName) {
            return res.status(400).json({
                success: false,
                error: 'Missing chatId or chatName'
            });
        }
        console.log(`📞 Attempting to click on chat: ${chatName} (${chatId})`);
        // Extract element index from chatId
        const elementIndex = parseInt(chatId.replace('clickable_', '').split('_')[0]) || 0;
        const result = await whatsAppConnection.client.pupPage.evaluate((index, name) => {
            try {
                // Find chat elements
                const chatElements = document.querySelectorAll('[data-testid="conversation-panel-messages"] div[role="listitem"], [data-testid="chat-list"] div[role="listitem"], #pane-side div[role="listitem"]');
                if (chatElements.length === 0) {
                    const altElements = document.querySelectorAll('#pane-side div[role="listitem"], #pane-side div[aria-label]');
                    if (altElements.length > index) {
                        altElements[index].click();
                        return { success: true, message: `Clicked on alternative chat element ${index}` };
                    }
                }
                else if (chatElements.length > index) {
                    chatElements[index].click();
                    return { success: true, message: `Clicked on chat element ${index}` };
                }
                // Try to find by name if index doesn't work
                const allElements = document.querySelectorAll('#pane-side div[role="listitem"], #pane-side div[aria-label]');
                for (let i = 0; i < allElements.length; i++) {
                    const element = allElements[i];
                    const spans = element.querySelectorAll('span');
                    for (const span of spans) {
                        if (span.textContent && span.textContent.trim() === name) {
                            element.click();
                            return { success: true, message: `Clicked on chat by name: ${name}` };
                        }
                    }
                }
                return { success: false, message: 'Chat element not found' };
            }
            catch (error) {
                return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
            }
        }, elementIndex, chatName);
        console.log('📋 Click result:', result);
        res.json({
            success: result.success,
            message: result.message
        });
    }
    catch (error) {
        console.error('❌ API: Exception in click-chat:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export { app, startServer };
//# sourceMappingURL=api-server.js.map