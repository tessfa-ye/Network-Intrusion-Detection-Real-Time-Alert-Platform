import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { FirewallService } from './firewall.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('firewall')
@UseGuards(JwtAuthGuard)
export class FirewallController {
    constructor(private readonly firewallService: FirewallService) { }

    @Get('blacklist')
    async getBlacklist() {
        console.log('📋 Fetching blacklist...');
        return this.firewallService.getBlacklist();
    }

    @Post('block')
    async blockIp(@Body() data: { ip: string; reason: string; severity?: string }) {
        console.log(`🛡️ Received block request for IP: ${data.ip}`);
        return this.firewallService.blockIp(data.ip, data.reason, data.severity);
    }

    @Delete('unblock/*ip')
    async unblockIp(@Param('ip') ip: string) {
        console.log(`🔓 Received unblock request for IP: ${ip}`);
        return this.firewallService.unblockIp(ip);
    }

    @Get('allowlist')
    async getAllowlist() {
        return this.firewallService.getAllowlist();
    }

    @Delete('allowlist/*ip')
    async removeFromAllowlist(@Param('ip') ip: string) {
        return this.firewallService.removeFromAllowlist(ip);
    }

    @Get('status/:ip')
    async getStatus(@Param('ip') ip: string) {
        return { blocked: this.firewallService.isIpBlocked(ip) };
    }
}
