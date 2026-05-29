import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) {}

    /**
     * Self-service tenant registration (no auth required)
     */
    @Post('register')
    async register(
        @Body() body: {
            name: string;
            slug: string;
            adminEmail: string;
            adminPassword: string;
            adminFirstName: string;
            adminLastName: string;
        },
    ) {
        return this.tenantsService.register(body);
    }

    /**
     * Get current tenant profile
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@TenantId() tenantId: string) {
        return this.tenantsService.findById(tenantId);
    }

    /**
     * Update tenant branding/settings
     */
    @Patch('me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async updateProfile(
        @TenantId() tenantId: string,
        @Body() body: {
            name?: string;
            logo?: string;
            primaryColor?: string;
            secondaryColor?: string;
            notificationConfig?: any;
        },
    ) {
        return this.tenantsService.update(tenantId, body);
    }

    /**
     * Get API key
     */
    @Get('me/api-key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getApiKey(@TenantId() tenantId: string) {
        return this.tenantsService.getApiKey(tenantId);
    }

    /**
     * Regenerate API key
     */
    @Post('me/regenerate-key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async regenerateKey(@TenantId() tenantId: string) {
        return this.tenantsService.regenerateApiKey(tenantId);
    }
}
