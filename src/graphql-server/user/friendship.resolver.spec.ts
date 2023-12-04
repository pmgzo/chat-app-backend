import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResolver } from './user.resolver';
import { UserCredentialsInput } from './dto/user.input';
import { AuthService } from '../auth/auth.service';
import { AUTH_CONFIG } from '../auth/contants';
import { UserService } from './user.service';
import { User } from '@prisma/client';

describe('UserResolver (Friendship)', () => {
	let userResolver: UserResolver;
	let userService: UserService;
	let prismaService: PrismaService;
	let authService: AuthService;

    // fixtures
    let kathy: User;
    let mamadou: User;
    let tom: User;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			providers: [
				{
					provide: AUTH_CONFIG,
					useValue: { tokenExpiresAfter: '1d' },
				},
				AuthService,
				UserResolver,
				UserService,
				PrismaService,
			],
		}).compile();
		userResolver = module.get<UserResolver>(UserResolver);
		userService = module.get<UserService>(UserService);

		prismaService = module.get<PrismaService>(PrismaService);
		authService = module.get<AuthService>(AuthService);

        kathy = await userService.createUser('Kathy', 'pssd');
        mamadou = await userService.createUser('Mamadou', 'pssd');
		tom = await userService.createUser('Tom', 'pssd');

        authService.verifyToken = jest.fn().mockReturnValue(true)

	});

	it('should be defined', () => {
		expect(userResolver).toBeDefined();
		expect(prismaService).toBeDefined();
		expect(authService).toBeDefined();
	});

	it('accept/refuse friendship', async () => {
		const friendShipReq = await userResolver.sendFriendRequest({user: kathy}, tom.id)
        const friendShipReq2 = await userResolver.sendFriendRequest({user: kathy}, mamadou.id)

        // reject
        await userResolver.respondToFriendRequest({user: tom}, {friendRequestId: friendShipReq.id, accept: false});
        // accept
        await userResolver.respondToFriendRequest({user: mamadou}, {friendRequestId: friendShipReq2.id, accept: true});
        
        // friendList of Kathy
        let friendList = await userResolver.myFriendList({ user: kathy })
        expect(friendList).toEqual(expect.arrayContaining([mamadou]))
        // friendList of Mamadou
        friendList = await userResolver.myFriendList({ user: mamadou })
        expect(friendList).toEqual(expect.arrayContaining([kathy]))
        // friendList of Tom
        friendList = await userResolver.myFriendList({ user: tom })
        expect(friendList).toHaveLength(0)
	});

	afterAll(async () => {
        await prismaService.friendship.deleteMany({});
        await prismaService.user.deleteMany({});
		await prismaService.$disconnect();
	});
});
