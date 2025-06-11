import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { whatsAppConnection } from '../connection.js';
import { ChatActionArgs, ToolResult } from '../types.js';

// Helper function to check WhatsApp connection
async function checkWhatsAppConnection(): Promise<{ isConnected: boolean; error?: string }> {
  try {
    if (!whatsAppConnection.isConnected() || !whatsAppConnection.client) {
      return { 
        isConnected: false, 
        error: 'WhatsApp client is not connected / לקוח ווטסאפ אינו מחובר' 
      };
    }

    // Additional check to ensure client is actually ready
    const clientState = await whatsAppConnection.client.getState();
    if (clientState !== 'CONNECTED') {
      return { 
        isConnected: false, 
        error: `WhatsApp client state: ${clientState}. Please wait for connection to be ready. / מצב לקוח ווטסאפ: ${clientState}. אנא המתן עד שהחיבור יהיה מוכן.` 
      };
    }

    return { isConnected: true };
  } catch (error) {
    return { 
      isConnected: false, 
      error: `Connection check failed / בדיקת חיבור נכשלה: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Get All Chats Tool
export const getChatsTool: Tool = {
  name: 'whatsapp_get_chats',
  description: 'Get all WhatsApp chats / קבל את כל הצ\'אטים של ווטסאפ',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of chats to retrieve (default: 50) / מספר מקסימלי של צ\'אטים לקבלה',
        default: 50
      },
      type: {
        type: 'string',
        enum: ['all', 'private', 'group'],
        description: 'Type of chats to retrieve / סוג הצ\'אטים לקבלה',
        default: 'all'
      }
    }
  }
};

export async function getChats(args: { limit?: number; type?: 'all' | 'private' | 'group' }): Promise<ToolResult> {
  try {
    const connectionCheck = await checkWhatsAppConnection();
    if (!connectionCheck.isConnected) {
      return {
        isError: true,
        content: [{ type: 'text', text: connectionCheck.error }]
      };
    }

    console.error('🔄 Attempting to get chats using direct DOM access...');
    
    let allChats = [];
    let retryCount = 0;
    const maxRetries = 2; // Reduced retries for faster response
    
    while (retryCount < maxRetries) {
      try {
        const delay = 1000 + (retryCount * 1000);
        console.error(`⏳ Waiting ${delay}ms before attempt ${retryCount + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.error('📞 Using direct DOM chat extraction...');
        
        // Use direct DOM access to get chat data from WhatsApp Web
        allChats = await whatsAppConnection.client.pupPage.evaluate(() => {
          try {
            // Updated selectors for current WhatsApp Web structure
            const chatElements = document.querySelectorAll('[data-testid="conversation-panel-messages"] div[role="listitem"], [data-testid="chat-list"] div[role="listitem"], #pane-side div[role="listitem"]');
            console.log(`Found ${chatElements.length} chat elements in DOM`);
            
            if (chatElements.length === 0) {
              // Try more generic selectors
              const altChatElements = document.querySelectorAll('#pane-side div._8nE1Y, #pane-side div[aria-label], div[id*="chat-"]');
              console.log(`Found ${altChatElements.length} alternative chat elements`);
              
              if (altChatElements.length === 0) {
                console.log('No chat elements found in DOM. Trying to wait for elements...');
                
                // Try waiting a bit and looking for any clickable chat items
                const anyChatElements = document.querySelectorAll('div[data-tab="3"] div, #pane-side > div > div > div > div');
                console.log(`Found ${anyChatElements.length} generic chat containers`);
                
                if (anyChatElements.length === 0) {
                  return [];
                }
              }
            }
            
            const chats = [];
            const elements = chatElements.length > 0 ? chatElements : 
                           document.querySelectorAll('#pane-side div[role="listitem"], #pane-side div[aria-label]');
            
            console.log(`Processing ${elements.length} elements for chat data`);
            
            for (let i = 0; i < Math.min(elements.length, 50); i++) {
              const element = elements[i];
              if (!element) continue;
              
              try {
                // Enhanced chat name extraction with more specific selectors
                let chatName = 'Unknown Chat';
                const nameSelectors = [
                  'span[title]:not([title=""])',  // Title attribute
                  'span[dir="auto"]:first-child', // Name in RTL/LTR context
                  '.copyable-text span[dir="auto"]', // Copyable text name
                  'span[data-testid="conversation-title"]', // Test ID for title
                  'div[data-testid] span:first-child', // First span in test div
                  'span.ggj6brxn.gfz4du6o.r7fjleex.g0rxnol2.lhj4utae.le5p0ye3.l7jjieqr.i0jNr', // WhatsApp specific classes
                  'span._11JPr'  // Alternative class
                ];
                
                for (const selector of nameSelectors) {
                  const nameElement = element.querySelector(selector);
                  if (nameElement && nameElement.textContent && nameElement.textContent.trim()) {
                    chatName = nameElement.textContent.trim();
                    if (chatName !== 'Unknown Chat' && chatName.length > 0) {
                      break;
                    }
                  }
                }
                
                // Enhanced last message extraction
                let lastMessage = '';
                const messageSelectors = [
                  'span[dir="ltr"]:last-child', // Last LTR message
                  'span[title]:not([title=""])', // Message with title
                  '.x1iyjqo2 span:last-child', // Last span in message container
                  'div[data-testid] span:last-child', // Last span in test div
                  'span.gfz4du6o.r7fjleex.lhj4utae.le5p0ye3.l7jjieqr._11JPr', // Message class
                  'span:contains(":")' // Messages often contain colons
                ];
                
                for (const selector of messageSelectors) {
                  const messageElements = element.querySelectorAll(selector);
                  for (let j = messageElements.length - 1; j >= 0; j--) {
                    const msgText = messageElements[j].textContent?.trim();
                    if (msgText && msgText.length > 0 && msgText !== chatName) {
                      lastMessage = msgText;
                      break;
                    }
                  }
                  if (lastMessage) break;
                }
                
                // Enhanced group detection
                const isGroup = chatName.includes('(') || 
                              element.querySelector('span[data-testid="default-group"]') !== null ||
                              element.querySelector('[data-icon="group"]') !== null ||
                              chatName.toLowerCase().includes('group') ||
                              chatName.includes('קבוצ');
                
                // Enhanced chat ID extraction - try to get the actual chat ID from attributes
                let chatId = `dom_chat_${i}_${chatName.replace(/[^a-zA-Z0-9]/g, '_')}@c.us`;
                
                // Try to find real chat ID from data attributes
                const dataAttributes = element.attributes;
                for (let attr of dataAttributes) {
                  if (attr.name.includes('chat') || attr.name.includes('id')) {
                    if (attr.value && attr.value.includes('@')) {
                      chatId = attr.value;
                      break;
                    }
                  }
                }
                
                // Alternative: try to extract from click handlers or data
                const clickableElement = element.querySelector('[role="button"], [tabindex], div[data-tab]');
                if (clickableElement) {
                  // Store the element index for clicking later
                  chatId = `clickable_${i}_${chatName.replace(/[^a-zA-Z0-9]/g, '_')}`;
                }
                
                // Enhanced unread count extraction
                let unreadCount = 0;
                const unreadSelectors = [
                  'span[data-testid="unread-count"]',
                  'div[aria-label*="לא נקרא"]',
                  'div[aria-label*="unread"]',
                  'span.x1c4vz4f.x2lah0s',
                  'div._1pJ9J._2XR5j', // Unread indicator classes
                  'span[aria-label]:not([aria-label=""])'
                ];
                
                for (const selector of unreadSelectors) {
                  const unreadElement = element.querySelector(selector);
                  if (unreadElement) {
                    const unreadText = unreadElement.textContent || unreadElement.getAttribute('aria-label') || '0';
                    const parsed = parseInt(unreadText.replace(/\D/g, '')) || 0;
                    if (parsed > 0) {
                      unreadCount = parsed;
                      break;
                    }
                  }
                }
                
                // Only add chats that have actual names (not "Unknown Chat")
                if (chatName && chatName !== 'Unknown Chat' && chatName.trim().length > 0) {
                  const chat = {
                    id: { _serialized: chatId },
                    name: chatName,
                    isGroup: isGroup,
                    isReadOnly: false,
                    unreadCount: unreadCount,
                    timestamp: new Date().toISOString(),
                    archived: false,
                    pinned: false,
                    muteExpiration: null,
                    lastMessage: lastMessage ? {
                      body: lastMessage.substring(0, 100),
                      timestamp: new Date().toISOString(),
                      fromMe: false
                    } : null,
                    elementIndex: i // Store for clicking
                  };
                  
                  chats.push(chat);
                  console.log(`Extracted chat: ${chatName} (${isGroup ? 'group' : 'private'}) - ${lastMessage.substring(0, 30)}...`);
                }
                
              } catch (chatError) {
                console.error(`Error processing chat element ${i}:`, chatError);
                continue;
              }
            }
            
            console.log(`Successfully extracted ${chats.length} chats from DOM`);
            return chats;
            
          } catch (error) {
            console.error('Error in DOM extraction:', error);
            return [];
          }
        });
        
        console.error(`📋 DOM extraction returned ${allChats?.length || 0} chats`);
        
        if (Array.isArray(allChats) && allChats.length >= 0) {
          console.error('✅ Successfully extracted chats from DOM');
          break;
        } else {
          throw new Error('Invalid response from DOM extraction');
        }
        
      } catch (error) {
        retryCount++;
        console.error(`❌ Attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          console.error('⚠️ All DOM extraction attempts failed, returning empty chat list');
          allChats = [];
          break;
        }
        
        console.error(`🔄 Retrying... (${retryCount}/${maxRetries})`);
      }
    }
    
    if (!Array.isArray(allChats)) {
      allChats = [];
    }

    if (allChats.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No chats found or still loading. This might be normal if WhatsApp Web is still loading. / לא נמצאו צ\'אטים או עדיין טוען. ייתכן שזה נורמלי אם ווטסאפ ווב עדיין נטען.\n\n```json\n{"chats": [], "note": "Try refreshing in a few seconds"}\n```'
        }]
      };
    }
    
    console.error(`🔍 Processing ${allChats.length} chats...`);
    
    // Apply type filter
    let filteredChats = allChats;
    if (args.type === 'private') {
      filteredChats = allChats.filter(chat => !chat.isGroup);
    } else if (args.type === 'group') {
      filteredChats = allChats.filter(chat => chat.isGroup);
    }
    
    // Apply limit
    const limitedChats = filteredChats.slice(0, args.limit || 50);
    
    console.error(`📤 Returning ${limitedChats.length} processed chats`);

    return {
      content: [{
        type: 'text',
        text: `Found ${limitedChats.length} chats / נמצאו ${limitedChats.length} צ\'אטים:\n\n\`\`\`json\n{"chats": ${JSON.stringify(limitedChats, null, 2)}}\n\`\`\``
      }]
    };
    
  } catch (error) {
    console.error('❌ Full error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      content: [{
        type: 'text',
        text: `Could not load chats at this time / לא ניתן לטעון צ\'אטים כרגע: ${errorMessage}\n\nThis might be because:\n1. WhatsApp Web is still loading\n2. DOM structure has changed\n3. Connection needs more time\n\nייתכן שהסיבה היא:\n1. ווטסאפ ווב עדיין נטען\n2. מבנה ה-DOM השתנה\n3. החיבור זקוק לעוד זמן\n\n\`\`\`json\n{"chats": [], "error": "${errorMessage}", "retry": true}\n\`\`\``
      }]
    };
  }
}

// Get Chat Info Tool
export const getChatInfoTool: Tool = {
  name: 'whatsapp_get_chat_info',
  description: 'Get detailed information about a specific chat / קבל מידע מפורט על צ\'אט ספציפי',
  inputSchema: {
    type: 'object',
    required: ['chatId'],
    properties: {
      chatId: {
        type: 'string',
        description: 'Chat ID to get information about / מזהה צ\'אט לקבלת מידע'
      }
    }
  }
};

export async function getChatInfo(args: { chatId: string }): Promise<ToolResult> {
  try {
    const connectionCheck = await checkWhatsAppConnection();
    if (!connectionCheck.isConnected) {
      return {
        isError: true,
        content: [{ type: 'text', text: connectionCheck.error }]
      };
    }

    const chat = await whatsAppConnection.client.getChatById(args.chatId);
    
    if (!chat || !chat.id || !chat.id._serialized) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Chat not found or invalid chat ID / צ\'אט לא נמצא או מזהה צ\'אט לא תקין: ${args.chatId}`
        }]
      };
    }
    
    let chatInfo: any = {
      id: chat.id._serialized,
      name: chat.name || 'Unknown',
      isGroup: Boolean(chat.isGroup),
      isReadOnly: Boolean(chat.isReadOnly),
      unreadCount: Number(chat.unreadCount) || 0,
      timestamp: chat.timestamp ? new Date(chat.timestamp * 1000).toISOString() : null,
      archived: Boolean(chat.archived),
      pinned: Boolean(chat.pinned),
      muteExpiration: chat.muteExpiration ? new Date(chat.muteExpiration * 1000).toISOString() : null
    };

    // For group chats, try to get additional info
    if (chat.isGroup) {
      try {
        // Get group metadata separately if available
        const groupChat = chat as any;
        if (groupChat.groupMetadata) {
          chatInfo.groupMetadata = {
            creation: groupChat.groupMetadata.creation ? new Date(groupChat.groupMetadata.creation * 1000).toISOString() : null,
            owner: groupChat.groupMetadata.owner || null,
            desc: groupChat.groupMetadata.desc || null,
            descOwner: groupChat.groupMetadata.descOwner || null,
            descId: groupChat.groupMetadata.descId || null,
            restrict: groupChat.groupMetadata.restrict || false,
            announce: groupChat.groupMetadata.announce || false
          };
        }
        
        // Add participant count if available
        if (groupChat.participants) {
          chatInfo.participantCount = groupChat.participants.length;
        }
      } catch (e) {
        // Group metadata might not be available
        console.error('Group metadata not available:', e);
      }
    }

    return {
      content: [{
        type: 'text',
        text: `Chat information / מידע צ\'אט:\n\n${JSON.stringify(chatInfo, null, 2)}`
      }]
    };
  } catch (error) {
    console.error('❌ Full error details for getChatInfo:', error);
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Failed to get chat info / שגיאה בקבלת מידע צ\'אט: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check that the chat ID is valid and try again.\nאנא בדוק שמזהה הצ\'אט תקין ונסה שוב.`
      }]
    };
  }
}

// Archive Chat Tool
export const archiveChatTool: Tool = {
  name: 'whatsapp_archive_chat',
  description: 'Archive or unarchive a chat / ארכב או בטל ארכוב של צ\'אט',
  inputSchema: {
    type: 'object',
    required: ['chatId'],
    properties: {
      chatId: {
        type: 'string',
        description: 'Chat ID to archive/unarchive / מזהה צ\'אט לארכוב/ביטול ארכוב'
      },
      archive: {
        type: 'boolean',
        description: 'True to archive, false to unarchive / אמת לארכוב, שקר לביטול ארכוב',
        default: true
      }
    }
  }
};

export async function archiveChat(args: { chatId: string; archive?: boolean }): Promise<ToolResult> {
  try {
    const connectionCheck = await checkWhatsAppConnection();
    if (!connectionCheck.isConnected) {
      return {
        isError: true,
        content: [{ type: 'text', text: connectionCheck.error }]
      };
    }

    const chat = await whatsAppConnection.client.getChatById(args.chatId);
    const shouldArchive = args.archive !== false;
    
    // Fix: archive() method doesn't take parameters in WhatsApp Web.js
    if (shouldArchive) {
      await chat.archive();
    } else {
      await chat.unarchive();
    }
    
    return {
      content: [{
        type: 'text',
        text: `Chat ${shouldArchive ? 'archived' : 'unarchived'} successfully! / צ\'אט ${shouldArchive ? 'אורכב' : 'בוטל ארכובו'} בהצלחה!\nChat: ${chat.name || args.chatId}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Failed to archive chat / שגיאה בארכוב צ\'אט: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Pin Chat Tool
export const pinChatTool: Tool = {
  name: 'whatsapp_pin_chat',
  description: 'Pin or unpin a chat / נעץ או בטל נעיצה של צ\'אט',
  inputSchema: {
    type: 'object',
    required: ['chatId'],
    properties: {
      chatId: {
        type: 'string',
        description: 'Chat ID to pin/unpin / מזהה צ\'אט לנעיצה/ביטול נעיצה'
      },
      pin: {
        type: 'boolean',
        description: 'True to pin, false to unpin / אמת לנעיצה, שקר לביטול נעיצה',
        default: true
      }
    }
  }
};

export async function pinChat(args: { chatId: string; pin?: boolean }): Promise<ToolResult> {
  try {
    const connectionCheck = await checkWhatsAppConnection();
    if (!connectionCheck.isConnected) {
      return {
        isError: true,
        content: [{ type: 'text', text: connectionCheck.error }]
      };
    }

    const chat = await whatsAppConnection.client.getChatById(args.chatId);
    const shouldPin = args.pin !== false;
    
    // Fix: pin() method doesn't take parameters in WhatsApp Web.js
    if (shouldPin) {
      await chat.pin();
    } else {
      await chat.unpin();
    }
    
    return {
      content: [{
        type: 'text',
        text: `Chat ${shouldPin ? 'pinned' : 'unpinned'} successfully! / צ\'אט ${shouldPin ? 'ננעץ' : 'בוטלה נעיצתו'} בהצלחה!\nChat: ${chat.name || args.chatId}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Failed to pin chat / שגיאה בנעיצת צ\'אט: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Mute Chat Tool
export const muteChatTool: Tool = {
  name: 'whatsapp_mute_chat',
  description: 'Mute or unmute a chat / השתק או בטל השתקה של צ\'אט',
  inputSchema: {
    type: 'object',
    required: ['chatId'],
    properties: {
      chatId: {
        type: 'string',
        description: 'Chat ID to mute/unmute / מזהה צ\'אט להשתקה/ביטול השתקה'
      },
      mute: {
        type: 'boolean',
        description: 'True to mute, false to unmute / אמת להשתקה, שקר לביטול השתקה',
        default: true
      },
      duration: {
        type: 'number',
        description: 'Mute duration in seconds (default: 8 hours = 28800) / משך השתקה בשניות',
        default: 28800
      }
    }
  }
};

export async function muteChat(args: { chatId: string; mute?: boolean; duration?: number }): Promise<ToolResult> {
  try {
    const connectionCheck = await checkWhatsAppConnection();
    if (!connectionCheck.isConnected) {
      return {
        isError: true,
        content: [{ type: 'text', text: connectionCheck.error }]
      };
    }

    const chat = await whatsAppConnection.client.getChatById(args.chatId);
    const shouldMute = args.mute !== false;
    
    if (shouldMute) {
      const duration = args.duration || 28800; // 8 hours default
      const until = new Date(Date.now() + duration * 1000);
      await chat.mute(until);
    } else {
      await chat.unmute();
    }
    
    return {
      content: [{
        type: 'text',
        text: `Chat ${shouldMute ? 'muted' : 'unmuted'} successfully! / צ\'אט ${shouldMute ? 'הושתק' : 'בוטלה השתקתו'} בהצלחה!\nChat: ${chat.name || args.chatId}${shouldMute ? `\nDuration: ${args.duration || 28800} seconds` : ''}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Failed to mute chat / שגיאה בהשתקת צ\'אט: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Mark as Read Tool
export const markAsReadTool: Tool = {
  name: 'whatsapp_mark_as_read',
  description: 'Mark chat as read or unread / סמן צ\'אט כנקרא או לא נקרא',
  inputSchema: {
    type: 'object',
    required: ['chatId'],
    properties: {
      chatId: {
        type: 'string',
        description: 'Chat ID to mark as read/unread / מזהה צ\'אט לסימון כנקרא/לא נקרא'
      },
      read: {
        type: 'boolean',
        description: 'True to mark as read, false to mark as unread / אמת לסימון כנקרא, שקר לסימון כלא נקרא',
        default: true
      }
    }
  }
};

export async function markAsRead(args: { chatId: string; read?: boolean }): Promise<ToolResult> {
  try {
    const connectionCheck = await checkWhatsAppConnection();
    if (!connectionCheck.isConnected) {
      return {
        isError: true,
        content: [{ type: 'text', text: connectionCheck.error }]
      };
    }

    const chat = await whatsAppConnection.client.getChatById(args.chatId);
    const shouldMarkRead = args.read !== false;
    
    if (shouldMarkRead) {
      // Use sendSeen() to mark as read
      await chat.sendSeen();
    } else {
      // Use markUnread() to mark as unread
      await chat.markUnread();
    }
    
    return {
      content: [{
        type: 'text',
        text: `Chat marked as ${shouldMarkRead ? 'read' : 'unread'} successfully! / צ\'אט סומן כ${shouldMarkRead ? 'נקרא' : 'לא נקרא'} בהצלחה!\nChat: ${chat.name || args.chatId}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Failed to mark chat / שגיאה בסימון צ\'אט: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Clear Messages Tool
export const clearMessagesTool: Tool = {
  name: 'whatsapp_clear_messages',
  description: 'Clear all messages in a chat / נקה את כל ההודעות בצ\'אט',
  inputSchema: {
    type: 'object',
    required: ['chatId'],
    properties: {
      chatId: {
        type: 'string',
        description: 'Chat ID to clear messages from / מזהה צ\'אט לניקוי הודעות'
      }
    }
  }
};

export async function clearMessages(args: { chatId: string }): Promise<ToolResult> {
  try {
    const connectionCheck = await checkWhatsAppConnection();
    if (!connectionCheck.isConnected) {
      return {
        isError: true,
        content: [{ type: 'text', text: connectionCheck.error }]
      };
    }

    const chat = await whatsAppConnection.client.getChatById(args.chatId);
    await chat.clearMessages();
    
    return {
      content: [{
        type: 'text',
        text: `Chat messages cleared successfully! / הודעות הצ\'אט נוקו בהצלחה!\nChat: ${chat.name || args.chatId}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Failed to clear messages / שגיאה בניקוי הודעות: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Delete Chat Tool
export const deleteChatTool: Tool = {
  name: 'whatsapp_delete_chat',
  description: 'Delete a chat / מחק צ\'אט',
  inputSchema: {
    type: 'object',
    required: ['chatId'],
    properties: {
      chatId: {
        type: 'string',
        description: 'Chat ID to delete / מזהה צ\'אט למחיקה'
      }
    }
  }
};

export async function deleteChat(args: { chatId: string }): Promise<ToolResult> {
  try {
    const connectionCheck = await checkWhatsAppConnection();
    if (!connectionCheck.isConnected) {
      return {
        isError: true,
        content: [{ type: 'text', text: connectionCheck.error }]
      };
    }

    const chat = await whatsAppConnection.client.getChatById(args.chatId);
    await chat.delete();
    
    return {
      content: [{
        type: 'text',
        text: `Chat deleted successfully! / צ\'אט נמחק בהצלחה!\nChat: ${chat.name || args.chatId}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Failed to delete chat / שגיאה במחיקת צ\'אט: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
} 