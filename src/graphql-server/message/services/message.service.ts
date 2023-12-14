import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MessageService {
	constructor(private prismaService: PrismaService) {}

	async getMessages(
		conversationId: number,
		take: number | undefined,
		skip: number | undefined,
	): Promise<Message[]> {
		return this.prismaService.message.findMany({
			where: {
				conversationId,
			},
			orderBy: [{ createdAt: 'desc' }],
			take: take,
			skip: skip,
		});
	}

	async countMessages(conversationId: number) {
		return this.prismaService.message.count({ where: { conversationId } });
	}

	async createMessage(
		senderId: number,
		receiverId: number,
		conversationId: number,
		text: string,
	): Promise<Message> {
		return this.prismaService.message.create({
			data: {
				senderId,
				receiverId,
				conversationId,
				text,
			},
		});
	}
}
