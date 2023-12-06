import { Module } from '@nestjs/common';
import { RedisPubSubEngineService } from './redis.service';

@Module({
	providers: [RedisPubSubEngineService],
	exports: [RedisPubSubEngineService],
})
export class RedisModule {}
