import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
	constructor(private prisma: PrismaService) {}

	async haveAccessToThisConv(
		conversationId: number,
		requesterId: number,
	): Promise<boolean> {
		const result = await this.prisma.conversation.findFirst({
			where: {
				id: conversationId,
				friendship: {
					peer: { some: { friendId: requesterId } },
				},
			},
		});
		return !!result;
	}
}
