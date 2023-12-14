import { Friendship, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FriendshipService {
	constructor(private prismaService: PrismaService) {}

	async createFriendship({
		requesterId,
		requesteeId,
	}: {
		requesterId: number;
		requesteeId: number;
	}): Promise<Friendship> {
		return this.prismaService.friendship.create({
			data: {
				pending: true,
				peer: {
					create: [
						{
							friend: {
								connect: {
									id: requesterId,
								},
							},
						},
						{
							friend: {
								connect: {
									id: requesteeId,
								},
							},
						},
					],
				},
				requester: {
					connect: {
						id: requesterId,
					},
				},
			},
			select: {
				id: true,
				pending: true,
				requesterId: true,
				peer: true,
			},
		});
	}

	async deleteFriendship(friendRequestId: number, deleterId: number) {
		await this.prismaService.friendship.delete({
			where: {
				id: friendRequestId,
				AND: { peer: { some: { friendId: deleterId } } },
			},
		});
	}

	async acceptFriendRequest(
		friendRequestId: number,
		accepterId: number,
	): Promise<Friendship> {
		return this.prismaService.friendship.update({
			data: {
				pending: false,
			},
			where: {
				id: friendRequestId,
				AND: {
					peer: {
						some: { friendId: accepterId },
					},
				},
			},
		});
	}

	async getFriendList(userId: number): Promise<User[]> {
		return this.prismaService.user.findMany({
			where: {
				NOT: { id: userId },
				friends: {
					some: {
						friendship: {
							peer: { some: { friendId: userId } },
						},
					},
				},
			},
		});
	}

	// async areFriends(userId: number, friendId: number): Promise<boolean> {
	// 	return !!(await this.prismaService.friendship.count({
	// 		where: {
	// 			OR: [
	// 				{ userId, friendId },
	// 				{ userId: friendId, friendId: userId },
	// 			],
	// 		},
	// 	}));
	// }
}
