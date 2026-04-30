import { Module, Global } from '@nestjs/common';
import { FirewallService } from './firewall.service';
import { FirewallController } from './firewall.controller';

@Global()
@Module({
    providers: [FirewallService],
    controllers: [FirewallController],
    exports: [FirewallService],
})
export class FirewallModule { }
