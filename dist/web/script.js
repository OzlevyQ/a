// Global variables
let currentChat = null;
let chats = [];
let isConnected = false;
let loadChatsRetryCount = 0;
const MAX_LOAD_CHATS_RETRIES = 3; // Maximum automatic retries

// API base URL
const API_BASE = '/whatsapp';

// Utility function to safely get DOM elements
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Element with id '${id}' not found`);
    }
    return element;
}

// Utility function to safely set text content
function safeSetText(elementId, text) {
    const element = safeGetElement(elementId);
    if (element) {
        element.textContent = text;
    }
    return !!element;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('WhatsApp Web MCP Interface loading...');
    
    // Wait a moment for all elements to be ready
    setTimeout(() => {
        // Verify critical elements exist
        const statusText = document.getElementById('statusText');
        const connectionStatus = document.getElementById('connectionStatus');
        const chatList = document.getElementById('chatList');
        
        if (!statusText || !connectionStatus || !chatList) {
            console.error('❌ Critical DOM elements not found:', {
                statusText: !!statusText,
                connectionStatus: !!connectionStatus,
                chatList: !!chatList
            });
            return;
        }
        
        console.log('✅ All critical DOM elements found');
        
        // Check connection status
        checkConnectionStatus();
        
        // Set up periodic status checks
        setInterval(checkConnectionStatus, 5000);
        
        // Load chats if connected
        loadChats();
    }, 100); // Small delay to ensure DOM is fully ready
});

// Check WhatsApp connection status
async function checkConnectionStatus() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        const data = await response.json();
        
        updateConnectionStatus(data.connected, data.connectionData);
        
        if (data.connected && !isConnected) {
            // Just connected, load chats
            loadChats();
        }
        
        isConnected = data.connected;
        
    } catch (error) {
        console.error('Error checking connection status:', error);
        updateConnectionStatus(false, { error: error.message });
    }
}

// Update connection status UI
function updateConnectionStatus(connected, connectionData) {
    const statusElement = safeGetElement('connectionStatus');
    const statusIcon = safeGetElement('statusIcon');
    const statusText = safeGetElement('statusText');
    const modal = safeGetElement('connectionModal');
    
    // Add null checks to prevent errors
    if (!statusElement || !statusText) {
        console.warn('⚠️ Status elements not found in DOM');
        return;
    }
    
    if (connected) {
        statusElement.className = 'connection-status connected';
        statusText.textContent = 'מחובר / Connected';
        
        if (modal) {
            modal.classList.remove('show');
        }
        
        // Show user info if available
        if (connectionData?.clientInfo?.pushname) {
            statusText.textContent = `מחובר כ-${connectionData.clientInfo.pushname}`;
        }
        
        console.log('✅ Connection status updated: Connected');
    } else {
        statusElement.className = 'connection-status disconnected';
        statusText.textContent = 'לא מחובר / Disconnected';
        
        console.log('⚠️ Connection status updated: Disconnected');
        
        // Check if QR code is available
        checkQRCode();
    }
}

// Check for QR code
async function checkQRCode() {
    try {
        const response = await fetch(`${API_BASE}/qr`);
        const modal = document.getElementById('connectionModal');
        const qrContainer = document.getElementById('qrContainer');
        
        if (response.ok) {
            const data = await response.json();
            if (data.qrCode) {
                // Show QR code
                if (qrContainer) {
                    qrContainer.innerHTML = `<pre style="font-size: 8px; line-height: 1;">${data.qrCode}</pre>`;
                }
                
                if (modal) {
                    modal.classList.add('show');
                }
                
                // Update status to connecting
                const statusElement = document.getElementById('connectionStatus');
                const statusText = document.getElementById('statusText');
                
                if (statusElement && statusText) {
                    statusElement.className = 'connection-status connecting';
                    statusText.textContent = 'ממתין לסריקת QR / Waiting for QR scan';
                }
            }
        } else {
            // No QR code available
            if (modal) {
                modal.classList.remove('show');
            }
        }
    } catch (error) {
        console.error('Error checking QR code:', error);
    }
}

// Load chats
async function loadChats(isManualRefresh = false) {
    // Reset retry counter for manual refresh
    if (isManualRefresh) {
        loadChatsRetryCount = 0;
    }
    
    console.log(`🔄 Loading chats... (attempt ${loadChatsRetryCount + 1}/${MAX_LOAD_CHATS_RETRIES + 1})`);
    
    // Update status safely
    safeSetText('statusText', 'טוען צ\'אטים...');
    
    try {
        const response = await fetch('/whatsapp/get-chats');
        const result = await response.json();
        
        console.log('📥 Get chats response:', result);
        
        if (result.success && result.data && result.data.chats) {
            const chats = result.data.chats;
            console.log(`📋 Loaded ${chats.length} chats`);
            
            if (chats.length === 0) {
                displayChats(chats);
                
                if (loadChatsRetryCount < MAX_LOAD_CHATS_RETRIES) {
                    console.log(`⚠️ No chats loaded, will try again in 5 seconds (${loadChatsRetryCount + 1}/${MAX_LOAD_CHATS_RETRIES})`);
                    safeSetText('statusText', `מחובר - ממתין לצ\'אטים... (${loadChatsRetryCount + 1}/${MAX_LOAD_CHATS_RETRIES})`);
                    
                    loadChatsRetryCount++;
                    
                    // Auto-retry after 5 seconds if under retry limit
                    setTimeout(() => {
                        console.log('🔄 Auto-retrying to load chats...');
                        loadChats();
                    }, 5000);
                } else {
                    console.log('⚠️ Maximum retry attempts reached. Auto-refresh stopped.');
                    safeSetText('statusText', 'מחובר - לא נמצאו צ\'אטים (לחץ רענון לנסות שוב)');
                    
                    // Show manual refresh button in chat list
                    const chatList = document.getElementById('chatList');
                    if (chatList) {
                        chatList.innerHTML = `
                            <div class="loading">
                                <div style="text-align: center; padding: 20px;">
                                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f39c12; margin-bottom: 15px;"></i>
                                    <h3 style="color: #666; margin-bottom: 10px;">לא ניתן לטעון צ\'אטים</h3>
                                    <p style="color: #888; margin-bottom: 15px;">נסיתי ${MAX_LOAD_CHATS_RETRIES + 1} פעמים ללא הצלחה</p>
                                    <button onclick="loadChats(true)" style="
                                        padding: 10px 20px; 
                                        background: #25D366; 
                                        color: white; 
                                        border: none; 
                                        border-radius: 25px; 
                                        cursor: pointer;
                                        font-size: 14px;
                                        transition: background 0.2s;
                                        margin: 5px;
                                    " onmouseover="this.style.background='#128C7E'" onmouseout="this.style.background='#25D366'">
                                        <i class="fas fa-sync-alt"></i> נסה שוב
                                    </button>
                                    <button onclick="checkConnectionStatus()" style="
                                        padding: 10px 20px; 
                                        background: #34495e; 
                                        color: white; 
                                        border: none; 
                                        border-radius: 25px; 
                                        cursor: pointer;
                                        font-size: 14px;
                                        transition: background 0.2s;
                                        margin: 5px;
                                    " onmouseover="this.style.background='#2c3e50'" onmouseout="this.style.background='#34495e'">
                                        <i class="fas fa-wifi"></i> בדוק חיבור
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                }
            } else {
                // Success - reset retry counter
                loadChatsRetryCount = 0;
                displayChats(chats);
                safeSetText('statusText', `מחובר - ${chats.length} צ\'אטים`);
            }
        } else {
            console.warn('⚠️ No chats in response or unsuccessful');
            displayChats([]);
            
            if (loadChatsRetryCount < MAX_LOAD_CHATS_RETRIES) {
                safeSetText('statusText', `מחובר - בעיה בטעינת צ\'אטים (${loadChatsRetryCount + 1}/${MAX_LOAD_CHATS_RETRIES})`);
                loadChatsRetryCount++;
                
                // Auto-retry after 10 seconds on error
                setTimeout(() => {
                    console.log('🔄 Auto-retrying after error...');
                    loadChats();
                }, 10000);
            } else {
                safeSetText('statusText', 'מחובר - בעיה קבועה בטעינת צ\'אטים');
            }
        }
    } catch (error) {
        console.error('❌ Error loading chats:', error);
        displayChats([]);
        
        if (loadChatsRetryCount < MAX_LOAD_CHATS_RETRIES) {
            safeSetText('statusText', `שגיאה בטעינת צ\'אטים (${loadChatsRetryCount + 1}/${MAX_LOAD_CHATS_RETRIES})`);
            loadChatsRetryCount++;
            
            // Auto-retry after 15 seconds on error
            setTimeout(() => {
                console.log('🔄 Auto-retrying after error...');
                loadChats();
            }, 15000);
        } else {
            safeSetText('statusText', 'שגיאה קבועה בטעינת צ\'אטים');
        }
    }
}

