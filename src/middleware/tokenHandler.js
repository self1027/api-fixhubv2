import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

export function createToken(id_User) {
    const accessToken = jwt.sign({ id: id_User }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: id_User }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
}

export async function saveToken(id_User, accessToken, refreshToken) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    return await prisma.token.create({
        data: {
            id_User,
            accessToken,
            refreshToken,
            expiresAt
        }
    });
}

export async function validateToken(accessToken) {
    const token = await prisma.token.findUnique({
        where: { accessToken }
    });

    if (!token) return false;
    
    // Verifica se o token expirou
    const now = new Date();
    return token.expiresAt > now;
}
