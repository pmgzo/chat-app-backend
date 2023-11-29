import { Module } from '@nestjs/common';
import { MessageResolver } from './message.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
	providers: [MessageResolver],
	imports: [
		PrismaModule,
		AuthModule.register({
			tokenExpiresAfter: '1d',
			pemFileName: 'jwtRS256',
		}),
	],
})
export class MessageModule {}
