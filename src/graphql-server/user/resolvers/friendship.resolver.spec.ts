import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { AUTH_CONFIG } from '../../auth/contants';
import { UserService } from '../services/user.service';
import { User } from '@prisma/client';
import { FriendshipResolver } from './friendship.resolver';
import { UserModule } from '../user.module';
import { ConversationResolver } from '../../message/resolvers/conversation.resolver';
import { MessageResolver } from '../../message/resolvers/message.resolver';
import { MessageModule } from '../../message/message.module';

describe('Friendship Resolver', () => {
	let friendshipResolver: FriendshipResolver;
	let userService: UserService;
	let prismaService: PrismaService;
	let authService: AuthService;

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
				AuthService,
				PrismaService,
			],
			imports: [UserModule, MessageModule],
		}).compile();

		userService = testingModule.get<UserService>(UserService);
		prismaService = testingModule.get<PrismaService>(PrismaService);
		authService = testingModule.get<AuthService>(AuthService);
		friendshipResolver =
			testingModule.get<FriendshipResolver>(FriendshipResolver);

		kathy = await userService.createUser('Kathy', 'pssd');
		mamadou = await userService.createUser('Mamadou', 'pssd');
		tom = await userService.createUser('Tom', 'pssd');

		authService.verifyToken = jest.fn().mockReturnValue(true);
	});

	it('should be defined', () => {
		expect(prismaService).toBeDefined();
		expect(authService).toBeDefined();
		expect(friendshipResolver).toBeDefined();
	});

	it('accept/refuse friendship', async () => {
		const friendshipReq = await friendshipResolver.sendFriendRequest(
			{ user: kathy },
			tom.id,
		);
		const friendshipReq2 = await friendshipResolver.sendFriendRequest(
			{ user: kathy },
			mamadou.id,
		);

		expect(friendshipReq.requesterId).toEqual(kathy.id);
		expect(friendshipReq2.requesterId).toEqual(kathy.id);

		// reject
		await friendshipResolver.respondToFriendRequest(
			{ user: tom },
			{ friendRequestId: friendshipReq.id, accept: false },
		);
		// accept
		await friendshipResolver.respondToFriendRequest(
			{ user: mamadou },
			{ friendRequestId: friendshipReq2.id, accept: true },
		);

		// friendList of Kathy
		let friendList = await friendshipResolver.myFriendList({ user: kathy });

		expect(friendList[0].friend.id).toEqual(mamadou.id);
		expect(friendList).toHaveLength(1);

		// friendList of Mamadou
		friendList = await friendshipResolver.myFriendList({ user: mamadou });
		expect(friendList[0].friend.id).toEqual(kathy.id);
		expect(friendList).toHaveLength(1);

		// friendList of Tom
		friendList = await friendshipResolver.myFriendList({ user: tom });
		expect(friendList).toHaveLength(0);
	});

	it('delete friendship whith conversation and messages created (tesing delete on cascade)', async () => {
		const friendshipReq = await friendshipResolver.sendFriendRequest(
			{ user: kathy },
			tom.id,
		);

		expect(friendshipReq.requesterId).toEqual(kathy.id);

		// reject
		await friendshipResolver.respondToFriendRequest(
			{ user: tom },
			{ friendRequestId: friendshipReq.id, accept: true },
		);

		const conversationResolver =
			testingModule.get<ConversationResolver>(ConversationResolver);
		const messageResolver = testingModule.get<MessageResolver>(MessageResolver);

		const conv = await conversationResolver.createConversation(
			{ user: kathy },
			friendshipReq.id,
		);
		await messageResolver.sendMessage(
			{ user: kathy },
			{ text: 'Hi', receiverId: tom.id, conversationId: conv.id },
		);

		await friendshipResolver.deleteFriendship({ user: tom }, friendshipReq.id);

		// friendList of Kathy
		let friendList = await friendshipResolver.myFriendList({ user: tom });

		expect(friendList).toHaveLength(0);
	});

	afterAll(async () => {
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await testingModule.close();
	});
});
