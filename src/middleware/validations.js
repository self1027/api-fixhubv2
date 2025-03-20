import { USER_ROLES } from '../config/constants.js'; 

export function authorizeRequisitionCreation(req, res, next) {
    const { type } = req.user;

    if (type === USER_ROLES.NAO_VALIDADO) {
        return res.status(403).json({ error: "Usuário não validado. Você não pode criar requisições." });
    }

    next(); // Permite a continuação da requisição
}
