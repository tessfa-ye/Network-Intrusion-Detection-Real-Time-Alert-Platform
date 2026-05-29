import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

/**
 * Parameter decorator to extract tenantId from the request.
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        const tenantId = request.tenantId || request.user?.tenantId;
        if (!tenantId) {
            throw new BadRequestException('Tenant context is required');
        }
        return tenantId;
    },
);
