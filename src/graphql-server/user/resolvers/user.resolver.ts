import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { UseGuards } from '@nestjs/common';

import { UserCredentialsInput } from '../dto/user.input';
import { UserService } from '../services/user.service';
import { AuthentifiedUserToken, User } from '../models/user.model';
import { AuthGuard } from '../../auth/auth.guards';
import { AuthService } from '../../auth/auth.service';

@Resolver((of) => User)
export class UserResolver {
	constructor(
		private userService: UserService,
		private authService: AuthService,
	) {}

	@Query((returns) => User)
	@UseGuards(AuthGuard)
	async user(@Args('name') name: string): Promise<User> {
		return this.userService.findUser(name);
	}

	@Query((returns) => [User])
	@UseGuards(AuthGuard)
	async users(): Promise<User[]> {
		return this.userService.findUsers();
	}

	@Mutation((returns) => AuthentifiedUserToken)
	async createUser(
		@Args('credentials') credentials: UserCredentialsInput,
	): Promise<AuthentifiedUserToken> {
		const userAlreadyCreated = await this.userService.userExists(
			credentials.name,
		);

		if (userAlreadyCreated) {
			throw new GraphQLError('User name already exists', {
				extensions: { code: 'USERNAME_EXISTS' },
			});
		}

		const user = await this.userService.createUser(
			credentials.name,
			credentials.password,
		);

		const token = this.authService.createJwt({ id: user.id, name: user.name });
		return { token };
	}

	@Mutation((returns) => AuthentifiedUserToken)
	async login(
		@Args('credentials') credentials: UserCredentialsInput,
	): Promise<AuthentifiedUserToken> {
		const user = await this.userService.verifyCredentials(
			credentials.name,
			credentials.password,
		);

		// TODO: case where wrong credentials: have to return wrong username or username, credentials
		const token = this.authService.createJwt({ id: user.id, name: user.name });

		return { token };
	}
}
