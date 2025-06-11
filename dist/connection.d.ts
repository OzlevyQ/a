#!/usr/bin/env node
import { WhatsAppConnectionData, McpWhatsAppServer } from './types.js';
export declare class WhatsAppConnectionManager implements McpWhatsAppServer {
    client: any;
    connectionData: WhatsAppConnectionData;
    private sessionDir;
    private connectionFile;
    private _isConnected;
    private connectionInfo;
    private currentQR;
    constructor();
    private saveQRCode;
    private clearQRCode;
    getCurrentQR(): string | null;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    saveConnectionData(): Promise<void>;
    loadConnectionData(): Promise<void>;
    getConnectionStatus(): Promise<any>;
    loadExistingConnection(): Promise<boolean>;
    connectWithExistingSession(): Promise<void>;
    private saveConnectionInfo;
    private cleanup;
    getConnectionInfo(): any;
    smartConnect(): Promise<void>;
}
export declare function getWhatsAppConnection(): WhatsAppConnectionManager;
export declare const whatsAppConnection: WhatsAppConnectionManager;
//# sourceMappingURL=connection.d.ts.map