// Display chats in sidebar
function displayChats(chats) {
    const chatList = document.getElementById('chatList');
    
    if (!chats || chats.length === 0) {
        chatList.innerHTML = `
            <div class="loading">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-comments" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                    <h3 style="color: #666; margin-bottom: 10px;">אין צ\'אטים זמינים</h3>
                    <p style="color: #888; margin-bottom: 15px;">ייתכן שהצ\'אטים עדיין נטענים</p>
                    <button onclick="loadChats(true)" style="
                        padding: 10px 20px; 
                        background: #25D366; 
                        color: white; 
                        border: none; 
                        border-radius: 25px; 
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#128C7E'" onmouseout="this.style.background='#25D366'">
                        <i class="fas fa-sync-alt"></i> רענן צ\'אטים
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const chatItems = chats.map(chat => {
        const name = chat.name || 'ללא שם';
        const lastMessage = chat.lastMessage?.body || 'אין הודעות';
        const isGroup = chat.isGroup || false;
        const avatar = name.charAt(0).toUpperCase();
        const unreadCount = chat.unreadCount || 0;
        
        return `
            <div class="chat-item" onclick="selectChat('${chat.id._serialized}', '${name.replace(/'/g, "\\'")}', ${isGroup})" data-chat-id="${chat.id._serialized}">
                <div class="chat-avatar">${avatar}</div>
                <div class="chat-info" style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4>${name} ${isGroup ? '(קבוצה)' : ''}</h4>
                        ${unreadCount > 0 ? `<span style="background: #25D366; color: white; border-radius: 12px; padding: 2px 8px; font-size: 12px; min-width: 20px; text-align: center;">${unreadCount}</span>` : ''}
                    </div>
                    <p style="margin-top: 5px; color: #888; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lastMessage}</p>
                    ${chat.timestamp ? `<small style="color: #aaa; font-size: 0.8rem;">${new Date(chat.timestamp).toLocaleDateString('he-IL')}</small>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    chatList.innerHTML = chatItems;
    
    console.log(`✅ Displayed ${chats.length} chats in the sidebar`);
}

// Select a chat
async function selectChat(chatId, chatName, isGroup) {
    console.log(`🎯 Selecting chat: ${chatName} (ID: ${chatId})`);
    
    currentChat = { id: chatId, name: chatName, isGroup };
    
    // Update UI - highlight selected chat
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedChatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (selectedChatElement) {
        selectedChatElement.classList.add('active');
    }
    
    // Update chat header
    const chatHeader = document.getElementById('chatHeader');
    if (chatHeader) {
        chatHeader.innerHTML = `
            <div class="chat-info">
                <div class="chat-avatar-header">${chatName.charAt(0).toUpperCase()}</div>
                <div style="flex: 1;">
                    <h3>${chatName}</h3>
                    <p style="color: #888;">${isGroup ? 'קבוצה' : 'צ\'אט אישי'}</p>
                </div>
                <div class="chat-actions">
                    <button onclick="loadMessages('${chatId}')" title="רענן הודעות">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Show message input
    const messageInputContainer = document.getElementById('messageInputContainer');
    if (messageInputContainer) {
        messageInputContainer.style.display = 'block';
    }
    
    // For DOM-based chat IDs, we need to click the actual chat element
    if (chatId.startsWith('clickable_')) {
        console.log('🖱️ Attempting to click on WhatsApp chat element...');
        try {
            await clickWhatsAppChat(chatId, chatName);
        } catch (error) {
            console.error('Error clicking chat:', error);
        }
    }
    
    // Try to load messages
    await loadMessages(chatId);
}

// Function to click on WhatsApp chat element directly
async function clickWhatsAppChat(chatId, chatName) {
    try {
        const response = await fetch('/whatsapp/click-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: chatId,
                chatName: chatName
            })
        });
        
        if (response.ok) {
            console.log('✅ Successfully clicked on WhatsApp chat');
            // Wait a moment for the chat to load
            setTimeout(() => {
                loadMessages(chatId);
            }, 1000);
        } else {
            console.warn('⚠️ Failed to click on WhatsApp chat');
        }
    } catch (error) {
        console.error('❌ Error clicking WhatsApp chat:', error);
    }
}

