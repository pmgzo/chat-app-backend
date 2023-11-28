import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';

@Module({
	imports: [
		UserModule,
		MessageModule,
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			playground: false,
			autoSchemaFile: true,
			sortSchema: true,
		})
	],
})
export class GraphQLServerModule {}
