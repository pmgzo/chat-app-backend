import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';

@Module({
	providers: [UserResolver, UserService],
	imports: [
		PrismaModule,
		AuthModule.register({
			tokenExpiresAfter: '1d',
		}),
	],
})
export class UserModule {}
