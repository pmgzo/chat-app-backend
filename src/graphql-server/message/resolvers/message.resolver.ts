import { Mutation, Query, Resolver, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Conversation, Message } from '../models/message.models';
import { MessageInput, MessagesArgs } from '../dto/message.input';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthGuard } from '../../auth/auth.guards';
import { FriendshipService } from '../../user/services/friendship.service';
import { UserService } from '../../user/services/user.service';
import { GraphQLError } from 'graphql';
import { MessageService } from '../services/message.service';

@Resolver((of) => Message)
export class MessageResolver {
	constructor(
		private prisma: PrismaService,
		private messageService: MessageService,
	) {}

	// private async userExists(id: number): Promise<void> {
	// 	if (!(await this.userService.userExists({ id }))) {
	// 		throw new GraphQLError(`User with id ${id}, doesn't exist`, {
	// 			extensions: { code: 'INTERNAL_SERVER_ERROR', public: true },
	// 		});
	// 	}
	// }

	// private async areFriends(userId: number, friendId: number): Promise<void> {
	// 	if (!(await this.friendshipService.areFriends(userId, friendId))) {
	// 		throw new GraphQLError(`You are not friend with this user ${friendId}`, {
	// 			extensions: { code: 'INTERNAL_SERVER_ERROR', public: true },
	// 		});
	// 	}
	// }

	@Query((returns) => [Message])
	@UseGuards(AuthGuard)
	async messages(
		@Context() ctx,
		@Args('args', { type: () => MessagesArgs }) args: MessagesArgs,
	): Promise<Message[]> {
		// checks
		// await this.userExists(friendId);
		// await this.areFriends(ctx.user.id, friendId);

		const { conversationId, take, skip } = args;
		return this.messageService.getMessages(conversationId, take, skip);
	}

	@Mutation((returns) => Message)
	@UseGuards(AuthGuard)
	async sendMessage(
		@Context() ctx,
		@Args('messageInput') messageInput: MessageInput,
	): Promise<Message> {
		// // checks
		// await this.userExists(messageInput.receiverId);
		// await this.areFriends(ctx.user.id, messageInput.receiverId);

		const { conversationId, receiverId, text } = messageInput;

		const message = await this.messageService.createMessage(
			ctx.user.id,
			receiverId,
			conversationId,
			text,
		);

		// TODO: subscriptions

		return message;
	}
}
