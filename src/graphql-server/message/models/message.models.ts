import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';

@ObjectType()
export class Message {
	@Field((type) => Int)
	id: number;

	@Field()
	createdAt: Date;

	@Field()
	text: string;

	@Field((type) => Int)
	senderId: number;

	@Field((type) => Int)
	receiverId: number;

	@Field((type) => Int)
	conversationId: number;
}

@ObjectType()
export class Conversation {
	@Field((type) => Int)
	id: number;

	@Field((type) => Int)
	friendshipId: number;

	@Field((type) => [Message])
	messages: Message[];

	@Field((type) => Int)
	count: number;

	@Field((type) => User)
	peer?: User;
}

export enum MessageSubscription {
	MessageSent = 'messageSent',
}
