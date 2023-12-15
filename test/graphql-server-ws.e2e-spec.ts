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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

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
	let userService: UserService;
	let conversationService: ConversationService;
	let friendshipResolver: FriendshipResolver;
	let messageResolver: MessageResolver;

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

		prismaService = moduleFixture.get<PrismaService>(PrismaService);
		userService = moduleFixture.get<UserService>(UserService);
		conversationService =
			moduleFixture.get<ConversationService>(ConversationService);
		friendshipResolver =
			moduleFixture.get<FriendshipResolver>(FriendshipResolver);
		messageResolver = moduleFixture.get<MessageResolver>(MessageResolver);

		kathy = await userService.createUser('Kathy', 'pssd');
		mamadou = await userService.createUser('Mamadou', 'pssd');
	});

	beforeEach(() => {
		client = createClient({
			webSocketImpl: WebSocket,
			url: 'ws://localhost:3000/subscriptions',
			lazy: false,
		});
	})

	it('test with user friend request', async () => {
		const subscription = client.iterate({
			query:
				'subscription FriendRequestSent($requesteeId: Int!){ friendRequestSent(requesteeId: $requesteeId) { id } }',
			operationName: 'FriendRequestSent',
			variables: { requesteeId: mamadou.id },
		});

		// wait enough to let the client subscribe before the sending message
		await delay(1000);

		await Promise.all([
			subscription.next(),
			friendshipResolver.sendFriendRequest({ user: kathy }, mamadou.id),
		]).then(([val, val2]) => {
			expect(val.value.data.friendRequestSent.id).toBe(val2.id);
		});
	});

	it('test with sending message', async () => {
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
			variables:
				{ conversationId: conversation.id, receiverId: mamadou.id },
		});

		// wait enough to let the client subscribe before the sending message
		await delay(1000);

		await Promise.all([
			subscription.next(),
			messageResolver.sendMessage(
				{ user: kathy },
				{ text: 'Hi', receiverId: mamadou.id, conversationId: conversation.id },
			),
		]).then(([val, val2]) => {
			expect(val.value.data.messageSent.id).toBe(val2.id);
			expect(val.value.data.messageSent.conversationId).toBe(
				val2.conversationId,
			);
			expect(val.value.data.messageSent.conversationId).toBe(
				val2.conversationId,
			);
			expect(val.value.data.messageSent.text).toBe(
				val2.text,
			);
		});
		
	});

	afterEach(async () => {
		await client.dispose();
		client.terminate();
	})

	afterAll(async () => {
		await prismaService.message.deleteMany({});
		await prismaService.conversation.deleteMany({});
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await app.close();
	});
});
