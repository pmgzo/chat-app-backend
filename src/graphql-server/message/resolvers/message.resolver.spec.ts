import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { AUTH_CONFIG } from '../../auth/contants';
import { UserService } from '../../user/services/user.service';
import { FriendshipService } from '../../user/services/friendship.service';
import { User } from '@prisma/client';
import { UserModule } from '../../user/user.module';
import { MessageModule } from '../message.module';
import { ConversationService } from '../services/conversation.service';
import { MessageResolver } from './message.resolver';
import { ConversationResolver } from './conversation.resolver';

describe('Message Resolver', () => {
	let userService: UserService;
	let prismaService: PrismaService;
	let friendshipService: FriendshipService;
	let conversationService: ConversationService;

	let messageResolver: MessageResolver;
	let convResolver: ConversationResolver;

	// fixtures
	let kathy: User;
	let tom: User;

	let testingModule: TestingModule;

	beforeAll(async () => {
		testingModule = await Test.createTestingModule({
			providers: [
				{
					provide: AUTH_CONFIG,
					useValue: { tokenExpiresAfter: '1d' },
				},
			],
			imports: [MessageModule, UserModule],
		}).compile();

		userService = testingModule.get<UserService>(UserService);
		friendshipService = testingModule.get<FriendshipService>(FriendshipService);
		conversationService =
			testingModule.get<ConversationService>(ConversationService);
		prismaService = testingModule.get<PrismaService>(PrismaService);

		messageResolver = testingModule.get<MessageResolver>(MessageResolver);
		convResolver =
			testingModule.get<ConversationResolver>(ConversationResolver);

		kathy = await userService.createUser('Kathy', 'pssd');
		tom = await userService.createUser('Tom', 'pssd');
	});

	it('should be defined', () => {
		expect(userService).toBeDefined();
		expect(prismaService).toBeDefined();
		expect(friendshipService).toBeDefined();
		expect(conversationService).toBeDefined();
		expect(messageResolver).toBeDefined();
		expect(convResolver).toBeDefined();
	});

	it('testing create and get count messages', async () => {
		// init friendship
		const fReq = await friendshipService.createFriendship({
			requesterId: tom.id,
			requesteeId: kathy.id,
		});
		await friendshipService.acceptFriendRequest(fReq.id, kathy.id);

		// uses resolvers
		const conversation = await conversationService.createConversation(
			fReq.id,
			kathy.id,
		);

		const message1 = await messageResolver.sendMessage(
			{ user: kathy },
			{ text: 'hello', receiverId: tom.id, conversationId: conversation.id },
		);
		const message2 = await messageResolver.sendMessage(
			{ user: tom },
			{
				text: 'hi kathy',
				receiverId: kathy.id,
				conversationId: conversation.id,
			},
		);

		// conversation's field resolver
		const count = await convResolver.count(conversation);
		expect(count).toBe(2);
		const messages = await convResolver.messages(conversation, undefined);
		// desc order
		expect(messages[0]).toEqual(message2);
		expect(messages[1]).toEqual(message1);
	});

	// TODO: test with error handling

	afterAll(async () => {
		await prismaService.message.deleteMany({});
		await prismaService.conversation.deleteMany({});
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await testingModule.close();
	});
});
