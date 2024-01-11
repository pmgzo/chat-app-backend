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
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guards';
import { Friendship } from '../../user/models/friendship.model';

@Resolver((of) => Conversation)
export class ConversationResolver {
	constructor(
		private convService: ConversationService,
		private messageService: MessageService,
	) {}

	@Query((returns) => Conversation)
	@UseGuards(AuthGuard)
	async conversation(
		@Context() ctx,
		@Args('id', { type: () => Int }) id: number,
	): Promise<Conversation> {
		return this.convService.getConversation(id, ctx.user.id);
	}

	@Query((returns) => [Conversation])
	@UseGuards(AuthGuard)
	async conversations(@Context() ctx: ContextValueType): Promise<Conversation[]> {
		return this.convService.getUserStartedConversations(ctx.user.id);
	}
	
	@Query((returns) => [Conversation])
	@UseGuards(AuthGuard)
	async unstartedConversations(@Context() ctx: ContextValueType): Promise<Conversation[]> {
		return this.convService.unstartedUserConversations(ctx.user.id);
	}

	@Query((returns) => [Friendship])
	@UseGuards(AuthGuard)
	async uncreatedConversations(@Context() ctx: ContextValueType): Promise<Friendship[]> {		
		return this.convService.uncreatedConversations(ctx.user.id);
	}

	@Mutation((returns) => Conversation)
	@UseGuards(AuthGuard)
	async createConversation(
		@Context() ctx,
		@Args('friendshipId', { type: () => Int }) friendshipId: number,
	): Promise<Conversation> {
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
		return this.convService.getPeerFromConversation(conversation.id, ctx.user.id);
	}
}
