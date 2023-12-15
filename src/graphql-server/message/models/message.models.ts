import { ObjectType, Field, Int } from '@nestjs/graphql';

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
}

export enum MessageSubscription {
	MessageSent = 'messageSent',
}
