import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { SecurityEvent, SecurityEventSchema } from './schemas/event.schema';

import { WebsocketModule } from '../websocket/websocket.module';
import { FirewallModule } from '../firewall/firewall.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SecurityEvent.name, schema: SecurityEventSchema },
        ]),
        WebsocketModule,
        FirewallModule,
    ],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }
