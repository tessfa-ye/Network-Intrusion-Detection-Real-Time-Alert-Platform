import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FirewallService } from './firewall.service';
import { FirewallController } from './firewall.controller';
import { Blacklist, BlacklistSchema } from './schemas/blacklist.schema';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: Blacklist.name, schema: BlacklistSchema }]),
    ],
    providers: [FirewallService],
    controllers: [FirewallController],
    exports: [FirewallService],
})
export class FirewallModule { }
