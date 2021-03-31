"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressFilerouter = void 0;
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ExpressFilerouter {
    constructor(config) {
        this.folder = config.folder;
        this.prefix = config.prefix ?? '/';
    }
    isDir(dirOrFile) {
        return fs_1.default.statSync(dirOrFile).isDirectory();
    }
    getFileStructure(folder = this.folder) {
        const files = fs_1.default.readdirSync(folder).map((x) => path_1.default.join(folder, x));
        const parsed = files.map((fileOrDir) => {
            if (this.isDir(fileOrDir)) {
                return this.getFileStructure(fileOrDir);
            }
            return fileOrDir;
        });
        return parsed.flat();
    }
    getParsedStructure() {
        const fileStructure = this.getFileStructure();
        return fileStructure.map((filename) => {
            let clean = filename.replace(this.folder + path_1.default.sep, '');
            ExpressFilerouter.ext.forEach((extension) => {
                if (clean.endsWith(extension)) {
                    clean = clean.slice(0, clean.length - (extension.length + 1));
                }
            });
            return {
                file: filename,
                path: this.prefix + clean,
            };
        });
    }
    async loadModules() {
        const parsedFiles = this.getParsedStructure();
        const modulePromise = parsedFiles.map(async ({ file, path: mpath }) => {
            const module = await Promise.resolve().then(() => __importStar(require(file)));
            if (!('default' in module))
                throw new Error(`${mpath} must contain a default export`);
            if (!('handler' in module.default))
                throw new Error(`${mpath} must export a handler`);
            if (!('method' in module.default))
                module.default.method = 'get';
            return {
                file,
                path: 'pathOverride' in module.default
                    ? module.default.pathOverride
                    : mpath,
                handler: module.default.handler,
                method: module.default.method,
            };
        });
        return Promise.all(modulePromise);
    }
    async applyTo(app) {
        try {
            app.use(await this.getRouter());
        }
        catch (e) {
            console.error('Oops something went wrong');
            process.exit(1);
        }
    }
    async getRouter() {
        const router = express_1.default.Router();
        const modules = await this.loadModules();
        modules.forEach(({ method, path, handler }) => {
            router[method](path, handler);
        });
        return router;
    }
}
exports.ExpressFilerouter = ExpressFilerouter;
ExpressFilerouter.ext = ['js', 'ts', 'mjs'];
//# sourceMappingURL=ExpressFilerouter.js.map