import { Module } from '@nestjs/common';
import { MessageResolver } from './resolvers/message.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MessageService } from './services/message.service';
import { ConversationService } from './services/conversation.service';
import { ConversationResolver } from './resolvers/conversation.resolver';

@Module({
	providers: [
		MessageResolver,
		MessageService,
		ConversationResolver,
		ConversationService,
	],
	imports: [
		PrismaModule,
		AuthModule.register({
			tokenExpiresAfter: '1d',
		}),
	],
})
export class MessageModule {}
