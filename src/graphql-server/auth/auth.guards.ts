import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const [, , { req }] = context.getArgs();

		if (!req.headers.authorization) {
			return false;
		}

		const token = req.headers.authorization.split(' ')[1];
		return await this.authService.verifyToken(token);
	}
}
