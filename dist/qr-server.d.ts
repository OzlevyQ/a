export declare class QRCodeServer {
    private app;
    private server;
    private currentQR;
    private port;
    constructor();
    private setupRoutes;
    private generateQRPage;
    updateQR(qrString: string): Promise<void>;
    clearQR(): void;
    start(): Promise<string>;
    stop(): Promise<void>;
    getURL(): string;
}
export declare const qrServer: QRCodeServer;
//# sourceMappingURL=qr-server.d.ts.map