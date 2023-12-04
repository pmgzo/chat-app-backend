import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Friendship {
	@Field((type) => Int)
	id: number;

	@Field((type) => Int)
	userId: number;

    @Field((type) => Int)
	friendId: number;

    @Field((type) => Boolean)
    pending: boolean
}