import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisService } from './analysis.service';
import { IPBaseline, IPBaselineSchema } from './schemas/baseline.schema';
import { SecurityEvent, SecurityEventSchema } from '../events/schemas/event.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: IPBaseline.name, schema: IPBaselineSchema },
            { name: SecurityEvent.name, schema: SecurityEventSchema },
        ]),
    ],
    providers: [AnalysisService],
    exports: [AnalysisService],
})
export class AnalysisModule {}
