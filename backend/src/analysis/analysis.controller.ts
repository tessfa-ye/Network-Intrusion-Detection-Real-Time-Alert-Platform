import { Controller, Get, Param } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) {}

    @Get('reputation/:ip')
    async getGlobalReputation(@Param('ip') ip: string) {
        return this.analysisService.getGlobalReputation(ip);
    }
}
