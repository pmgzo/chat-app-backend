import * as jwt from 'jsonwebtoken';
import path from "node:path";
import * as fs from 'fs';

export const createJwt = ({ id }: {id: number}): string => {
    const privateKey = fs.readFileSync(path.resolve(__dirname, "../../jwtRS256.key"), 'utf8');
    const encodedToken: string = jwt.sign({ id, iat: (new Date()).getTime() }, privateKey, { algorithm: 'RS256' });

    return encodedToken;
}

export const parseJwt = ({ token }: {token: string}): { id: number, iat: number } => {
    const publicKey = fs.readFileSync(path.resolve(__dirname, "../../jwtRS256.key.pub"), 'utf8');
    const decodedToken: { id: number, iat: number } = jwt.verify(token, publicKey, {algorithm: 'RS256'});

    return decodedToken;
}
