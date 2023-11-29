import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { formatError } from './error-masking';

@Module({
	imports: [
		UserModule,
		MessageModule,
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			playground: false,
			autoSchemaFile: true,
			sortSchema: true,
			formatError,
		}),
	],
})
export class GraphQLServerModule {}
