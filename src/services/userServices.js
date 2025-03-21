import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcrypt';
import { USER_ROLES } from '../constant/userRole.js';

export async function createNewUser(name, username, password, id_Complex, complement){
    return await prisma.user.create({
        data: {
            name,
            username,
            password,
            id_Complex, 
            type: USER_ROLES.NAO_VALIDADO,
            status: true,
            complement
        }
    })
}

export async function encryptPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export async function checkPassword(attemptedPassword, savedPassword) {
    return await bcrypt.compare(attemptedPassword, savedPassword);
}

export async function getUserComplexId(id_User) {
    const user = await prisma.user.findUnique({
        where: { id: id_User },
        select: { id_Complex: true }
    });

    if (!user || !user.id_Complex) {
        throw new Error("Usuário não associado a nenhum complexo");
    }

    return user.id_Complex;
}

export async function getUserByUsername(username) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true, type: true, password: true },
        });

        return user; // Retorna o usuário ou null se não encontrado
    } catch (error) {
        console.error("Erro ao buscar usuário por username:", error);
        throw error;
    }
}

export async function updateUser (userId, { type, password }) {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                type: type !== undefined ? type : undefined, // Atualiza apenas se fornecido
                password: password !== undefined ? password : undefined, // Atualiza apenas se fornecido
            },
            select: { id: true, username: true, type: true },
        });

        return updatedUser;
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        throw error;
    }
}

export async function deleteUserByID(userId) {
    try {
        await prisma.user.delete({
            where:{
                id: userId
            }
        })
    } catch (error) {
        console.log("Erro ao excluir usuário:", error)
        throw error
    }
}