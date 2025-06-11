import { whatsAppConnection } from '../connection.js';
// Get All Contacts Tool
export const getContactsTool = {
    name: 'whatsapp_get_contacts',
    description: 'Get all WhatsApp contacts / קבל את כל אנשי הקשר של ווטסאפ',
    inputSchema: {
        type: 'object',
        properties: {
            limit: {
                type: 'number',
                description: 'Maximum number of contacts to retrieve (default: 100) / מספר מקסימלי של אנשי קשר לקבלה',
                default: 100
            }
        }
    }
};
export async function getContacts(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const contacts = await whatsAppConnection.client.getContacts();
        const limitedContacts = contacts.slice(0, args.limit || 100);
        const contactList = limitedContacts.map((contact) => ({
            id: contact.id._serialized,
            name: contact.name,
            pushname: contact.pushname,
            shortName: contact.shortName,
            number: contact.number,
            isMe: contact.isMe,
            isUser: contact.isUser,
            isGroup: contact.isGroup,
            isWAContact: contact.isWAContact,
            isMyContact: contact.isMyContact,
            isBlocked: contact.isBlocked,
            isBusiness: contact.isBusiness,
            isEnterprise: contact.isEnterprise
        }));
        return {
            content: [{
                    type: 'text',
                    text: `Found ${limitedContacts.length} contacts / נמצאו ${limitedContacts.length} אנשי קשר:\n\n${JSON.stringify(contactList, null, 2)}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to get contacts / שגיאה בקבלת אנשי קשר: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
// Get Contact Info Tool
export const getContactInfoTool = {
    name: 'whatsapp_get_contact_info',
    description: 'Get detailed information about a specific contact / קבל מידע מפורט על איש קשר ספציפי',
    inputSchema: {
        type: 'object',
        required: ['contactId'],
        properties: {
            contactId: {
                type: 'string',
                description: 'Contact ID to get information about / מזהה איש קשר לקבלת מידע'
            }
        }
    }
};
export async function getContactInfo(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const contact = await whatsAppConnection.client.getContactById(args.contactId);
        const contactInfo = {
            id: contact.id._serialized,
            name: contact.name,
            pushname: contact.pushname,
            shortName: contact.shortName,
            number: contact.number,
            isMe: contact.isMe,
            isUser: contact.isUser,
            isGroup: contact.isGroup,
            isWAContact: contact.isWAContact,
            isMyContact: contact.isMyContact,
            isBlocked: contact.isBlocked,
            isBusiness: contact.isBusiness,
            isEnterprise: contact.isEnterprise,
            profilePicUrl: await contact.getProfilePicUrl().catch(() => null),
            about: await contact.getAbout().catch(() => null),
            commonGroups: await contact.getCommonGroups().catch(() => [])
        };
        return {
            content: [{
                    type: 'text',
                    text: `Contact information / מידע איש קשר:\n\n${JSON.stringify(contactInfo, null, 2)}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to get contact info / שגיאה בקבלת מידע איש קשר: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
// Block Contact Tool
export const blockContactTool = {
    name: 'whatsapp_block_contact',
    description: 'Block or unblock a contact / חסום או בטל חסימה של איש קשר',
    inputSchema: {
        type: 'object',
        required: ['contactId'],
        properties: {
            contactId: {
                type: 'string',
                description: 'Contact ID to block/unblock / מזהה איש קשר לחסימה/ביטול חסימה'
            },
            block: {
                type: 'boolean',
                description: 'True to block, false to unblock / אמת לחסימה, שקר לביטול חסימה',
                default: true
            }
        }
    }
};
export async function blockContact(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const contact = await whatsAppConnection.client.getContactById(args.contactId);
        const shouldBlock = args.block !== false;
        if (shouldBlock) {
            await contact.block();
        }
        else {
            await contact.unblock();
        }
        return {
            content: [{
                    type: 'text',
                    text: `Contact ${shouldBlock ? 'blocked' : 'unblocked'} successfully! / איש קשר ${shouldBlock ? 'נחסם' : 'בוטלה חסימתו'} בהצלחה!\nContact: ${contact.name || contact.pushname || args.contactId}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to block contact / שגיאה בחסימת איש קשר: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
// Get Profile Picture Tool
export const getProfilePicTool = {
    name: 'whatsapp_get_profile_picture',
    description: 'Get profile picture URL for a contact / קבל כתובת תמונת פרופיל של איש קשר',
    inputSchema: {
        type: 'object',
        required: ['contactId'],
        properties: {
            contactId: {
                type: 'string',
                description: 'Contact ID to get profile picture for / מזהה איש קשר לקבלת תמונת פרופיל'
            }
        }
    }
};
export async function getProfilePic(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const contact = await whatsAppConnection.client.getContactById(args.contactId);
        const profilePicUrl = await contact.getProfilePicUrl();
        return {
            content: [{
                    type: 'text',
                    text: `Profile picture URL / כתובת תמונת פרופיל:\nContact: ${contact.name || contact.pushname || args.contactId}\nURL: ${profilePicUrl}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to get profile picture / שגיאה בקבלת תמונת פרופיל: ${error instanceof Error ? error.message : 'No profile picture available'}`
                }]
        };
    }
}
// Get Contact About Tool
export const getContactAboutTool = {
    name: 'whatsapp_get_contact_about',
    description: 'Get contact\'s about/status message / קבל הודעת סטטוס של איש קשר',
    inputSchema: {
        type: 'object',
        required: ['contactId'],
        properties: {
            contactId: {
                type: 'string',
                description: 'Contact ID to get about message for / מזהה איש קשר לקבלת הודעת סטטוס'
            }
        }
    }
};
export async function getContactAbout(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const contact = await whatsAppConnection.client.getContactById(args.contactId);
        const about = await contact.getAbout();
        return {
            content: [{
                    type: 'text',
                    text: `Contact about / הודעת סטטוס:\nContact: ${contact.name || contact.pushname || args.contactId}\nAbout: ${about}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to get contact about / שגיאה בקבלת הודעת סטטוס: ${error instanceof Error ? error.message : 'No about message available'}`
                }]
        };
    }
}
// Get Common Groups Tool
export const getCommonGroupsTool = {
    name: 'whatsapp_get_common_groups',
    description: 'Get groups that you share with a contact / קבל קבוצות שאתה חולק עם איש קשר',
    inputSchema: {
        type: 'object',
        required: ['contactId'],
        properties: {
            contactId: {
                type: 'string',
                description: 'Contact ID to get common groups with / מזהה איש קשר לקבלת קבוצות משותפות'
            }
        }
    }
};
export async function getCommonGroups(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const contact = await whatsAppConnection.client.getContactById(args.contactId);
        const commonGroups = await contact.getCommonGroups();
        const groupList = commonGroups.map((group) => {
            // Since commonGroups returns ChatId objects, we need to handle them differently
            const groupAny = group;
            return {
                id: groupAny._serialized || groupAny.user || 'unknown',
                name: groupAny.name || 'Unknown Group',
                participants: groupAny.participants?.length || 0,
                isReadOnly: groupAny.isReadOnly || false,
                creation: groupAny.groupMetadata?.creation ? new Date(groupAny.groupMetadata.creation * 1000).toISOString() : null
            };
        });
        return {
            content: [{
                    type: 'text',
                    text: `Common groups / קבוצות משותפות:\nContact: ${contact.name || contact.pushname || args.contactId}\nGroups: ${commonGroups.length}\n\n${JSON.stringify(groupList, null, 2)}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to get common groups / שגיאה בקבלת קבוצות משותפות: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
// Search Contacts Tool
export const searchContactsTool = {
    name: 'whatsapp_search_contacts',
    description: 'Search for contacts by name or number / חפש אנשי קשר לפי שם או מספר',
    inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
            query: {
                type: 'string',
                description: 'Search query (name or number) / מונח חיפוש (שם או מספר)'
            },
            limit: {
                type: 'number',
                description: 'Maximum number of results (default: 20) / מספר מקסימלי של תוצאות',
                default: 20
            }
        }
    }
};
export async function searchContacts(args) {
    try {
        if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' }]
            };
        }
        const contacts = await whatsAppConnection.client.getContacts();
        const query = args.query.toLowerCase();
        const filteredContacts = contacts.filter((contact) => (contact.name && contact.name.toLowerCase().includes(query)) ||
            (contact.pushname && contact.pushname.toLowerCase().includes(query)) ||
            (contact.number && contact.number.includes(query))).slice(0, args.limit || 20);
        const contactList = filteredContacts.map((contact) => ({
            id: contact.id._serialized,
            name: contact.name,
            pushname: contact.pushname,
            number: contact.number,
            isMyContact: contact.isMyContact,
            isWAContact: contact.isWAContact
        }));
        return {
            content: [{
                    type: 'text',
                    text: `Found ${filteredContacts.length} contacts matching "${args.query}" / נמצאו ${filteredContacts.length} אנשי קשר התואמים "${args.query}":\n\n${JSON.stringify(contactList, null, 2)}`
                }]
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Failed to search contacts / שגיאה בחיפוש אנשי קשר: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
        };
    }
}
//# sourceMappingURL=contacts.js.map