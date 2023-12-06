import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class User {
	@Field((type) => Int)
	id: number;

	@Field()
	createdAt: Date;

	@Field()
	name: string;
}

@ObjectType()
export class AuthentifiedUserToken {
	@Field()
	token: string;
}
