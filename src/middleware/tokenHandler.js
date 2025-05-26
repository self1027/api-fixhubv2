import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export async function checkIfTokenExists(user_id) {
    const existingToken = await prisma.token.findFirst({
        where: { id_User: user_id }
    });
    return !!existingToken;
}

export async function deleteToken(user_id) {
    await prisma.token.deleteMany({
        where: { id_User: user_id }
    });
}

export async function createToken(user_id, user_username, user_type) {
    if (await checkIfTokenExists(user_id)) {
        await deleteToken(user_id);
    }

    const accessToken = generateAccessToken(user_id, user_username, user_type);
    const refreshToken = generateRefreshToken(user_id, user_username, user_type);

    await saveToken(user_id, accessToken, refreshToken);
    return { accessToken, refreshToken };
}

export function generateAccessToken(user_id, user_username, user_type) {
    return jwt.sign(
        { id: user_id, username: user_username, type: user_type },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

export function generateRefreshToken(user_id, user_username, user_type) {
    return jwt.sign(
        { id: user_id, username: user_username, type: user_type },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

export async function saveToken(user_id, accessToken, refreshToken) {
    if (await checkIfTokenExists(user_id)) {
        await deleteToken(user_id);
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Define expiração para 7 dias

    return await prisma.token.create({
        data: {
            id_User: user_id,
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

export async function verifyToken(req, res, next) {
    /*try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Token não fornecido" });
        }

        const accessToken = authHeader.split(" ")[1];

        const isTokenValid = await validateToken(accessToken);
        if (!isTokenValid) {
            return res.status(401).json({ error: "Token inválido ou expirado" });
        }

        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido" });
    }*/
   next()
}

export async function validateRefreshToken(refreshToken) {
    return await prisma.token.findUnique({
        where: { refreshToken }
    });
}

export async function reloadToken(oldRefreshToken) {
    const existingToken = await validateRefreshToken(oldRefreshToken);
    if (!existingToken) {
        return { error: "Refresh token inválido ou expirado" };
    }

    const { id_User, username, type, refreshToken } = existingToken;

    try {
        jwt.verify(refreshToken, process.env.REFRESH_SECRET); // Usa a chave correta

        const newAccessToken = generateAccessToken(id_User, username, type);
        const newRefreshToken = generateRefreshToken(id_User, username, type);

        // Atualiza o refresh token no banco sem precisar excluir
        await prisma.token.updateMany({
            where: { id_User },
            data: { accessToken: newAccessToken, refreshToken: newRefreshToken }
        });

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
        return { error: "Refresh token inválido" };
    }
}
/*
export async function updateRefreshToken(user_id, newRefreshToken) {
    await prisma.token.updateMany({
        where: { id_User: user_id },
        data: { refreshToken: newRefreshToken }
    });
}*/
