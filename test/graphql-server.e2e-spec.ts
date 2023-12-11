import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GraphQLServerModule } from '../src/graphql-server/graphql-server.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/graphql-server/auth/auth.service';
import { AUTH_CONFIG } from '../src/graphql-server/auth/contants';
import { RedisModule } from '../src/graphql-server/redis/redis.module';

describe('UserResolver (e2e)', () => {
	let app: INestApplication;
	let prismaService: PrismaService;
	const gqlEnpoint = '/graphql';
	let authService: AuthService;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: AUTH_CONFIG,
					useValue: { tokenExpiresAfter: '1d' },
				},
			],
			imports: [GraphQLServerModule, PrismaModule, RedisModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		authService = moduleFixture.get<AuthService>(AuthService);
		prismaService = moduleFixture.get<PrismaService>(PrismaService);
	});

	it('create user', () => {
		authService.createJwt = jest.fn().mockReturnValueOnce('fakeToken');
		const mutationData = {
			query: `
			mutation createUserMutation($credentials: UserCredentialsInput!) {
				createUser(credentials: $credentials) {
					token
				}
			}
			`,
			operationName: 'createUserMutation',
			variables: { credentials: { name: 'user2', password: 'pssd' } },
		};

		return request(app.getHttpServer())
			.post(gqlEnpoint)
			.set('Apollo-Require-Preflight', 'true')
			.send(mutationData)
			.expect(200)
			.expect((res) => {
				expect(res.body.data.createUser.token).toEqual('fakeToken');
			});
	});

	it('Error masking from db error at login', () => {
		const fakeUserName = 'fakeUserName';

		const queryData = {
			query: `
			mutation Login($credentials: UserCredentialsInput!) {
				login(credentials: $credentials) {
					token
				}
			}
			`,
			operationName: 'Login',
			variables: { credentials: { name: fakeUserName, password: 'password' } },
		};

		return request(app.getHttpServer())
			.post(gqlEnpoint)
			.set('Apollo-Require-Preflight', 'true')
			.send(queryData)
			.expect(200)
			.expect((res) => {
				expect(res.body.errors[0].message).toBe(
					'Wrong username or password provided',
				);
				expect(res.body.errors[0].extensions.code).toBe('AUTHENTICATION_ERROR');
			});
	});

	it('test error masking with requesting unexisting user', () => {
		authService.verifyToken = jest.fn().mockReturnValueOnce(true);

		const fakeUsername = 'john';
		const queryData = {
			query: `
			query queryUser($name: String!) {
				user(name: $name) {
					name
				}
			}
			`,
			operationName: 'queryUser',
			variables: { name: fakeUsername },
		};

		return request(app.getHttpServer())
			.post(gqlEnpoint)
			.set('Apollo-Require-Preflight', 'true')
			.set('Authorization', 'Bearer wrongToken')
			.send(queryData)
			.expect(200)
			.expect((res) => {
				expect(res.body.errors[0]).toEqual({
					message: 'Internal Server Error',
					path: ['user'],
					extensions: { code: 'INTERNAL_SERVER_ERROR' },
				});
			});
	});

	afterAll(async () => {
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await app.close();
	});
});
