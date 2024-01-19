import { Injectable } from '@nestjs/common';
import { Conversation, User, Friendship, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ConversationService {
	constructor(private prismaService: PrismaService) {}

	async createConversation(
		friendshipId: number,
		creatorId: number,
	): Promise<Conversation> {
		return this.prismaService.conversation.create({
			data: {
				// friendshipId, // simpler but doesn't check the rights
				friendship: {
					connect: {
						id: friendshipId,
						pending: false, // need the friendship to be accepted
						peer: {
							some: { friendId: creatorId },
						},
					},
				},
			},
		});
	}

	async getConversation(
		conversationId: number,
		askerId: number,
	): Promise<Conversation> {
		return this.prismaService.conversation.findUnique({
			where: {
				id: conversationId,
				friendship: {
					peer: {
						some: { friendId: askerId },
					},
				},
			},
		});
	}

	async getUserStartedConversations(userId: number): Promise<Conversation[]> {
		return this.prismaService.conversation
			.findMany({
				where: {
					friendship: {
						peer: { some: { friendId: userId } },
					},
				},
				include: {
					messages: true,
				},
			})
			.then((conversations) => {
				return conversations.filter(
					(conversation) => conversation.messages.length,
				);
			});
	}

	async getPeerFromConversation(
		conversationId: number,
		userId: number,
	): Promise<User | undefined> {
		return this.prismaService.user.findFirst({
			where: {
				id: { not: userId },
				friends: {
					some: {
						friendship: {
							peer: { some: { friendId: userId } },
							conversation: {
								id: conversationId,
							},
						},
					},
				},
			},
		});
	}

	async uncreatedConversations(userId: number): Promise<Friendship[]> {
		return this.prismaService.friendship.findMany({
			where: {
				peer: { some: { friendId: userId } },
				pending: false,
				conversation: null,
			},
		});
	}

	async unstartedUserConversations(
		userId: number,
	): Promise<Prisma.ConversationGetPayload<{ include: { messages: true } }>[]> {
		return this.prismaService.conversation
			.findMany({
				where: {
					friendship: {
						peer: { some: { friendId: userId } },
					},
				},
				include: {
					messages: true,
				},
			})
			.then((conversations) => {
				return conversations.filter(
					(conversation) => conversation.messages.length === 0,
				);
			});
	}
}
