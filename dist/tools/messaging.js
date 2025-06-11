import { whatsAppConnection } from '../connection.js';
// Import from whatsapp-web.js with CommonJS compatibility
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
// Send Text Message Tool
export const sendMessageTool = {
    name: 'whatsapp_send_message',
    description: 'Send a text message to a WhatsApp chat / שלח הודעת טקסט לצ\'אט ווטסאפ',
    inputSchema: {
        type: 'object',
        required: ['chatId', 'message'],
        properties: {
            chatId: {
                type: 'string',
                description: 'Chat ID (phone number with country code or group ID) / מזהה צ\'אט (מספר טלפון עם קוד מדינה או מזהה קבוצה)'
            },
            message: {
                type: 'string',
                description: 'Message text to send / טקסט ההודעה לשליחה'
            },
            options: {
                type: 'object',
                properties: {
                    mentions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of contact IDs to mention / מערך של מזהי אנשי קשר לציון'
                    },
                    quotedMessageId: {
                        type: 'string',
                        description: 'ID of message to quote / מזהה ההודעה לציטוט'
                    },
                    linkPreview: {
                        type: 'boolean',
                        description: 'Enable link preview / הפעל תצוגה מקדימה של קישור'
                    }
                }
            }
        }
    }
};
export async function sendMessage(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const chat = await whatsAppConnection.client.getChatById(args.chatId);
        const messageOptions = {};
        if (args.options?.mentions) {
            messageOptions.mentions = args.options.mentions;
        }
        if (args.options?.quotedMessageId) {
            const quotedMessage = await whatsAppConnection.client.getMessageById(args.options.quotedMessageId);
            messageOptions.quotedMsg = quotedMessage;
        }
        if (args.options?.linkPreview !== undefined) {
            messageOptions.linkPreview = args.options.linkPreview;
        }
        const message = await chat.sendMessage(args.message, messageOptions);
        return {
            content: [{
                    type: 'text',
                    text: `Message sent successfully! / ההודעה נשלחה בהצלחה!\nMessage ID: ${message.id._serialized}\nTo: ${chat.name || args.chatId}\nContent: ${args.message}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to send message / שגיאה בשליחת ההודעה: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
// Send Media Message Tool
export const sendMediaTool = {
    name: 'whatsapp_send_media',
    description: 'Send media (image, video, audio, document) to a WhatsApp chat / שלח מדיה (תמונה, וידאו, אודיו, מסמך) לצ\'אט ווטסאפ',
    inputSchema: {
        type: 'object',
        required: ['chatId', 'media'],
        properties: {
            chatId: {
                type: 'string',
                description: 'Chat ID to send media to / מזהה צ\'אט לשליחת המדיה'
            },
            media: {
                type: 'string',
                description: 'Base64 encoded media data or file path / נתוני מדיה מקודדים base64 או נתיב קובץ'
            },
            caption: {
                type: 'string',
                description: 'Caption for the media / כיתוב למדיה'
            },
            options: {
                type: 'object',
                properties: {
                    mentions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of contact IDs to mention / מערך של מזהי אנשי קשר לציון'
                    },
                    quotedMessageId: {
                        type: 'string',
                        description: 'ID of message to quote / מזהה ההודעה לציטוט'
                    }
                }
            }
        }
    }
};
export async function sendMedia(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const chat = await whatsAppConnection.client.getChatById(args.chatId);
        const media = MessageMedia.fromFilePath(args.media);
        const messageOptions = {};
        if (args.caption) {
            messageOptions.caption = args.caption;
        }
        if (args.options?.mentions) {
            messageOptions.mentions = args.options.mentions;
        }
        if (args.options?.quotedMessageId) {
            const quotedMessage = await whatsAppConnection.client.getMessageById(args.options.quotedMessageId);
            messageOptions.quotedMsg = quotedMessage;
        }
        const message = await chat.sendMessage(media, messageOptions);
        return {
            content: [{
                    type: 'text',
                    text: `Media sent successfully! / המדיה נשלחה בהצלחה!\nMessage ID: ${message.id._serialized}\nTo: ${chat.name || args.chatId}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to send media / שגיאה בשליחת המדיה: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
// Get Messages Tool
export const getMessagesTool = {
    name: 'whatsapp_get_messages',
    description: 'Get messages from a WhatsApp chat / קבל הודעות מצ\'אט ווטסאפ',
    inputSchema: {
        type: 'object',
        required: ['chatId'],
        properties: {
            chatId: {
                type: 'string',
                description: 'Chat ID to get messages from / מזהה צ\'אט לקבלת הודעות'
            },
            limit: {
                type: 'number',
                description: 'Maximum number of messages to retrieve (default: 50) / מספר מקסימלי של הודעות לקבלה',
                default: 50
            },
            searchTerm: {
                type: 'string',
                description: 'Search for specific text in messages / חפש טקסט ספציפי בהודעות'
            }
        }
    }
};
export async function getMessages(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const chat = await whatsAppConnection.client.getChatById(args.chatId);
        const messages = await chat.fetchMessages({ limit: args.limit || 50 });
        let filteredMessages = messages;
        if (args.searchTerm) {
            filteredMessages = messages.filter((msg) => msg.body && msg.body.toLowerCase().includes(args.searchTerm.toLowerCase()));
        }
        const messageList = filteredMessages.map((msg) => ({
            id: msg.id._serialized,
            from: msg.from,
            to: msg.to,
            body: msg.body,
            timestamp: new Date(msg.timestamp * 1000).toISOString(),
            type: msg.type,
            fromMe: msg.fromMe,
            author: msg.author,
            hasMedia: msg.hasMedia
        }));
        return {
            content: [{
                    type: 'text',
                    text: `Found ${filteredMessages.length} messages / נמצאו ${filteredMessages.length} הודעות:\n\n${JSON.stringify(messageList, null, 2)}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to get messages / שגיאה בקבלת הודעות: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
// Forward Message Tool
export const forwardMessageTool = {
    name: 'whatsapp_forward_message',
    description: 'Forward a message to another chat / העבר הודעה לצ\'אט אחר',
    inputSchema: {
        type: 'object',
        required: ['messageId', 'toChatId'],
        properties: {
            messageId: {
                type: 'string',
                description: 'ID of the message to forward / מזהה ההודעה להעברה'
            },
            toChatId: {
                type: 'string',
                description: 'Chat ID to forward the message to / מזהה צ\'אט להעברת ההודעה'
            }
        }
    }
};
export async function forwardMessage(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const message = await whatsAppConnection.client.getMessageById(args.messageId);
        const targetChat = await whatsAppConnection.client.getChatById(args.toChatId);
        await message.forward(targetChat);
        return {
            content: [{
                    type: 'text',
                    text: `Message forwarded successfully! / ההודעה הועברה בהצלחה!\nFrom: ${message.from}\nTo: ${args.toChatId}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to forward message / שגיאה בהעברת ההודעה: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
// Delete Message Tool
export const deleteMessageTool = {
    name: 'whatsapp_delete_message',
    description: 'Delete a message / מחק הודעה',
    inputSchema: {
        type: 'object',
        required: ['messageId'],
        properties: {
            messageId: {
                type: 'string',
                description: 'ID of the message to delete / מזהה ההודעה למחיקה'
            },
            everyone: {
                type: 'boolean',
                description: 'Delete for everyone (default: false) / מחק עבור כולם',
                default: false
            }
        }
    }
};
export async function deleteMessage(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const message = await whatsAppConnection.client.getMessageById(args.messageId);
        await message.delete(args.everyone || false);
        return {
            content: [{
                    type: 'text',
                    text: `Message deleted successfully! / ההודעה נמחקה בהצלחה!\nMessage ID: ${args.messageId}\nFor everyone: ${args.everyone ? 'Yes / כן' : 'No / לא'}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to delete message / שגיאה במחיקת ההודעה: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
//# sourceMappingURL=messaging.js.map