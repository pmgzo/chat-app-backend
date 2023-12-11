import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WebSocket } from 'ws';
import { GraphQLServerModule } from '../src/graphql-server/graphql-server.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AUTH_CONFIG } from '../src/graphql-server/auth/contants';
import { RedisModule } from '../src/graphql-server/redis/redis.module';
import { UserResolver } from '../src/graphql-server/user/resolvers/user.resolver';
import { UserService } from '../src/graphql-server/user/services/user.service';
import { Client, createClient } from 'graphql-ws';
import { FriendshipResolver } from '../src/graphql-server/user/resolvers/friendship.resolver';
import { User } from '@prisma/client';
import { AuthentifiedUserToken } from '../src/graphql-server/user/models/user.model';

describe('Authentication (e2e)', () => {
	let app: INestApplication;
	let prismaService: PrismaService;
	let userResolver: UserResolver;
	let userService: UserService;
	let friendshipResolver: FriendshipResolver;

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
		await app.listen(3001);

		userService = moduleFixture.get<UserService>(UserService);
		friendshipResolver =
			moduleFixture.get<FriendshipResolver>(FriendshipResolver);
		userResolver = moduleFixture.get<UserResolver>(UserResolver);
		prismaService = moduleFixture.get<PrismaService>(PrismaService);
	});

	describe('Websocket authentication', () => {
		let client: Client;
		let tom: User;
		let mamadou: User;
		let connectionParams: AuthentifiedUserToken;

		beforeAll(async () => {
			const tomCredentials = { name: 'tom', password: 'tom' };
			tom = await userService.createUser(
				tomCredentials.name,
				tomCredentials.password,
			);
			mamadou = await userService.createUser('mamadou', 'tom');

			connectionParams = await userResolver.login(tomCredentials);
		});

		test('succeed auth in websocket connection', (done) => {
			client = createClient({
				webSocketImpl: WebSocket,
				url: 'ws://localhost:3001/subscriptions',
				connectionParams: { token: `Bearer ${connectionParams.token}` },
				lazy: false,
			});

			const subscription = client.iterate({
				query:
					'subscription FriendRequestSent($requesteeId: Int!){ friendRequestSent(requesteeId: $requesteeId) { id } }',
				operationName: 'FriendRequestSent',
				variables: { requesteeId: tom.id },
			});

			// connect takes time, the friendRequest is sent before even then connected finished
			client.on('connected', () => {
				Promise.all([
					subscription.next(),
					friendshipResolver.sendFriendRequest({ user: mamadou }, tom.id),
				])
					.then(([friendshipReceived, friendshipRequest]) => {
						expect(friendshipReceived.value.data.friendRequestSent.id).toEqual(
							friendshipRequest.id,
						);
						done();
					})
					.then(client.dispose)
					.then(done);
			});
		});

		test('failed auth, no token was given', (done) => {
			client = createClient({
				webSocketImpl: WebSocket,
				url: 'ws://localhost:3001/subscriptions',
				lazy: false,
				onNonLazyError: (error) => {
					client.dispose();
					done();
				},
				on: {
					connected: () => {
						client.dispose();
						done(new Error('An error should happened'));
					},
				},
				retryAttempts: 0,
			});
		});
	});
	afterAll(async () => {
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await app.close();
	});
});
