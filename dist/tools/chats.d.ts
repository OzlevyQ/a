import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolResult } from '../types.js';
export declare const getChatsTool: Tool;
export declare function getChats(args: {
    limit?: number;
    type?: 'all' | 'private' | 'group';
}): Promise<ToolResult>;
export declare const getChatInfoTool: Tool;
export declare function getChatInfo(args: {
    chatId: string;
}): Promise<ToolResult>;
export declare const archiveChatTool: Tool;
export declare function archiveChat(args: {
    chatId: string;
    archive?: boolean;
}): Promise<ToolResult>;
export declare const pinChatTool: Tool;
export declare function pinChat(args: {
    chatId: string;
    pin?: boolean;
}): Promise<ToolResult>;
export declare const muteChatTool: Tool;
export declare function muteChat(args: {
    chatId: string;
    mute?: boolean;
    duration?: number;
}): Promise<ToolResult>;
export declare const markAsReadTool: Tool;
export declare function markAsRead(args: {
    chatId: string;
    read?: boolean;
}): Promise<ToolResult>;
export declare const clearMessagesTool: Tool;
export declare function clearMessages(args: {
    chatId: string;
}): Promise<ToolResult>;
export declare const deleteChatTool: Tool;
export declare function deleteChat(args: {
    chatId: string;
}): Promise<ToolResult>;
//# sourceMappingURL=chats.d.ts.map