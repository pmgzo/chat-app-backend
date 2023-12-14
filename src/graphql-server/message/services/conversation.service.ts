import { Injectable } from '@nestjs/common';
import { Conversation } from '@prisma/client';
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
}
