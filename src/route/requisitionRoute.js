import express from 'express'
import { authorizeRequisitionCreation } from "../middleware/validations.js";
import { verifyToken } from "../middleware/tokenHandler.js";
import { getUserComplexId } from "../services/userServices.js";
import { createRequisition, getRequisitionsByUserType } from "../services/requisitionServices.js";

const router = express.Router()

router.post('/requisition', verifyToken, authorizeRequisitionCreation, async (req, res) => {
    try {
        const { title, content, location, imgUrl, priority } = req.body 
        const id_User = req.user.id

        if (!title || !content || !location || !priority) {
            return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos" })
        }

        const id_Complex = await getUserComplexId(id_User)

        const requisition = await createRequisition(id_User, id_Complex, title, content, location, imgUrl, priority)

        return res.status(201).json({ message: "Requisição criada com sucesso", requisition })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: error.message || "Erro ao criar requisição" })
    }
})


router.get('/allRequisition', verifyToken, async (req, res) => {
    try {
        const { id, type } = req.user

        const requisitions = await getRequisitionsByUserType(id, type)

        return res.status(200).json(requisitions)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Erro ao listar requisições" })
    }
})

//router.put()

//router.delete()

export default router