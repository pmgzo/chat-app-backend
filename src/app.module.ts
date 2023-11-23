import { Module } from '@nestjs/common';
import { GraphQLServerModule } from './graphql-server/graphql-server.module';

@Module({
	imports: [GraphQLServerModule],
})
export class AppModule {}
