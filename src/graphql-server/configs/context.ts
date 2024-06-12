import { User } from '@prisma/client';

export interface ContextValueType {
	user: User | null;
}

export interface ConnectionParamType extends Record<string, unknown> {
	token: string;
}
