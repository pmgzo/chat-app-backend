import { Module } from '@nestjs/common';
import { UserResolver } from './resolvers/user.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserService } from './services/user.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { FriendshipResolver } from './resolvers/friendship.resolver';
import { FriendshipService } from './services/friendship.service';

@Module({
	providers: [UserResolver, FriendshipResolver, UserService, FriendshipService],
	imports: [
		PrismaModule,
		RedisModule,
		AuthModule.register({
			tokenExpiresAfter: '1d',
		}),
	],
})
export class UserModule {}
