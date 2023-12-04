import { Args, Context, Mutation, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { FriendRequestResponseInput } from './dto/friendship.input';
import { UserService } from './user.service';
import { User } from './models/user.models';
import { AuthGuard } from '../auth/auth.guards';
import { ContextValueType } from '../graphql-context';
import { Friendship } from './models/friendship.model';

export class FriendshipResolver {
	constructor(protected userService: UserService) {}

	@Query((returns) => [User])
	@UseGuards(AuthGuard)
	async myFriendList(
		@Context() contextValue: ContextValueType,
	): Promise<User[]> {
		return this.userService.getFriendList(contextValue.user.id);
	}

	@Mutation((returns) => User)
	@UseGuards(AuthGuard)
	async sendFriendRequest(
		@Context() contextValue: ContextValueType,
		@Args('friendId') friendId: number,
	): Promise<Friendship> {
		// TO DO: handle subscription
		const friend = await this.userService.createFriendship({
			userId: contextValue.user.id,
			friendId,
		});
		return friend;
	}

	@Mutation((returns) => Boolean)
	@UseGuards(AuthGuard)
	async respondToFriendRequest(
		@Context() contextValue: ContextValueType,
		@Args('response') response: FriendRequestResponseInput,
	): Promise<boolean> {
		if (!response.accept) {
			await this.userService.deleteFriendship(
				response.friendRequestId,
				contextValue.user.id,
			);
			return false
		} else {
			// TODO: maybe subscription here
			await this.userService.acceptFriendRequest(
				response.friendRequestId,
				contextValue.user.id,
			);
		}
		return true;
	}

	@Mutation((returns) => Boolean)
	@UseGuards(AuthGuard)
	async deleteFriendship(
		@Context() contextValue: ContextValueType,
		@Args('friendshipId') friendshipId: number,
	): Promise<boolean> {
		await this.userService.deleteFriendship(friendshipId, contextValue.user.id);
		return true;
	}
}
