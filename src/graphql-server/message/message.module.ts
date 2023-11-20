import { Module } from '@nestjs/common';
import { MessageResolver } from './message.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	providers: [MessageResolver],
	imports: [PrismaModule],
})
export class MessageModule {}
