import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { getHash, generateSalt } from '../utils/hash';
import { UserExistArguments } from '../models/user.model';

@Injectable()
export class UserService {
	constructor(private prismaService: PrismaService) {}

	async findUser(name: string): Promise<User> {
		return this.prismaService.user.findUniqueOrThrow({
			where: {
				name: name,
			},
		});
	}

	async findUsers(): Promise<User[]> {
		return this.prismaService.user.findMany();
	}

	async userExists(args: UserExistArguments): Promise<boolean> {
		return !!(await this.prismaService.user.count({
			where: { ...args },
		}));
	}

	async createUser(name: string, password: string): Promise<User> {
		const salt: string = generateSalt();

		return await this.prismaService.user.create({
			data: {
				name: name,
				salt: salt,
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
}
