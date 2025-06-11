import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MessageArgs, MediaMessageArgs, ToolResult } from '../types.js';
export declare const sendMessageTool: Tool;
export declare function sendMessage(args: MessageArgs): Promise<ToolResult>;
export declare const sendMediaTool: Tool;
export declare function sendMedia(args: MediaMessageArgs): Promise<ToolResult>;
export declare const getMessagesTool: Tool;
export declare function getMessages(args: {
    chatId: string;
    limit?: number;
    searchTerm?: string;
}): Promise<ToolResult>;
export declare const forwardMessageTool: Tool;
export declare function forwardMessage(args: {
    messageId: string;
    toChatId: string;
}): Promise<ToolResult>;
export declare const deleteMessageTool: Tool;
export declare function deleteMessage(args: {
    messageId: string;
    everyone?: boolean;
}): Promise<ToolResult>;
//# sourceMappingURL=messaging.d.ts.map