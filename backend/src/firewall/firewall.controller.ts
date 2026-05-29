import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { FirewallService } from './firewall.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('firewall')
@UseGuards(JwtAuthGuard)
export class FirewallController {
    constructor(private readonly firewallService: FirewallService) { }

    @Get('blacklist')
    async getBlacklist(@TenantId() tenantId: string) {
        console.log('📋 Fetching blacklist...');
        return this.firewallService.getBlacklist(tenantId);
    }

    @Post('block')
    async blockIp(@TenantId() tenantId: string, @Body() data: { ip: string; reason: string; severity?: string }) {
        console.log(`🛡️ Received block request for IP: ${data.ip}`);
        return this.firewallService.blockIp(tenantId, data.ip, data.reason, data.severity);
    }

    @Delete('unblock/*ip')
    async unblockIp(@TenantId() tenantId: string, @Param('ip') ip: string) {
        console.log(`🔓 Received unblock request for IP: ${ip}`);
        return this.firewallService.unblockIp(tenantId, ip);
    }

    @Get('allowlist')
    async getAllowlist(@TenantId() tenantId: string) {
        return this.firewallService.getAllowlist(tenantId);
    }

    @Delete('allowlist/*ip')
    async removeFromAllowlist(@TenantId() tenantId: string, @Param('ip') ip: string) {
        return this.firewallService.removeFromAllowlist(tenantId, ip);
    }

    @Get('status/:ip')
    async getStatus(@TenantId() tenantId: string, @Param('ip') ip: string) {
        return { blocked: this.firewallService.isIpBlocked(tenantId, ip) };
    }
}
