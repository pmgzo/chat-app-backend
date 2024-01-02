import { Conversation, Message } from '../models/message.models';
import {
	Args,
	Context,
	Int,
	Mutation,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import { ConversationService } from '../services/conversation.service';
import { MessageService } from '../services/message.service';
import { PaginationMessagesArgs } from '../dto/message.input';
import { User } from '../../user/models/user.model';
import { ContextValueType } from '../../configs/context';

@Resolver((of) => Conversation)
export class ConversationResolver {
	constructor(
		private convService: ConversationService,
		private messageService: MessageService,
	) {}

	@Query((returns) => Conversation)
	async conversation(
		@Context() ctx,
		@Args('id', { type: () => Int }) id: number,
	): Promise<Conversation> {
		// @ts-ignore (can't recognize field resolvers)
		return this.convService.getConversation(id, ctx.user.id);
	}

	@Mutation((returns) => Conversation)
	async createConversation(
		@Context() ctx,
		@Args('friendshipId', { type: () => Int }) friendshipId: number,
	): Promise<Conversation> {
		// @ts-ignore (can't recognize field resolvers)
		return this.convService.createConversation(friendshipId, ctx.user.id);
	}

	@ResolveField((returns) => [Message])
	async messages(
		@Parent() conversation: Conversation,
		@Args({ nullable: true })
		args: PaginationMessagesArgs | null,
	): Promise<Message[]> {
		const { take, skip } = args || { take: undefined, skip: undefined };
		return this.messageService.getMessages(conversation.id, take, skip);
	}

	@ResolveField((returns) => Int)
	async count(@Parent() conversation: Conversation): Promise<number> {
		return this.messageService.countMessages(conversation.id);
	}

	@ResolveField((returns) => User)
	async peer(@Parent() conversation: Conversation, @Context() ctx: ContextValueType): Promise<User> {
		return this.convService.getPeerFromConversation(conversation.id, ctx.user.id)
	}
}
