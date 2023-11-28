import * as jwt from 'jsonwebtoken';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'fs';
import parse from 'parse-duration';

import { AuthConfig, JwtPayload } from './interfaces/auth.interfaces';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_CONFIG } from './contants';

type UserProperties = Pick<JwtPayload, 'id' | 'name'>;

@Injectable()
export class AuthService {
	constructor(
		@Inject(AUTH_CONFIG) private options: AuthConfig,
		private prisma: PrismaService,
	) {}

	private parseJwt({ token }: { token: string }): JwtPayload {
		const publicKey = fs.readFileSync(
			path.resolve(__dirname, `./${this.options.pemFileName}.key.pub`),
			'utf8',
		);
		const decodedToken: JwtPayload = jwt.verify(token, publicKey, {
			algorithm: 'RS256',
		});

		return decodedToken;
	}

	private async userExists({ id, name }: UserProperties): Promise<boolean> {
		return !!(await this.prisma.user.count({ where: { id, name } }));
	}

	async verifyToken(token: string): Promise<boolean> {
		const decodedToken = this.parseJwt({ token });

		if (!(await this.userExists(decodedToken))) {
			throw new UnauthorizedException();
			// throw error to say user doesn't exist or
			// to say unauthenticated (to avoid helping hacker finding pem)
		}

		const durationLimit = parse(this.options.tokenExpiresAfter);

		if ((decodedToken.iat + durationLimit) < Date.now()) {
			// need to refresh token
			throw new UnauthorizedException();
		}

		return true;
	}

	createJwt({ id, name }: UserProperties): string {
		const privateKey = fs.readFileSync(
			path.resolve(__dirname, `./${this.options.pemFileName}.key`),
			'utf8',
		);

		const payload: JwtPayload = {
			id,
			name,
			iat: Date.now(),
		};

		const encodedToken: string = jwt.sign(payload, privateKey, {
			algorithm: 'RS256',
		});

		return encodedToken;
	}
}
