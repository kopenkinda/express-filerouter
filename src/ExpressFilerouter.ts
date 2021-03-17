import express, { Express, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { IExpressFilerouterConfig } from './interfaces/ExpressFilerouterConfig';
import { IParsedFStructure } from './interfaces/IParsedFStructure';
import { IRoute } from './interfaces/IRoute';

export class ExpressFilerouter {
  private folder: string;
  private prefix: string;
  private static ext: string[] = ['js', 'ts', 'mjs'];

  constructor(config: IExpressFilerouterConfig) {
    this.folder = config.folder;
    this.prefix = config.prefix ?? '/';
  }

  private isDir(dirOrFile: string): boolean {
    return fs.statSync(dirOrFile).isDirectory();
  }

  public getFileStructure(folder: string = this.folder): string[] {
    const files = fs.readdirSync(folder).map((x) => path.join(folder, x));
    const parsed = files.map((fileOrDir) => {
      if (this.isDir(fileOrDir)) {
        return this.getFileStructure(fileOrDir);
      }
      return fileOrDir;
    });
    return parsed.flat();
  }

  public getParsedStructure(): IParsedFStructure[] {
    const fileStructure = this.getFileStructure();
    return fileStructure.map((filename) => {
      let clean = filename.replace(this.folder + path.sep, '');
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

  public async loadModules(): Promise<(IParsedFStructure & IRoute)[]> {
    const parsedFiles = this.getParsedStructure();
    const modulePromise = parsedFiles.map(async ({ file, path: mpath }) => {
      const module = await import(file);
      if (!('default' in module))
        throw new Error(`${mpath} must contain a default export`);
      if (!('handler' in module.default))
        throw new Error(`${mpath} must export a handler`);
      if (!('method' in module.default)) module.default.method = 'get';
      return {
        file,
        path:
          'pathOverride' in module.default
            ? module.default.pathOverride
            : mpath,
        handler: module.default.handler,
        method: module.default.method,
      };
    });
    return Promise.all(modulePromise);
  }

  public async applyTo(app: Express) {
    try {
      app.use(await this.getRouter());
    } catch (e) {
      console.error('Oops something went wrong');
      process.exit(1);
    }
  }

  public async getRouter(): Promise<Router> {
    const router = express.Router();
    const modules = await this.loadModules();
    modules.forEach(({ method, path, handler }) => {
      router[method](path, handler);
    });
    return router;
  }
}
