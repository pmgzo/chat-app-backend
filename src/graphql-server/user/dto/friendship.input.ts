import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Friend request input response' })
export class FriendRequestResponseInput {
	@Field((type) => Int)
	friendRequestId: number;

	@Field()
	accept: boolean;
}
