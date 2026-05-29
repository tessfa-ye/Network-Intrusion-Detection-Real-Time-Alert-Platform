import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma.service';

// Extend Express Request to include tenantId
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
        }
    }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) {}

    async use(req: Request, _res: Response, next: NextFunction) {
        // 1. Try to get tenantId from JWT payload (set by JwtStrategy)
        let tenantId = (req as any).user?.tenantId;

        // 2. Fallback: check x-tenant-id header
        if (!tenantId) {
            tenantId = req.headers['x-tenant-id'] as string;
        }

        // 3. Fallback: check API key header for machine-to-machine auth
        if (!tenantId) {
            const apiKey = req.headers['x-api-key'] as string;
            if (apiKey) {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { apiKey },
                    select: { id: true, active: true },
                });
                if (tenant && tenant.active) {
                    tenantId = tenant.id;
                } else if (tenant && !tenant.active) {
                    throw new ForbiddenException('Tenant account is disabled');
                }
            }
        }

        // For unauthenticated routes (login, register, tenant registration),
        // tenantId may not be available yet — that's OK
        if (tenantId) {
            req.tenantId = tenantId;
        }

        next();
    }
}