// Load messages for a chat
async function loadMessages(chatId) {
    console.log(`📨 Loading messages for chat: ${chatId}`);
    
    try {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="loading">טוען הודעות...</div>';
        }
        
        // Try to get messages from API
        const response = await fetch(`/whatsapp/get-messages?chatId=${encodeURIComponent(chatId)}`);
        
        if (!response.ok) {
            console.warn(`⚠️ Messages API returned ${response.status}, showing placeholder`);
            showPlaceholderMessages(chatId);
            return;
        }
        
        const result = await response.json();
        console.log('📥 Messages response:', result);
        
        // Parse messages from API response
        let messages = [];
        if (result.messages) {
            messages = result.messages;
        } else if (result.message && typeof result.message === 'string') {
            try {
                const jsonMatch = result.message.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[1]);
                    messages = parsed.messages || [];
                }
            } catch (e) {
                console.error('Error parsing messages:', e);
            }
        }
        
        if (messages.length > 0) {
            displayMessages(messages);
        } else {
            showPlaceholderMessages(chatId);
        }
        
    } catch (error) {
        console.error('❌ Error loading messages:', error);
        showPlaceholderMessages(chatId);
    }
}

// Show placeholder when messages can't be loaded
function showPlaceholderMessages(chatId) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-comment-dots"></i>
                <h3>צ'אט נבחר: ${currentChat?.name || 'Unknown'}</h3>
                <p>הודעות יוצגו כאן כאשר הן יטענו</p>
                <p style="color: #888; font-size: 0.9rem;">ID: ${chatId}</p>
                <div style="margin-top: 20px;">
                    <button onclick="loadMessages('${chatId}')" style="
                        padding: 8px 16px; 
                        background: #25D366; 
                        color: white; 
                        border: none; 
                        border-radius: 20px; 
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        <i class="fas fa-sync-alt"></i> נסה לטעון הודעות
                    </button>
                </div>
            </div>
        `;
    }
}

// Display messages
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-comment-dots"></i>
                <h3>אין הודעות בצ\'אט</h3>
                <p>התחל לשוחח על ידי שליחת הודעה</p>
            </div>
        `;
        return;
    }
    
    const messageElements = messages.map(message => {
        const isFromMe = message.fromMe || false;
        const messageClass = isFromMe ? 'sent' : 'received';
        const time = new Date(message.timestamp * 1000).toLocaleTimeString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `
            <div class="message ${messageClass}">
                <div class="message-bubble">
                    ${message.body}
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
    
    messagesContainer.innerHTML = messageElements;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
async function sendMessage() {
    if (!currentChat || !isConnected) return;
    
    const messageInput = document.getElementById('messageText');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
        // Disable input
        messageInput.disabled = true;
        document.querySelector('.send-btn').disabled = true;
        
        const response = await fetch(`${API_BASE}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: currentChat.id,
                message: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        // Clear input
        messageInput.value = '';
        
        // Add message to UI immediately
        addMessageToUI(message, true);
        
        // Reload messages after a short delay
        setTimeout(() => {
            loadMessages(currentChat.id);
        }, 1000);
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('שגיאה בשליחת ההודעה: ' + error.message);
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        document.querySelector('.send-btn').disabled = false;
        messageInput.focus();
    }
}

// Add message to UI
function addMessageToUI(message, isFromMe) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageClass = isFromMe ? 'sent' : 'received';
    const time = new Date().toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const messageElement = `
        <div class="message ${messageClass}">
            <div class="message-bubble">
                ${message}
                <div class="message-time">${time}</div>
            </div>
        </div>
    `;
    
    // Check if welcome message is shown
    if (messagesContainer.querySelector('.welcome-message')) {
        messagesContainer.innerHTML = '';
    }
    
    messagesContainer.insertAdjacentHTML('beforeend', messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Utility functions
function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Export functions for debugging
if (typeof window !== 'undefined') {
    window.whatsappDebug = {
        loadChats,
        checkConnectionStatus,
        sendMessage,
        currentChat,
        chats,
        isConnected
    };
} 