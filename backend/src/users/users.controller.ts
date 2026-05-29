import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles('ADMIN', 'SUPER_ADMIN')
    async create(@TenantId() tenantId: string, @Body() userData: Partial<User>) {
        return this.usersService.create(tenantId, userData);
    }

    @Get()
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findAll(@TenantId() tenantId: string) {
        return this.usersService.findAll(tenantId);
    }

    @Get(':id')
    @Roles('ADMIN', 'SUPER_ADMIN', 'ANALYST')
    async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.usersService.findById(tenantId, id);
    }

    @Patch(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async update(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Body() updateData: Partial<User>,
    ) {
        return this.usersService.update(tenantId, id, updateData);
    }

    @Delete(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async delete(@TenantId() tenantId: string, @Param('id') id: string) {
        await this.usersService.delete(tenantId, id);
        return { message: 'User deleted successfully' };
    }
}
