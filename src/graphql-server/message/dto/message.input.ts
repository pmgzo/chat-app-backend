import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Input message' })
export class MessageInput {
	@Field()
	text: string;

	@Field((type) => Int)
	receiverId: number;

	@Field((type) => Int)
	conversationId: number;
}

@ArgsType()
export class PaginationMessagesArgs {
	@Field((type) => Int, { nullable: true })
	take: number;

	@Field((type) => Int, { nullable: true })
	skip: number;
}

@ArgsType()
export class MessagesArgs extends PaginationMessagesArgs {
	@Field((type) => Int)
	conversationId: number;
}

@ArgsType()
export class MessageSubscriptionArgs {
	@Field((type) => Int)
	conversationId: number;

	@Field((type) => Int)
	receiverId: number;
}
