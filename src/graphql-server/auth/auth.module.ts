import { DynamicModule, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guards';
import { AuthService } from './auth.service';
import { AuthConfig } from './interfaces/auth.interfaces';
import { PrismaModule } from '../../prisma/prisma.module';
import { AUTH_CONFIG } from './contants';

@Module({})
export class AuthModule {
	static register(options: AuthConfig): DynamicModule {
		return {
			module: AuthModule,
			providers: [
				{
					provide: AUTH_CONFIG,
					useValue: options,
				},
				AuthService,
				AuthGuard,
			],
			exports: [AuthGuard, AuthService],
			imports: [PrismaModule],
		};
	}
}
