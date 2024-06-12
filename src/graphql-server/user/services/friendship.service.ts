import { Friendship, Prisma, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class FriendshipService {
	constructor(@Inject(PrismaService) private prismaService: PrismaService) {}

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

	async getFriendList(
		userId: number,
	): Promise<Prisma.FriendGetPayload<{ include: { friend: true } }>[]> {
		return this.prismaService.friend.findMany({
			where: {
				friendId: { not: userId },
				friendship: {
					peer: { some: { friendId: userId } },
					pending: false,
				},
			},
			include: {
				friend: true,
			},
		});
	}

	async getSuggestions(userId: number): Promise<User[]> {
		return this.prismaService.user.findMany({
			where: {
				NOT: { id: userId },
				friends: {
					every: {
						friendship: {
							peer: { every: { friendId: { not: userId } } },
						},
					},
				},
			},
			// order most recent ones
			orderBy: [{ createdAt: 'desc' }],
		});
	}

	async unrespondedFriendRequest(userId: number): Promise<Friendship[]> {
		return this.prismaService.friendship.findMany({
			where: {
				requesterId: userId,
				pending: true,
			},
		});
	}

	async getFriendRequests(
		userId: number,
	): Promise<Prisma.FriendshipGetPayload<{ include: { requester: true } }>[]> {
		return this.prismaService.friendship.findMany({
			where: {
				requesterId: { not: userId },
				peer: { some: { friendId: userId } },
				pending: true,
			},
			include: {
				requester: true,
			},
		});
	}

	async getPeerFromFriendship(
		friendshipId: number,
		userId: number,
	): Promise<User | undefined> {
		return this.prismaService.user.findFirst({
			where: {
				id: { not: userId },
				friends: {
					some: {
						friendshipId,
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
