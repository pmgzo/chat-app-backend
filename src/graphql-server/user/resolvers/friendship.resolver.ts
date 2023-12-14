import {
	Args,
	Context,
	Int,
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
import { Friendship, FriendshipSubscription } from '../models/friendship.model';
import { RedisPubSubEngineService } from '../../../redis/redis.service';
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
		@Args('requesteeId') requesteeId: number,
	): Promise<Friendship> {
		const friendShip = await this.friendshipService.createFriendship({
			requesterId: contextValue.user.id,
			requesteeId,
		});

		this.pubSub.publish(FriendshipSubscription.FriendRequestSent, {
			friendRequestSent: friendShip,
		});

		// @ts-ignore (doesn't recognize prisma virtual fields)
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

	@Subscription((returns) => Friendship, {
		// ideally what do we want is to use the user's context value to get its id
		// that way, the user can only have access to its notification and not other's
		filter: (payload, variables, context) => {
			const { requesteeId } = variables;
			const { requesterId, peer } = payload.friendRequestSent;
			return (
				requesterId != requesteeId &&
				peer.some(({ friendId }) => friendId == requesteeId)
			);
		},
	})
	friendRequestSent(
		@Args('requesteeId', { type: () => Int }) requesteeId: number,
	): AsyncIterator<IteratorResult<Friendship>> {
		return this.pubSub.asyncIterator(FriendshipSubscription.FriendRequestSent);
	}
}
