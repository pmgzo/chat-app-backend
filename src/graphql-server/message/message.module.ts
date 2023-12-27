import { Module } from '@nestjs/common';
import { MessageResolver } from './resolvers/message.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MessageService } from './services/message.service';
import { ConversationService } from './services/conversation.service';
import { ConversationResolver } from './resolvers/conversation.resolver';
import { RedisModule } from '../../redis/redis.module';
import { PermissionsModule } from '../../permissions/permissions.module';

@Module({
	providers: [
		MessageResolver,
		MessageService,
		ConversationResolver,
		ConversationService,
	],
	imports: [
		PrismaModule,
		RedisModule,
		AuthModule.register({
			tokenExpiresAfter: '1d',
		}),
		PermissionsModule,
	],
})
export class MessageModule {}
