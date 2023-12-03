export interface AuthConfig {
	tokenExpiresAfter: string; // in string duration format
}

export interface JwtPayload {
	id: number;
	name: string;
	iat: number; // timestamp at which the jwt was issued
}
