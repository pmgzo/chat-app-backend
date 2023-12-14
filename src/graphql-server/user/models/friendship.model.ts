import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Friend {
	@Field((type) => Int)
	id: number;

	@Field((type) => Int)
	friendId: number;
}

@ObjectType()
export class Friendship {
	@Field((type) => Int)
	id: number;

	@Field((type) => Int)
	requesterId: number;

	@Field((type) => [Friend])
	peer: Friend[]

	@Field((type) => Boolean)
	pending: boolean;
}

export enum FriendshipSubscription {
	FriendRequestSent = 'friendRequestSent',
}
