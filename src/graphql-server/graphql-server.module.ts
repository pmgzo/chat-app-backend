import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { UserModule } from './user/user.module';

@Module({
	imports: [
		UserModule,
		GraphQLModule.forRoot<ApolloDriverConfig>({
			//include: [UserModule], //(put resolvers module here, to improve compilation time)
			driver: ApolloDriver,
			playground: false,
			autoSchemaFile: true,
			sortSchema: true,
		}),
	],
})
export class GraphQLServerModule {}
