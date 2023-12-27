import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	providers: [PermissionsService],
	exports: [PermissionsService],
	imports: [PrismaModule],
})
export class PermissionsModule {}
