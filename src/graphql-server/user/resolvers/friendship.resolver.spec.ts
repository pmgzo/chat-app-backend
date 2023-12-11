import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { AUTH_CONFIG } from '../../auth/contants';
import { UserService } from '../services/user.service';
import { User } from '@prisma/client';
import { FriendshipResolver } from './friendship.resolver';
import { UserModule } from '../user.module';

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
			imports: [UserModule],
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
		const friendShipReq = await friendshipResolver.sendFriendRequest(
			{ user: kathy },
			tom.id,
		);
		const friendShipReq2 = await friendshipResolver.sendFriendRequest(
			{ user: kathy },
			mamadou.id,
		);

		// reject
		await friendshipResolver.respondToFriendRequest(
			{ user: tom },
			{ friendRequestId: friendShipReq.id, accept: false },
		);
		// accept
		await friendshipResolver.respondToFriendRequest(
			{ user: mamadou },
			{ friendRequestId: friendShipReq2.id, accept: true },
		);

		// friendList of Kathy
		let friendList = await friendshipResolver.myFriendList({ user: kathy });
		expect(friendList).toEqual(expect.arrayContaining([mamadou]));
		// friendList of Mamadou
		friendList = await friendshipResolver.myFriendList({ user: mamadou });
		expect(friendList).toEqual(expect.arrayContaining([kathy]));
		// friendList of Tom
		friendList = await friendshipResolver.myFriendList({ user: tom });
		expect(friendList).toHaveLength(0);
	});

	it('test friendshipRequestSent subscription', async () => {
		const asyncIterator = friendshipResolver.friendRequestSent(tom.id);

		await Promise.all([
			friendshipResolver.sendFriendRequest({ user: mamadou }, tom.id),
			asyncIterator.next(),
		]).then(([triggeredFuncRes, itRes]) => {
			expect(triggeredFuncRes.id).toBe(itRes.value.friendRequestSent.id);
		});
	});

	afterAll(async () => {
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await testingModule.close();
	});
});
