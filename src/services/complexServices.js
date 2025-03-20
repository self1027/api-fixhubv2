import { prisma } from '../lib/prisma.js'

export async function getComplexByName(complexName) {
    const exists = await isComplexNameContained(complexName);
    
    if (!exists) {
        return null;
    }

    return await prisma.complex.findFirstOrThrow({
        where: { name: complexName }
    });
}

export async function isComplexNameContained(complexName) {
    const complex = await prisma.complex.findFirst({
        where: {
            name: {
                contains: complexName.toLowerCase()
            }
        }
    });

    return !!complex;
}

export async function getAllComplexesNames() {
    return await prisma.complex.findMany({
        select: { name: true }
    });
}