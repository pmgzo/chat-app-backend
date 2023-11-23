import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GraphQLServerModule } from '../src/graphql-server/graphql-server.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.mock('../src/graphql-server/common/jwt', () => {
	const originalModule = jest.requireActual('../src/graphql-server/common/jwt');

	return {
		__esModule: true,
		...originalModule,
		createJwt: jest.fn(({ id }: { id: number }) => 'fakeToken'),
	};
});

describe('UserResolver (e2e)', () => {
	let app: INestApplication;
	let prismaService: PrismaService;
	const gqlEnpoint = '/graphql';

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			providers: [PrismaService],
		}).compile();
		prismaService = module.get(PrismaService);

		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [GraphQLServerModule, PrismaModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('create user ', () => {
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

	afterAll(async () => {
		// delete
		await prismaService.user.deleteMany({});
		await prismaService.$disconnect();
	});
});
