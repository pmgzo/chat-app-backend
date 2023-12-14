import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Injectable()
export class RedisPubSubEngineService
	extends RedisPubSub
	implements OnModuleDestroy
{
	constructor() {
		super({ connection: { port: parseInt(process.env.REDIS_PORT, 10) } });
	}
	async onModuleDestroy() {
		await this.close();
	}
}
