import * as jwt from 'jsonwebtoken';
import { Injectable, Inject } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'fs';
import parse from 'parse-duration';
import { GraphQLError } from 'graphql';

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
			path.resolve(__dirname, `../../../.rsafiles/${this.options.pemFileName}.key.pub`),
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
		let decodedToken: JwtPayload;

		try {
			decodedToken = this.parseJwt({ token });
		} catch (error) {
			throw new GraphQLError(error.message, {
				extensions: { code: 'AUTHENTICATION_ERROR' },
			});
		}

		if (!(await this.userExists(decodedToken))) {
			throw new GraphQLError("User doesn't exist", {
				extensions: { code: 'AUTHENTICATION_ERROR' },
			});
		}

		const durationLimit = parse(this.options.tokenExpiresAfter);

		if (decodedToken.iat + durationLimit < Date.now()) {
			throw new GraphQLError('Token has Expired', {
				extensions: { code: 'INTERNAL_SERVER_ERROR', public: true },
			});
		}

		return true;
	}

	createJwt({ id, name }: UserProperties): string {
		const privateKey = fs.readFileSync(
			path.resolve(__dirname, `../../../.rsafiles/${this.options.pemFileName}.key`),
			'utf8',
		);

		const payload: JwtPayload = {
			id,
			name,
			iat: Date.now(),
		};

		let encodedToken: string;

		try {
			encodedToken = jwt.sign(payload, privateKey, {
				algorithm: 'RS256',
			});
		} catch (error) {
			throw new GraphQLError(error.message, {
				extensions: { code: 'AUTHENTICATION_ERROR' },
			});
		}
		return encodedToken;
	}
}
