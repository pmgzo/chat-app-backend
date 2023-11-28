import { Test } from '@nestjs/testing';
import { User } from '@prisma/client';

import * as path from 'node:path';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './interfaces/auth.interfaces';
import { UserService } from '../user/user.service';
import { AUTH_CONFIG } from './contants';
import { UnauthorizedException } from '@nestjs/common';

const createTokenHelper = (payload: JwtPayload): string => {
	const privateKey = fs.readFileSync(
		path.resolve(__dirname, './jwtRS256.key'),
		'utf8',
	);

	const encodedToken: string = jwt.sign(payload, privateKey, {
		algorithm: 'RS256',
	});
	return encodedToken;
};

describe('AuthService', () => {
	let authService: AuthService;
	let prismaService: PrismaService;
	let userService: UserService;
	let fixtureUser: User;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [{ provide: AUTH_CONFIG, useValue: {tokenExpiresAfter: '1d',
			pemFileName: 'jwtRS256',}}, AuthService, PrismaService, UserService],
		}).compile();

		authService = moduleRef.get<AuthService>(AuthService);
		prismaService = moduleRef.get<PrismaService>(PrismaService);
		userService = moduleRef.get<UserService>(UserService);

		// create user for testing
		fixtureUser = await userService.createUser('user_test', 'test_password');
	});

    it('should be defined', () => {
		expect(authService).toBeDefined();
        expect(userService).toBeDefined();
		expect(prismaService).toBeDefined();
		expect(authService).toBeDefined();
	});

	it('test with a right token', async () => {
		const token = authService.createJwt({
			id: fixtureUser.id,
			name: fixtureUser.name,
		});

		await expect(authService.verifyToken(token)).resolves.toEqual(true);
	});

	it('test with an empty token', async () => {
		await expect(authService.verifyToken('')).rejects.toThrow(jwt.JsonWebTokenError);
	});

	it('test token with different signature', async () => {
		const wrongToken =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.PecGQGkdLzNwhN6pDtTVM7Bxm4nZ66tBJnSBNvBL9kw';

		await expect(authService.verifyToken(wrongToken)).rejects.toThrow(jwt.JsonWebTokenError);
	});

	it('test expired token', async () => {
		// (asssuming that the token is expiring after 1 day)
		const today = new Date();

		// three days ago
		today.setDate(today.getDate() - 3);
		const threeDaysAgo = today;
		const payload: JwtPayload = {
			id: fixtureUser.id,
			name: fixtureUser.name,
			iat: threeDaysAgo.getTime(),
		};

		const expiredToken = createTokenHelper(payload);
		await expect(authService.verifyToken(expiredToken)).rejects.toThrow(UnauthorizedException);
	});

	afterAll(async () => {
		await prismaService.user.deleteMany({});
		await prismaService.$disconnect();
	});
});
