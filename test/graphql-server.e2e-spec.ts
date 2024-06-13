import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { User } from '@prisma/client';
import * as request from 'supertest';
import { GraphQLServerModule } from '../src/graphql-server/graphql-server.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/graphql-server/auth/auth.service';
import { AUTH_CONFIG } from '../src/graphql-server/auth/contants';
import { RedisModule } from '../src/redis/redis.module';
import { FriendshipService } from '../src/graphql-server/user/services/friendship.service';
import { UserResolver } from '../src/graphql-server/user/resolvers/user.resolver';
import { UserService } from '../src/graphql-server/user/services/user.service';
import { ConversationService } from '../src/graphql-server/message/services/conversation.service';
import { MessageResolver } from '../src/graphql-server/message/resolvers/message.resolver';

describe('GraphQLServer (e2e)', () => {
	let moduleFixture: TestingModule;
	let app: INestApplication;
	let prismaService: PrismaService;
	const gqlEnpoint = '/graphql';
	let authService: AuthService;

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

		authService = moduleFixture.get<AuthService>(AuthService);
		prismaService = moduleFixture.get<PrismaService>(PrismaService);
	});

	it('should be defined', () => {
		expect(authService).toBeDefined();
		expect(prismaService).toBeDefined();
	});

	it('create user', () => {
		authService.createJwt = jest
			.fn()
			.mockImplementation(authService.createJwt)
			.mockReturnValueOnce('fakeToken');

		const mutationData = {
			query: `
			mutation createUserMutation($credentials: UserCredentialsInput!) {
				createUser(credentials: $credentials) {
					token
				}
			}
			`,
			operationName: 'createUserMutation',
			variables: { credentials: { name: 'user2', password: 'pssd' } },
		};

		return request(app.getHttpServer())
			.post(gqlEnpoint)
			.set('Apollo-Require-Preflight', 'true')
			.send(mutationData)
			.expect(200)
			.expect((res) => {
				expect(res.body.data.createUser.token).toEqual('fakeToken');
			});
	});

	it('Error masking from db error at login', () => {
		const fakeUserName = 'fakeUserName';

		const queryData = {
			query: `
			mutation Login($credentials: UserCredentialsInput!) {
				login(credentials: $credentials) {
					token
				}
			}
			`,
			operationName: 'Login',
			variables: {
				credentials: { name: fakeUserName, password: 'password' },
			},
		};

		return request(app.getHttpServer())
			.post(gqlEnpoint)
			.set('Apollo-Require-Preflight', 'true')
			.send(queryData)
			.expect(200)
			.expect((res) => {
				expect(res.body.errors[0].message).toBe(
					'Wrong username or password provided',
				);
				expect(res.body.errors[0].extensions.code).toBe('AUTHENTICATION_ERROR');
			});
	});

	it('test error masking with requesting unexisting user', () => {
		authService.verifyToken = jest
			.fn()
			.mockImplementation(authService.verifyToken)
			.mockReturnValueOnce(true);

		const fakeUsername = 'john';
		const queryData = {
			query: `
			query queryUser($name: String!) {
				user(name: $name) {
					name
				}
			}
			`,
			operationName: 'queryUser',
			variables: { name: fakeUsername },
		};

		return request(app.getHttpServer())
			.post(gqlEnpoint)
			.set('Apollo-Require-Preflight', 'true')
			.set('Authorization', 'Bearer wrongToken')
			.send(queryData)
			.expect(200)
			.expect((res) => {
				expect(res.body.errors[0]).toEqual({
					message: 'Internal Server Error',
					path: ['user'],
					extensions: { code: 'INTERNAL_SERVER_ERROR' },
				});
			});
	});

	describe('test with messagen with some specific fixtures', () => {
		let userResolver: UserResolver;
		let messageResolver: MessageResolver;

		let userService: UserService;
		let friendshipService: FriendshipService;
		let conversationService: ConversationService;

		let kathy: User;
		let tom: User;

		beforeAll(async () => {
			userResolver = moduleFixture.get<UserResolver>(UserResolver);
			messageResolver = moduleFixture.get<MessageResolver>(MessageResolver);

			userService = moduleFixture.get<UserService>(UserService);
			friendshipService =
				moduleFixture.get<FriendshipService>(FriendshipService);
			conversationService =
				moduleFixture.get<ConversationService>(ConversationService);

			// scenario:
			kathy = await userService.createUser('Kathy', 'pssd');
			tom = await userService.createUser('Tom', 'pssd');
		});

		it('test query with field resolver', async () => {
			// create friendship
			const fReq = await friendshipService.createFriendship({
				requesterId: tom.id,
				requesteeId: kathy.id,
			});
			await friendshipService.acceptFriendRequest(fReq.id, kathy.id);

			// create conversation
			const conversation = await conversationService.createConversation(
				fReq.id,
				kathy.id,
			);

			// send message
			const message = await messageResolver.sendMessage(
				{ user: kathy },
				{
					text: 'hello',
					receiverId: tom.id,
					conversationId: conversation.id,
				},
			);

			const tokenObj = await userResolver.login({
				name: 'Kathy',
				password: 'pssd',
			});

			// then query in a e2e way
			const queryData = {
				query: `
				query Conversation($id: Int!) {
					conversation(id: $id) {
						id
						messages {
							id
						}
					}
				}
				`,
				operationName: 'Conversation',
				variables: { id: conversation.id },
			};

			return request(app.getHttpServer())
				.post(gqlEnpoint)
				.set('Apollo-Require-Preflight', 'true')
				.set('Authorization', `Bearer ${tokenObj.token}`)
				.send(queryData)
				.expect(200)
				.expect((res) => {
					expect(res.body.data.conversation.messages[0].id).toEqual(message.id);
					expect(res.body.data.conversation.id).toEqual(conversation.id);
				});
		});
	});
	afterAll(async () => {
		await prismaService.message.deleteMany({});
		await prismaService.conversation.deleteMany({});
		await prismaService.friendship.deleteMany({});
		await prismaService.user.deleteMany({});
		await app.close();
	});
});
