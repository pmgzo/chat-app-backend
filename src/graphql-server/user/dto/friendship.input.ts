import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'Friend request input response' })
export class FriendRequestResponseInput {
	@Field()
	friendRequestId: number;

	@Field()
	accept: boolean;
}
