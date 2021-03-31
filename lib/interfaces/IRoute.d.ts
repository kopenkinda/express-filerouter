import type { NextFunction, Request, Response } from 'express';
export interface IRoute {
    method: 'get' | 'post' | 'delete' | 'put' | 'patch';
    handler: (req: Request, res: Response, next?: NextFunction) => void;
    pathOverride?: string | RegExp;
}
//# sourceMappingURL=IRoute.d.ts.map