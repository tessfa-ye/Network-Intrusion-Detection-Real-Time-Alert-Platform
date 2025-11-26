import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { RulesService } from './rules.service';
import { DetectionRule } from './schemas/rule.schema';

@Controller('rules')
export class RulesController {
    constructor(private readonly rulesService: RulesService) { }

    @Post()
    async create(@Body() ruleData: Partial<DetectionRule>) {
        return this.rulesService.create(ruleData);
    }

    @Get()
    async findAll() {
        return this.rulesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.rulesService.findById(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateData: Partial<DetectionRule>,
    ) {
        return this.rulesService.update(id, updateData);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.rulesService.delete(id);
        return { message: 'Rule deleted successfully' };
    }
}
