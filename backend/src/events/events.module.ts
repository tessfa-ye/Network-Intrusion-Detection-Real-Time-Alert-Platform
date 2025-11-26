import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { SecurityEvent, SecurityEventSchema } from './schemas/event.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SecurityEvent.name, schema: SecurityEventSchema },
        ]),
    ],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }
