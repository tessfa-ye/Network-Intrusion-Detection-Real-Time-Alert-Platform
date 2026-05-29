import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { RulesService } from './rules.service';
import { DetectionRule } from '@prisma/client';

@Controller('rules')
@UseGuards(JwtAuthGuard)
export class RulesController {
    constructor(private readonly rulesService: RulesService) { }

    @Post()
    async create(@TenantId() tenantId: string, @Body() ruleData: Partial<DetectionRule>) {
        return this.rulesService.create(tenantId, ruleData);
    }

    @Get()
    async findAll(@TenantId() tenantId: string) {
        return this.rulesService.findAll(tenantId);
    }

    @Get(':id')
    async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.rulesService.findById(tenantId, id);
    }

    @Post(':id/dry-run')
    async dryRun(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Query('hoursBack') hoursBack?: string,
    ) {
        return this.rulesService.dryRun(tenantId, id, hoursBack ? parseInt(hoursBack) : 24);
    }

    @Patch(':id')
    async update(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Body() updateData: Partial<DetectionRule>,
    ) {
        return this.rulesService.update(tenantId, id, updateData);
    }

    @Delete(':id')
    async delete(@TenantId() tenantId: string, @Param('id') id: string) {
        await this.rulesService.delete(tenantId, id);
        return { message: 'Rule deleted successfully' };
    }
}
