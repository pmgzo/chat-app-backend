import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getHash, generateSalt } from '../common/hash';

@Injectable()
export class UserService {
	constructor(private prismaService: PrismaService) {}

	async findUser(name: string): Promise<User> {
		return this.prismaService.user.findUnique({
			where: {
				name: name,
			},
		});
	}

	async findUsers(): Promise<User[]> {
		return this.prismaService.user.findMany();
	}

	async userExists(name: string): Promise<boolean> {
		return !!(await this.prismaService.user.count({
			where: { name: name },
		}));
	}

	async createUser(name: string, password: string): Promise<User> {
		const salt: string = generateSalt();

		return await this.prismaService.user.create({
			data: {
				name: name,
				salt,
				password: getHash({ password: password, salt }),
			},
		});
	}

	async verifyCredentials(name: string, password: string): Promise<User> {
		const user: User = await this.findUser(name);

		const createdPassword: string = getHash({
			password: password,
			salt: user.salt,
		});

		if (createdPassword !== user.password) {
			throw new Error('Wrong user credentials');
		}
		return user;
	}

	async createFriendship({
		userId,
		friendId,
	}: {
		userId: number;
		friendId: number;
	}) {
		this.prismaService.friendship.create({
			data: {
				userId,
				friendId,
				pending: true,
			},
		});
	}
}
