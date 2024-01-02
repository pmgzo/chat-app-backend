import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType()
export class Friend {
	@Field((type) => Int)
	id: number;

	@Field((type) => Int)
	friendId: number;

	@Field((type) => User)
	friend?: User;

	@Field((type) => Int)
	friendshipId: number;
}

@ObjectType()
export class Friendship {
	@Field((type) => Int, { nullable: true })
	id: number;

	@Field((type) => Int, { nullable: true })
	requesterId: number;

	@Field((type) => User, { nullable: true })
	requester: User;

	@Field((type) => User, { nullable: true })
	peer?: User;

	@Field((type) => Boolean, { nullable: true })
	pending: boolean;
}

export enum FriendshipSubscription {
	FriendRequestSent = 'friendRequestSent',
}
