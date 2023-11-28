import { Mutation, Query, Resolver, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Message } from './models/message.models';
import { MessageInput } from './dto/message.input';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guards';

@Resolver((of) => Message)
export class MessageResolver {
	constructor(private prisma: PrismaService) {}

	@Query((returns) => Message)
	@UseGuards(AuthGuard)
	async message(@Args('id') id: number): Promise<Message> {
		// check id ?

		return this.prisma.message.findUnique({
			where: {
				id: id,
			},
		});
	}

	@Query((returns) => [Message])
	@UseGuards(AuthGuard)
	async messages(
		@Args('senderId') senderId: number,
		@Args('receiverId') receiverId: number,
	): Promise<Message[]> {
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
	@UseGuards(AuthGuard)
	async sendMessage(
		@Args('messageInput') messageInput: MessageInput,
	): Promise<Message> {
		// check if senderId and receiverId exists
		// check if they are friend ?

		return this.prisma.message.create({
			data: {
				text: messageInput.text,
				senderId: messageInput.senderId,
				receiverId: messageInput.receiverId,
			},
		});
	}
}
