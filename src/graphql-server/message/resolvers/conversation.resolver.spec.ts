import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { AUTH_CONFIG } from '../../auth/contants';
import { UserService } from '../../user/services/user.service';
import { FriendshipService } from '../../user/services/friendship.service';
import { User } from '@prisma/client';
import { UserModule } from '../../user/user.module';
import { MessageModule } from '../message.module';
import { ConversationResolver } from './conversation.resolver';

describe('Conversation Resolver', () => {
	let userService: UserService;
	let prismaService: PrismaService;
	let friendshipService: FriendshipService;

	let convResolver: ConversationResolver;

	// fixtures
	let kathy: User;
	let mamadou: User;
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
		prismaService = testingModule.get<PrismaService>(PrismaService);

		convResolver =
			testingModule.get<ConversationResolver>(ConversationResolver);

		kathy = await userService.createUser('Kathy', 'pssd');
		mamadou = await userService.createUser('Mamadou', 'pssd');
		tom = await userService.createUser('Tom', 'pssd');
	});

	it('should be defined', () => {
		expect(prismaService).toBeDefined();
		expect(friendshipService).toBeDefined();
		expect(convResolver).toBeDefined();
	});

	it('testing create and get conversation', async () => {
		// init friendship
		const fReq = await friendshipService.createFriendship({
			requesterId: tom.id,
			requesteeId: kathy.id,
		});
		await friendshipService.acceptFriendRequest(fReq.id, kathy.id);

		// uses resolvers
		const conversation = await convResolver.createConversation(
			{ user: kathy },
			fReq.id,
		);
		const gotConv = await convResolver.conversation(
			{ user: tom },
			conversation.id,
		);
		expect(conversation.id).toEqual(gotConv.id);
	});

	// TODO: test with error handling

	afterAll(async () => {
		await prismaService.conversation.deleteMany({});
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await testingModule.close();
	});
});
