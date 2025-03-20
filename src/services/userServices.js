import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcrypt';

export async function createNewUser(name, username, password, id_Complex, complement){
    return await prisma.user.create({
        data: {
            name,
            username,
            password,
            id_Complex, 
            type: 9,
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
