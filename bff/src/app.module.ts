import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';

export const CACHE_TIME = 2 * 60 * 1000;

@Module({
    imports: [CacheModule.register({ ttl: CACHE_TIME })],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
