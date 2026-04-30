import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { FirewallModule } from '../firewall/firewall.module';

@Module({
    imports: [
        WebsocketModule,
        FirewallModule,
    ],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }
