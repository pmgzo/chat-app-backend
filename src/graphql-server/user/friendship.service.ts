import { Friendship, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export class FriendshipService {
	constructor(protected prismaService: PrismaService) {}

	async createFriendship({
		userId,
		friendId,
	}: {
		userId: number;
		friendId: number;
	}): Promise<Friendship> {
		const friend = await this.prismaService.user.findUnique({
			where: {
				id: friendId,
			},
		});

		if (!friend) {
			throw new Error("User doesn't exist");
		}

		return this.prismaService.friendship.create({
			data: {
				userId,
				friendId,
				pending: true,
			},
		});
	}

	async deleteFriendship(friendRequestId: number, userId: number) {
		this.prismaService.friendship.delete({
			where: {
				id: friendRequestId,
				OR: [{ friendId: userId }, { userId: userId }],
			},
		});
	}

	async acceptFriendRequest(friendRequestId: number, friendId: number): Promise<Friendship> {
		return this.prismaService.friendship.update({
			data: {
				pending: false,
			},
			where: {
				id: friendRequestId,
			},
		});
	}

	async getFriendList(userId: number): Promise<User[]> {
		const friendIds = await this.prismaService.friendship
			.findMany({
				where: {
					OR: [
						{
							userId,
							pending: false,
						},
						{
							friendId: userId,
							pending: false,
						},
					],
				},
			})
			.then((users) =>
				users.map((user) =>
					user.userId !== userId ? user.userId : user.friendId,
				),
			);

		if (!friendIds.length) {
			return [];
		}

		return this.prismaService.user.findMany({
			where: {
				id: { in: friendIds },
			},
		});
	}
}
