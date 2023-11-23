import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResolver } from './user.resolver';
import { UserCredentialsInput } from './dto/user.input';

jest.mock('../common/jwt', () => {
	const originalModule = jest.requireActual('../common/jwt');

	return {
		__esModule: true,
		...originalModule,
		createJwt: jest.fn(({ id }: { id: number }) => 'fakeToken'),
	};
});

describe('UserResolver', () => {
	let userResolver: UserResolver;
	let prismaService: PrismaService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			providers: [UserResolver, PrismaService],
		}).compile();
		userResolver = module.get<UserResolver>(UserResolver);
		prismaService = module.get<PrismaService>(PrismaService);
	});

	it('should be defined', () => {
		expect(userResolver).toBeDefined();
		expect(prismaService).toBeDefined();
	});

	it('create and login', async () => {
		const userCredentials: UserCredentialsInput = {
			name: 'user1',
			password: 'toto',
		};

		const token1 = await userResolver.createUser(userCredentials); //.then(e => expect())

		expect(token1.token).toEqual('fakeToken');

		const token2 = await userResolver.login(userCredentials);

		expect(token2.token).toEqual('fakeToken');
	});

	afterAll(async () => {
		// delete
		await prismaService.user.deleteMany({});
		await prismaService.$disconnect();
	});
});
