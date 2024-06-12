import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserExistArguments } from '../models/user.model';
import { hash, verify } from 'argon2';

const SALT_LENGTH = 16;
const randomCharList =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"#$%&\'()*+,./:;<=>?@\\[\\] ^_`{|}~-';

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
		const salt: string = this.generateSalt();

		return await this.prismaService.user.create({
			data: {
				name: name,
				salt: salt,
				password: await hash(password, { salt: Buffer.from(salt, 'utf8') }),
			},
		});
	}

	async verifyCredentials(name: string, password: string): Promise<User> {
		const user: User = await this.findUser(name);

		const digest: string = await hash(password, {
			salt: Buffer.from(user.salt, 'utf8'),
		});

		try {
			await verify(digest, password);
		} catch {
			throw new Error('Wrong user credentials');
		}

		return user;
	}

	private generateSalt(): string {
		let result = '';

		for (let i = 0; i < SALT_LENGTH; i++) {
			result += randomCharList.charAt(
				Math.floor(Math.random() * randomCharList.length),
			);
		}

		return result;
	}
}
