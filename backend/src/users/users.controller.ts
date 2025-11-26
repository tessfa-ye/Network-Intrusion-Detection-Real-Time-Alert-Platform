import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    async create(@Body() userData: Partial<User>) {
        return this.usersService.create(userData);
    }

    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateData: Partial<User>,
    ) {
        return this.usersService.update(id, updateData);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.usersService.delete(id);
        return { message: 'User deleted successfully' };
    }
}
