import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GraphQLServerModule } from '../src/graphql-server/graphql-server.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/graphql-server/auth/auth.service';
import { AUTH_CONFIG } from '../src/graphql-server/auth/contants';

describe('UserResolver (e2e)', () => {
	let app: INestApplication;
	let prismaService: PrismaService;
	const gqlEnpoint = '/graphql';
	let authService: AuthService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			providers: [PrismaService],
		}).compile();

		prismaService = module.get(PrismaService);

		const moduleFixture: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: AUTH_CONFIG,
					useValue: { tokenExpiresAfter: '1d' },
				},
				AuthService,
			],
			imports: [GraphQLServerModule, PrismaModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		authService = moduleFixture.get<AuthService>(AuthService);

		authService.createJwt = jest.fn().mockReturnValue('fakeToken');
	});

	it('create user', () => {
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

	it('test error masking from db error', () => {
		const queryData = {
			query: `
			query queryUser($name: String!) {
				user(name: $name) {
					name
				}
			}
			`,
			operationName: 'queryUser',
			variables: { name: 'user' },
		};

		return request(app.getHttpServer())
			.post(gqlEnpoint)
			.set('Apollo-Require-Preflight', 'true')
			.set('Authorization', 'Bearer fake token')
			.send(queryData)
			.expect(200)
			.expect((res) => {
				expect(res.body.errors[0]).toEqual({
					message: 'Authentication Error',
					extensions: {
						code: 'AUTHENTICATION_ERROR',
					},
				});
			});
	});

	it('test error masking with requesting unexisting user', () => {
		authService.verifyToken = jest.fn().mockReturnValueOnce(true);

		const queryData = {
			query: `
			query queryUser($name: String!) {
				user(name: $name) {
					name
				}
			}
			`,
			operationName: 'queryUser',
			variables: { name: 'unexisting user' },
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
		await prismaService.user.deleteMany({});
		await prismaService.$disconnect();
	});
});
