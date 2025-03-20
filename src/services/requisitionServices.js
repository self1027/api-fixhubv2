import { prisma } from "../lib/prisma.js";
import { REQUISITION_STATE } from "../constant/requisitionState.js";
import { USER_ROLES } from "../constant/userRole.js";

export async function createRequisition(id_User, id_Complex, title, content, location, imgUrl, priority) {
    return await prisma.requisition.create({
        data: {
            id_User,
            id_Complex,
            title,
            content,
            location,
            imgUrl: imgUrl || null, // Se não houver imagem, define como null
            status: REQUISITION_STATE.PENDING, // Status inicial fixo
            priority
        }
    });
}

export async function getUserRequisitions(userId) {
    return await prisma.requisition.findMany({
        where: { id_User: userId }
    });
}

export async function getAllRequisitions() {
    return await prisma.requisition.findMany();
}

export async function getRequisitionsByUserType(userId, userType) {
    if (userType === USER_ROLES.MORADOR) {
        return await getUserRequisitions(userId);
    }
    return await getAllRequisitions();
}