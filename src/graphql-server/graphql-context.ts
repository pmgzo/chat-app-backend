import { PrismaClient, User } from '@prisma/client';
import { JwtPayload } from './auth/interfaces/auth.interfaces';
import { parseJwt } from './auth/auth.service';

export interface ContextValueType {
	user: User;
}

export const context = async ({ req, res }): Promise<ContextValueType> => {
	// this function is called before AuthGuards
	const prisma = new PrismaClient();
	let user: User | null = null;

	// mute all throwing error
	try {
		const token = req.headers.authorization.split(' ')[1];
		const payload: JwtPayload = parseJwt(token);
		user = await prisma.user.findUnique({
			where: {
				id: payload.id,
			},
		});
	} catch (error) {
		return { user: null };
	}

	return { user };
};
