export type Client = any;
export type Message = any;
export type Chat = any;
export type Contact = any;
export type GroupChat = any;
export type PrivateChat = any;
export type MessageMedia = any;
export type Location = any;
export type Poll = any;
export type Label = any;
export type Call = any;
export type Product = any;
export type Order = any;
export interface WhatsAppConnectionData {
    isAuthenticated: boolean;
    isReady: boolean;
    clientInfo?: any;
    connectedAt?: Date;
    sessionPath: string;
}
export interface MessageArgs {
    chatId: string;
    message: string;
    options?: {
        mentions?: string[];
        quotedMessageId?: string;
        linkPreview?: boolean;
    };
}
export interface MediaMessageArgs {
    chatId: string;
    media: string;
    caption?: string;
    options?: {
        mentions?: string[];
        quotedMessageId?: string;
    };
}
export interface ChatActionArgs {
    chatId: string;
    action?: 'archive' | 'unarchive' | 'pin' | 'unpin' | 'mute' | 'unmute' | 'markAsRead' | 'markAsUnread';
    duration?: number;
}
export interface ContactArgs {
    contactId: string;
    name?: string;
    organization?: string;
}
export interface GroupArgs {
    name: string;
    participants: string[];
    options?: {
        description?: string;
        profilePicture?: string;
    };
}
export interface GroupActionArgs {
    groupId: string;
    action: 'addParticipants' | 'removeParticipants' | 'promoteParticipants' | 'demoteParticipants' | 'setDescription' | 'setSubject' | 'setProfilePicture' | 'leave';
    participants?: string[];
    description?: string;
    subject?: string;
    profilePicture?: string;
}
export interface BusinessArgs {
    businessId?: string;
    catalogId?: string;
    productId?: string;
}
export interface LabelArgs {
    labelId?: string;
    name?: string;
    color?: string;
    chatIds?: string[];
}
export interface CallArgs {
    contactId: string;
    isVideo?: boolean;
}
export interface StatusArgs {
    status: string;
    options?: {
        mentions?: string[];
        backgroundColor?: string;
        font?: number;
    };
}
export interface PollArgs {
    chatId: string;
    question: string;
    options: string[];
    allowMultipleAnswers?: boolean;
}
export interface SearchArgs {
    query: string;
    chatId?: string;
    limit?: number;
    page?: number;
}
export interface McpWhatsAppServer {
    client: Client | null;
    connectionData: WhatsAppConnectionData;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    saveConnectionData(): Promise<void>;
    loadConnectionData(): Promise<void>;
}
export interface WhatsAppResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}
export interface ToolResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}
//# sourceMappingURL=types.d.ts.map