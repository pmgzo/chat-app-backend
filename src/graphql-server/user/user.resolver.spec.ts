import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResolver } from './user.resolver';
import { UserCredentialsInput } from './dto/user.input';
import { AuthService } from '../auth/auth.service';
import { AUTH_CONFIG } from '../auth/contants';
import { UserService } from './user.service';

describe('UserResolver', () => {
	let userResolver: UserResolver;
	let prismaService: PrismaService;
	let authService: AuthService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			providers: [{ provide: AUTH_CONFIG, useValue: {tokenExpiresAfter: '1d',
			pemFileName: 'jwtRS256'}}, AuthService, UserResolver, UserService, PrismaService],
		}).compile();
		userResolver = module.get<UserResolver>(UserResolver);
		prismaService = module.get<PrismaService>(PrismaService);
		authService = module.get<AuthService>(AuthService);

		authService.createJwt = jest.fn().mockReturnValue('fakeToken')
	});

	it('should be defined', () => {
		expect(userResolver).toBeDefined();
		expect(prismaService).toBeDefined();
		expect(authService).toBeDefined();
	});

	it('create and login', async () => {
		const userCredentials: UserCredentialsInput = {
			name: 'user1',
			password: 'toto',
		};

		const token1 = await userResolver.createUser(userCredentials);

		expect(token1.token).toEqual('fakeToken');

		const token2 = await userResolver.login(userCredentials);

		expect(token2.token).toEqual('fakeToken');
	});

	afterAll(async () => {
		await prismaService.user.deleteMany({});
		await prismaService.$disconnect();
	});
});
