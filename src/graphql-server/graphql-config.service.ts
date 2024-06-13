import { ApolloDriverConfig } from '@nestjs/apollo';
import { Inject, Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { formatError } from './configs/error-masking';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { JwtPayload } from './auth/interfaces/auth.interfaces';
import { parseJwt } from './auth/auth.service';
import { ConnectionParamType, ContextValueType } from './configs/context';
import { Context } from 'graphql-ws';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
	constructor(@Inject(PrismaService) private prismaService: PrismaService) {}

	private async authUser(token: string): Promise<User | null> {
		const payload: JwtPayload = parseJwt(token);
		const user = await this.prismaService.user.findUnique({
			where: {
				id: payload.id,
			},
		});
		return user;
	}

	createGqlOptions(): ApolloDriverConfig {
		return {
			subscriptions: {
				'graphql-ws': {
					onConnect: async (
						ctx: Context<ConnectionParamType, ContextValueType>,
					): Promise<boolean | Record<string, unknown>> => {
						// if returning false, returns a forbidden error
						const token = ctx.connectionParams?.token?.split(' ')[1] || '';

						if (!token) {
							return false;
						}

						const user = await this.authUser(token);
						ctx.extra.user = user;

						return user ? true : false;
					},
					path: '/subscriptions',
				},
			},
			playground: true,
			autoSchemaFile: true,
			sortSchema: true,
			formatError,
			context: async ({ req, res }): Promise<ContextValueType> => {
				const token = req?.headers?.authorization?.split(' ')[1] || '';

				return { user: token ? await this.authUser(token) : null };
			},
			introspection: process.env.NODE_ENV !== 'production',
		};
	}
}
