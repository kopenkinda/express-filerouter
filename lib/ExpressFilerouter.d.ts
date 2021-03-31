import { Express, Router } from 'express';
import { IExpressFilerouterConfig } from './interfaces/ExpressFilerouterConfig';
import { IParsedFStructure } from './interfaces/IParsedFStructure';
import { IRoute } from './interfaces/IRoute';
export declare class ExpressFilerouter {
    private folder;
    private prefix;
    private static ext;
    constructor(config: IExpressFilerouterConfig);
    private isDir;
    getFileStructure(folder?: string): string[];
    getParsedStructure(): IParsedFStructure[];
    loadModules(): Promise<(IParsedFStructure & IRoute)[]>;
    applyTo(app: Express): Promise<void>;
    getRouter(): Promise<Router>;
}
//# sourceMappingURL=ExpressFilerouter.d.ts.map