import {
	Args,
	Context,
	Mutation,
	Query,
	Resolver,
	Subscription,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { FriendRequestResponseInput } from '../dto/friendship.input';
import { User } from '../models/user.model';
import { AuthGuard } from '../../auth/auth.guards';
import { ContextValueType } from '../../configs/context';
import { Friendship } from '../models/friendship.model';
import { RedisPubSubEngineService } from '../../redis/redis.service';
import { FriendshipService } from '../services/friendship.service';

@Resolver((of) => Friendship)
export class FriendshipResolver {
	constructor(
		private friendshipService: FriendshipService,
		private pubSub: RedisPubSubEngineService,
	) {}

	@Query((returns) => [User])
	@UseGuards(AuthGuard)
	async myFriendList(
		@Context() contextValue: ContextValueType,
	): Promise<User[]> {
		return this.friendshipService.getFriendList(contextValue.user.id);
	}

	@Mutation((returns) => Friendship)
	@UseGuards(AuthGuard)
	async sendFriendRequest(
		@Context() contextValue: ContextValueType,
		@Args('friendId') friendId: number,
	): Promise<Friendship> {
		const friendShip = await this.friendshipService.createFriendship({
			userId: contextValue.user.id,
			friendId,
		});

		this.pubSub.publish('friend_request_sent', {
			friendRequestSent: friendShip,
		});

		return friendShip;
	}

	@Mutation((returns) => Boolean)
	@UseGuards(AuthGuard)
	async respondToFriendRequest(
		@Context() contextValue: ContextValueType,
		@Args('response') response: FriendRequestResponseInput,
	): Promise<boolean> {
		if (!response.accept) {
			await this.friendshipService.deleteFriendship(
				response.friendRequestId,
				contextValue.user.id,
			);
			return false;
		} else {
			// TODO: maybe subscription here
			await this.friendshipService.acceptFriendRequest(
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
		await this.friendshipService.deleteFriendship(
			friendshipId,
			contextValue.user.id,
		);
		return true;
	}

	@Subscription((returns) => Friendship)
	friendRequestSent(): AsyncIterator<Friendship> {
		return this.pubSub.asyncIterator('friend_request_sent');
	}
}