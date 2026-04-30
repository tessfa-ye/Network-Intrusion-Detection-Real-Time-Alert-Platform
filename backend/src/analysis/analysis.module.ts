import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';

@Module({
    imports: [],
    controllers: [AnalysisController],
    providers: [AnalysisService],
    exports: [AnalysisService],
})
export class AnalysisModule {}
