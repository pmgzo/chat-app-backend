import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WebSocket } from 'ws';
import { GraphQLServerModule } from '../src/graphql-server/graphql-server.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/graphql-server/auth/auth.service';
import { AUTH_CONFIG } from '../src/graphql-server/auth/contants';
import { createClient, Client } from 'graphql-ws';
import { UserService } from '../src/graphql-server/user/services/user.service';
import { UserResolver } from '../src/graphql-server/user/resolvers/user.resolver';
import { User } from '@prisma/client';
import { FriendshipResolver } from '../src/graphql-server/user/resolvers/friendship.resolver';
import { RedisModule } from '../src/graphql-server/redis/redis.module';

jest.mock('../src/graphql-server/configs/context', () => {
	const originalModule = jest.requireActual(
		'../src/graphql-server/configs/context',
	);

	return {
		__esModule: true,
		...originalModule,
		// bypass auth for websocketConnection
		onConnect: jest.fn().mockReturnValue(true),
	};
});

describe('Graphql Subscription tests', () => {
	let app: INestApplication;
	let prismaService: PrismaService;
	let authService: AuthService;
	let userService: UserService;
	let userResolver: UserResolver;
	let friendshipResolver: FriendshipResolver;
	let client: Client;

	let kathy: User;
	let mamadou: User;

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
		await app.listen(3000);

		client = createClient({
			webSocketImpl: WebSocket,
			url: 'ws://localhost:3000/subscriptions',
			lazy: false,
		});

		authService = moduleFixture.get<AuthService>(AuthService);
		prismaService = moduleFixture.get<PrismaService>(PrismaService);
		userService = moduleFixture.get<UserService>(UserService);
		friendshipResolver =
			moduleFixture.get<FriendshipResolver>(FriendshipResolver);

		kathy = await userService.createUser('Kathy', 'pssd');
		mamadou = await userService.createUser('Mamadou', 'pssd');
	});

	it('test with user friend request', async () => {
		const subscription = client.iterate({
			query: 'subscription { friendRequestSent { id } }',
		});

		await Promise.all([
			subscription.next(),
			friendshipResolver.sendFriendRequest({ user: kathy }, mamadou.id),
		]).then(([val, val2]) => {
			expect(val.value.data.friendRequestSent.id).toBe(val2.id);
		});
		await client.dispose();
	});

	afterAll(async () => {
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await app.close();
	});
});
