import { Module } from '@nestjs/common';
import { AppModule as DefaultModule } from './default-module/app.module';
import { GraphQLServerModule } from './graphql-server/graphql-server.module';

@Module({
	imports: [DefaultModule, GraphQLServerModule],
})
export class AppModule {}
