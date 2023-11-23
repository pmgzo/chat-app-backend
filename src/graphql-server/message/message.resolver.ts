import { Mutation, Query, Resolver, Args } from '@nestjs/graphql';
import { Message } from './models/message.models';
import { MessageInput } from './dto/message.input';
import { PrismaService } from '../../prisma/prisma.service';

@Resolver((of) => Message)
export class MessageResolver {
	constructor(private prisma: PrismaService) {}

	@Query((returns) => Message)
	async message(@Args('id') id: number): Promise<Message> {
		//await checkAccess({token: context.token})

		// check id ?
		return this.prisma.message.findUnique({
			where: {
				id: id,
			},
		});
	}

	@Query((returns) => [Message])
	async messages(
		//@Ctx() context: Context,
		@Args('senderId') senderId: number,
		@Args('receiverId') receiverId: number,
	): Promise<Message[]> {
		//await checkAccess({ token: context.token });

		// if ids exists ?
		// check if they are friends

		return this.prisma.message.findMany({
			where: {
				senderId: senderId,
				receiverId: receiverId,
			},
		});
	}

	@Mutation((returns) => Message)
	async sendMessage(
		@Args('messageInput') messageInput: MessageInput,
	): Promise<Message> {
		// check if senderId and receiverId exists
		// check if they are friend ?

		// then create message
		return this.prisma.message.create({
			data: {
				text: messageInput.text,
				senderId: messageInput.senderId,
				receiverId: messageInput.receiverId,
			},
		});
	}
}
