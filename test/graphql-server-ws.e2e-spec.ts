import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
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

describe('Graphql Subscription tests', () => {
	let app: INestApplication;
	let prismaService: PrismaService;
	let authService: AuthService;
    let userService: UserService;
	let userResolver: UserResolver;
	let friendshipResolver: FriendshipResolver
	let client: Client;

	let kathy: User;
	let mamadou: User;

	jest.useFakeTimers();

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: AUTH_CONFIG,
					useValue: { tokenExpiresAfter: '1d' },
				},
				// AuthService,
				// PrismaService,
                // UserService
			],
			imports: [GraphQLServerModule, PrismaModule],
		}).compile();

		app = moduleFixture.createNestApplication();

		await app.init();
		await app.listen(3000);
		//app.useWebSocketAdapter

		// setTimeout(() => {}, 3000).unref();


        // client = createClient({ webSocketImpl: WebSocket, on: { connected: (socket) => { console.log( "pipou")}, error: (e) => {
		// 	console.log(e)
		// 	console.log("error")
		// }}, url: "ws://localhost:3000/subscriptions" /*, connectionParams*/ })

        authService = moduleFixture.get<AuthService>(AuthService);
		prismaService = moduleFixture.get<PrismaService>(PrismaService);
        userService = moduleFixture.get<UserService>(UserService);
		friendshipResolver = moduleFixture.get<FriendshipResolver>(FriendshipResolver);

        kathy = await userService.createUser('Kathy', 'pssd');
		mamadou = await userService.createUser('Mamadou', 'pssd');

		// const tokenObj = await userResolver.login({ name: "Kathy", password: "pssd"})

	});

	it('test with user friend request', async () => {

        // const subscription = client.iterate({
        //     query: '{ friendRequestSent }'
        // })

        // const friendship = await friendshipResolver.sendFriendRequest({ user: kathy }, mamadou.id)

		// console.log(friendship)

        // const { value } = await subscription.next()
        // console.log(value)

		// client.terminate()
    });

    afterAll(async () => {
        await prismaService.friendship.deleteMany({})
		await prismaService.user.deleteMany({});
		await prismaService.$disconnect();
		await app.close();
	});
});
