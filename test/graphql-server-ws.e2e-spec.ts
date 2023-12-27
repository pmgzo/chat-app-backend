import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WebSocket } from 'ws';
import { GraphQLServerModule } from '../src/graphql-server/graphql-server.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AUTH_CONFIG } from '../src/graphql-server/auth/contants';
import { createClient, Client } from 'graphql-ws';
import { UserService } from '../src/graphql-server/user/services/user.service';
import { User } from '@prisma/client';
import { FriendshipResolver } from '../src/graphql-server/user/resolvers/friendship.resolver';
import { RedisModule } from '../src/redis/redis.module';
import { ConversationService } from '../src/graphql-server/message/services/conversation.service';
import { MessageResolver } from '../src/graphql-server/message/resolvers/message.resolver';
import { ConversationResolver } from '../src/graphql-server/message/resolvers/conversation.resolver';
import { UserResolver } from '../src/graphql-server/user/resolvers/user.resolver';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Graphql Subscription tests', () => {
	let app: INestApplication;
	let moduleFixture: TestingModule;

	let prismaService: PrismaService;
	let conversationService: ConversationService;

	let userResolver: UserResolver;
	let friendshipResolver: FriendshipResolver;
	let messageResolver: MessageResolver;

	let client: Client;

	let kathy: User;
	let mamadou: User;

	beforeAll(async () => {
		moduleFixture = await Test.createTestingModule({
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

		prismaService = moduleFixture.get<PrismaService>(PrismaService);
		userResolver = moduleFixture.get<UserResolver>(UserResolver);

		conversationService =
			moduleFixture.get<ConversationService>(ConversationService);
		friendshipResolver =
			moduleFixture.get<FriendshipResolver>(FriendshipResolver);
		messageResolver = moduleFixture.get<MessageResolver>(MessageResolver);

		const userService = moduleFixture.get<UserService>(UserService);
		kathy = await userService.createUser('Kathy', 'pssd');
		mamadou = await userService.createUser('Mamadou', 'pssd');
	});

	afterEach(async () => {
		await prismaService.message.deleteMany({});
		await prismaService.conversation.deleteMany({});
		await prismaService.friendship.deleteMany({});
	});

	it('should be defined', () => {
		expect(prismaService).toBeDefined();
		expect(conversationService).toBeDefined();

		expect(friendshipResolver).toBeDefined();
		expect(messageResolver).toBeDefined();
	});

	describe('test with subscription with conversation and message', () => {
		// here we only one standard client which is mamadou here

		beforeEach(async () => {
			const userResolver = moduleFixture.get<UserResolver>(UserResolver);

			const tokenObj = await userResolver.login({
				name: 'Mamadou',
				password: 'pssd',
			});

			client = createClient({
				webSocketImpl: WebSocket,
				url: 'ws://localhost:3000/subscriptions',
				connectionParams: { token: `Bearer ${tokenObj.token}` },
				lazy: false,
			});
		});

		it('sending friend request', async () => {
			const subscription = client.iterate({
				query: 'subscription FriendReq {friendRequestSent { id }}',
				operationName: 'FriendReq',
			});

			// wait enough to let the client subscribe before the sending message
			await delay(500);

			await Promise.all([
				subscription.next(),
				friendshipResolver.sendFriendRequest({ user: kathy }, mamadou.id),
			]).then(([friendRequestSub, friendReqMutation]) => {
				expect(friendRequestSub.value.data.friendRequestSent.id).toBe(
					friendReqMutation.id,
				);
			});
		});

		it('sending message', async () => {
			// create friendship
			const fReq = await friendshipResolver.sendFriendRequest(
				{ user: kathy },
				mamadou.id,
			);
			await friendshipResolver.respondToFriendRequest(
				{ user: mamadou },
				{ friendRequestId: fReq.id, accept: true },
			);

			// create conv
			const conversation = await conversationService.createConversation(
				fReq.id,
				mamadou.id,
			);

			// subscribe to receiving message from this conv
			const subscription = client.iterate({
				query:
					'subscription MessageSent($conversationId: Int!, $receiverId: Int!){ messageSent(conversationId: $conversationId, receiverId: $receiverId) { id, conversationId, text } }',
				variables: { conversationId: conversation.id, receiverId: mamadou.id },
			});

			// wait enough to let the client subscribe before the sending message
			await delay(500);

			await Promise.all([
				subscription.next(),
				messageResolver.sendMessage(
					{ user: kathy },
					{
						text: 'Hi',
						receiverId: mamadou.id,
						conversationId: conversation.id,
					},
				),
			]).then(([receivedMessageSub, sendMessageMut]) => {
				expect(receivedMessageSub.value.data.messageSent.id).toBe(
					sendMessageMut.id,
				);
				expect(receivedMessageSub.value.data.messageSent.conversationId).toBe(
					sendMessageMut.conversationId,
				);
				expect(receivedMessageSub.value.data.messageSent.conversationId).toBe(
					sendMessageMut.conversationId,
				);
				expect(receivedMessageSub.value.data.messageSent.text).toBe(
					sendMessageMut.text,
				);
			});
		});

		afterEach(async () => {
			await client.dispose();
			client.terminate();
		});
	});

	describe('tests subscription permissions', () => {
		let tom: User;

		beforeAll(async () => {
			// create a tier person to check rights
			const userService = moduleFixture.get<UserService>(UserService);
			tom = await userService.createUser('Tom', 'pssd');
		});

		it("another user cannot subscribe to a conversation that she/he doesn't belong to", (done) => {
			const conversationResolver =
				moduleFixture.get<ConversationResolver>(ConversationResolver);
			const userResolver = moduleFixture.get<UserResolver>(UserResolver);

			// tom and mamadou become friend, and tom has started a conversation with him
			friendshipResolver
				.sendFriendRequest({ user: tom }, mamadou.id)
				.then((fReq) => {
					friendshipResolver
						.respondToFriendRequest(
							{ user: mamadou },
							{ friendRequestId: fReq.id, accept: true },
						)
						.then(() => {
							conversationResolver
								.createConversation({ user: tom }, fReq.id)
								.then((conversation) => {
									// kathy logs in and subscribes to a conversation that she shouldn't have access
									userResolver
										.login({
											name: 'Kathy',
											password: 'pssd',
										})
										.then((tokenObj) => {
											client = createClient({
												webSocketImpl: WebSocket,
												url: 'ws://localhost:3000/subscriptions',
												connectionParams: { token: `Bearer ${tokenObj.token}` },
												lazy: false,
											});

											client.on('message', (message) => {
												if (message.type === 'next' && message.payload) {
													expect(
														message.payload.errors[0].extensions.code,
													).toBe('PERMISSIONS_ERROR');
													done();
												}
												if (
													message.type === 'next' &&
													message.payload &&
													!message.payload.errors
												) {
													done(
														new Error('Should have a permissions error here !'),
													);
												}
											});

											const subscription = client.iterate({
												query:
													'subscription MessageSent($conversationId: Int!, $receiverId: Int!){ messageSent(conversationId: $conversationId, receiverId: $receiverId) { id, conversationId, text } }',
												variables: {
													conversationId: conversation.id,
													receiverId: kathy.id,
												},
											});
										});
								});
						});
				});
		});

		afterEach(async () => {
			await client.dispose();
			client.terminate();
		});
	});

	afterAll(async () => {
		await prismaService.user.deleteMany({});
		await app.close();
	});
});
