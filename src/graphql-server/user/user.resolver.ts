import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { User as PrismaUser } from '@prisma/client';

import { UserCredentialsInput } from './dto/user.input';
import { AuthentifiedUserToken, User } from './models/user.models';
import { PrismaService } from '../../prisma/prisma.service';
import { getHash, generateSalt } from '../common/hash';
import { createJwt } from '../common/jwt';

@Resolver((of) => User)
export class UserResolver {
	constructor(private prisma: PrismaService) {}

	@Query((returns) => User)
	//   async user(@Ctx() context: Context, @Arg("name") name: string): Promise<User> {
	async user(@Args('name') name: string): Promise<User> {
		// await checkAccess({token: context.token})
		// // check if name exists ?

		return this.prisma.user.findUnique({
			where: {
				name: name,
			},
		});
	}

	@Query((returns) => [User])
	//   async users(@Ctx() context: Context): Promise<User[]> {
	async users(): Promise<User[]> {
		// await checkAccess({token: context.token})

		return this.prisma.user.findMany();
	}

	@Mutation((returns) => AuthentifiedUserToken)
	async createUser(
		@Args('credentials') credentials: UserCredentialsInput,
	): Promise<AuthentifiedUserToken> {
		// check if user name is not already taken
		const userAlreadyCreated = !!(await this.prisma.user.count({
			where: { name: credentials.name },
		}));
		if (userAlreadyCreated) {
			throw new GraphQLError('User name already exists', {
				extensions: { code: 'USERNAME_EXISTS' },
			});
		}
		const salt: string = generateSalt();
		// then create user
		const createdUser = await this.prisma.user.create({
			data: {
				name: credentials.name,
				salt,
				password: getHash({ password: credentials.password, salt }),
			},
		});

		const token = createJwt({ id: createdUser.id });
		return { token };
	}

	@Mutation((returns) => AuthentifiedUserToken)
	async login(
		@Args('credentials') credentials: UserCredentialsInput,
	): Promise<AuthentifiedUserToken> {
		// getUser from name
		const user: PrismaUser = await this.prisma.user.findUnique({
			where: { name: credentials.name },
		});
		// TODO: I have to handle the case where is not found
		const createdPassword: string = getHash({
			password: credentials.password,
			salt: user.salt,
		});
		// compare password
		if (createdPassword !== user.password) {
			throw new GraphQLError('Bad credentials', {
				extensions: { code: 'BAD_CREDENTIALS' },
			});
		}
		// create jwt
		const token = createJwt({ id: user.id });
		return { token };
	}
}
