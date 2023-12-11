import { Context } from 'graphql-ws';
import { PrismaClient, User } from '@prisma/client';

import { JwtPayload } from '../auth/interfaces/auth.interfaces';
import { parseJwt } from '../auth/auth.service';

export interface ContextValueType {
	user: User | null;
}

interface ConnectionParamType extends Record<string, unknown> {
	token: string;
}

const authUser = async (token: string): Promise<User | null> => {
	const prisma = new PrismaClient();
	let user: User;

	try {
		const payload: JwtPayload = parseJwt(token);
		user = await prisma.user.findUnique({
			where: {
				id: payload.id,
			},
		});
	} catch (error) {
		await prisma.$disconnect();
		return null;
	}
	await prisma.$disconnect();
	return user;
};

export const context = async ({ req, res }): Promise<ContextValueType> => {
	// this function is called before AuthGuards, we let AuthGuards throw instead
	const token = req?.headers?.authorization?.split(' ')[1] || '';

	return { user: token ? await authUser(token) : null };
};

export const onConnect = async (
	ctx: Context<ConnectionParamType, unknown>,
): Promise<boolean> => {
	// returning false, return a forbidden error
	const token = ctx.connectionParams?.token?.split(' ')[-1] || '';

	if (!token) {
		return false;
	}

	const user = await authUser(token);
	return user ? true : false;
};
