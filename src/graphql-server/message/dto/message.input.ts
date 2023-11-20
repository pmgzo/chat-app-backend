import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'Input message' })
export class MessageInput {
	@Field()
	text: string;

	@Field()
	senderId: number;

	@Field()
	receiverId: number;
}
