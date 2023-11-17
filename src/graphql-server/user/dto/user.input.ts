import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: "User's credentials" })
export class UserCredentialsInput {
	@Field()
	name: string;

	@Field()
	password: string;
}
