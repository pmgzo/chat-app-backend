import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GqlConfigService } from './graphql-config.service';

@Module({
	imports: [
		UserModule,
		MessageModule,
		GraphQLModule.forRootAsync<ApolloDriverConfig>({
			driver: ApolloDriver,
			useClass: GqlConfigService,
			imports: [
				PrismaModule,
				AuthModule.register({
					tokenExpiresAfter: '1d',
				}),
			],
		}),
	],
})
export class GraphQLServerModule {}
