import { createHash, Hash } from 'node:crypto';

const SALT_LENGTH = 16;

// for passwords
export const generateSalt = (): string => {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"#$%&\'()*+,./:;<=>?@\\[\\] ^_`{|}~-';
	let result = '';

	for (let i = 0; i < SALT_LENGTH; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}

	return result;
};

// return hash in base64
export const getHash = ({
	password,
	salt,
}: {
	password: string;
	salt: string;
}) => {
	const hash: Hash = createHash('sha256');
	const data: string = salt + password;

	return hash.update(data).digest('base64');
};
