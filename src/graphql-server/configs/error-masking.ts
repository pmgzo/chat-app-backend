import { GraphQLFormattedError } from 'graphql';

// by default each error thrown from resolver are wrapped into GraphQLError
// so we can not catch instance error here

export const formatError = (
	formattedError: GraphQLFormattedError,
	error: unknown,
): GraphQLFormattedError => {
	// mask every throwing error coming from accessible public resolvers
	if (
		formattedError.extensions?.code == 'AUTHENTICATION_ERROR' &&
		!formattedError.extensions?.public
	) {
		return {
			message: 'Authentication Error',
			extensions: {
				code: 'AUTHENTICATION_ERROR',
			},
		};
	}

	if (formattedError.extensions.public) {
		formattedError.extensions.public = undefined;
		return formattedError;
	}

	return {
		message: 'Internal Server Error',
		path: formattedError.path,
		extensions: { code: 'INTERNAL_SERVER_ERROR' },
	};
};
