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
            type: [USER_ROLES.NAO_VALIDADO],
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
