import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Message {
	@Field((type) => Int)
	id: number;

	@Field()
	text: string;

	@Field()
	createdAt: Date;

	@Field()
	senderId: number;

	@Field()
	receiverId: number;
}
