import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GraphQLError } from 'graphql';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const [, , { req }] = context.getArgs();

		if (!req.headers.authorization) {
			throw new GraphQLError('Missing authentication token', {
				extensions: { code: 'AUTHENTICATION_ERROR', public: true },
			});
		}

		const token = req.headers.authorization.split(' ')[1];
		return await this.authService.verifyToken(token);
	}
}
