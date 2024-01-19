import {
	Mutation,
	Query,
	Resolver,
	Args,
	Context,
	Subscription,
	Int,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Message, MessageSubscription } from '../models/message.models';
import { MessageInput, MessagesArgs } from '../dto/message.input';
import { AuthGuard } from '../../auth/auth.guards';
import { MessageService } from '../services/message.service';
import { RedisPubSubEngineService } from '../../../redis/redis.service';
import { GraphQLError } from 'graphql/error';
import { PermissionsService } from '../../../permissions/permissions.service';

@Resolver((of) => Message)
export class MessageResolver {
	constructor(
		private messageService: MessageService,
		private pubSub: RedisPubSubEngineService,
		private permissionService: PermissionsService,
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
		@Args() args: MessagesArgs,
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

		this.pubSub.publish(MessageSubscription.MessageSent, {
			messageSent: message,
		});

		return message;
	}

	@Subscription((returns) => Message, {
		filter: (payload, variables, ctx) => {
			const { conversationId: givenConvId } = variables;
			const givenReceiverId: number = ctx.req.extra.user.id;

			const { conversationId, receiverId } = payload.messageSent;
			return conversationId === givenConvId && receiverId === givenReceiverId;
		},
	})
	async messageSent(
		@Context() ctx,
		@Args('conversationId', { type: () => Int }) conversationId: number,
	): Promise<AsyncIterator<IteratorResult<Message>>> {
		return this.permissionService
			.haveAccessToThisConv(conversationId, ctx.req.extra.user.id)
			.then((result) => {
				if (!result) {
					throw new GraphQLError("Subscribe to other's events is forbidden", {
						extensions: { code: 'PERMISSIONS_ERROR', public: true },
					});
				}
				return this.pubSub.asyncIterator(MessageSubscription.MessageSent);
			});
	}
}
