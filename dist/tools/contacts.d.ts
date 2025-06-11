import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolResult } from '../types.js';
export declare const getContactsTool: Tool;
export declare function getContacts(args: {
    limit?: number;
}): Promise<ToolResult>;
export declare const getContactInfoTool: Tool;
export declare function getContactInfo(args: {
    contactId: string;
}): Promise<ToolResult>;
export declare const blockContactTool: Tool;
export declare function blockContact(args: {
    contactId: string;
    block?: boolean;
}): Promise<ToolResult>;
export declare const getProfilePicTool: Tool;
export declare function getProfilePic(args: {
    contactId: string;
}): Promise<ToolResult>;
export declare const getContactAboutTool: Tool;
export declare function getContactAbout(args: {
    contactId: string;
}): Promise<ToolResult>;
export declare const getCommonGroupsTool: Tool;
export declare function getCommonGroups(args: {
    contactId: string;
}): Promise<ToolResult>;
export declare const searchContactsTool: Tool;
export declare function searchContacts(args: {
    query: string;
    limit?: number;
}): Promise<ToolResult>;
//# sourceMappingURL=contacts.d.ts.map