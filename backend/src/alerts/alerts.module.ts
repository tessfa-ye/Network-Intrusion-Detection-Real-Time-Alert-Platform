import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Alert.name, schema: AlertSchema },
        ]),
    ],
    controllers: [AlertsController],
    providers: [AlertsService],
    exports: [AlertsService],
})
export class AlertsModule { }
