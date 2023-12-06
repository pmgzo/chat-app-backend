import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { formatError } from './configs/error-masking';
import { context } from './configs/context';

@Module({
	imports: [
		UserModule,
		MessageModule,
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			subscriptions: {
				'graphql-ws': {
					onConnect: (ctx) => {
						console.log("connected")
						console.log(ctx)
					},
					path: '/subscriptions'
				}
			},
			playground: true,
			autoSchemaFile: true,
			sortSchema: true,
			formatError,
			context,
		}),
	],
})
export class GraphQLServerModule {}
