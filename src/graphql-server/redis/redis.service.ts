import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Injectable()
export class RedisPubSubEngineService
	extends RedisPubSub
	implements OnModuleDestroy
{
	async onModuleDestroy() {
		await this.close();
	}
}
