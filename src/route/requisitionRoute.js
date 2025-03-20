import express from 'express'
import { authorizeRequisitionCreation } from "../middleware/validations.js";
import { verifyToken } from "../middleware/tokenHandler.js";
import { getUserComplexId } from "../services/userServices.js";
import { createRequisition, getRequisitionsByUserType } from "../services/requisitionServices.js";

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Requisições
 *   description: Gerenciamento de requisições de manutenção
 */

/**
 * @swagger
 * /requisition:
 *   post:
 *     summary: Cria uma nova requisição de manutenção
 *     tags: [Requisições]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - location
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Vazamento no encanamento"
 *               content:
 *                 type: string
 *                 example: "Vazamento na cozinha, próximo à pia."
 *               location:
 *                 type: string
 *                 example: "Bloco B, Apartamento 302"
 *               imgUrl:
 *                 type: string
 *                 nullable: true
 *                 example: "https://example.com/imagem.jpg"
 *               priority:
 *                 type: string
 *                 example: "Alta"
 *     responses:
 *       201:
 *         description: Requisição criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Requisição criada com sucesso"
 *                 requisition:
 *                   type: object
 *       400:
 *         description: Campos obrigatórios não preenchidos
 *       401:
 *         description: Token não autorizado ou inválido
 *       500:
 *         description: Erro ao criar a requisição
 */

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

/**
 * @swagger
 * /allRequisition:
 *   get:
 *     summary: Lista todas as requisições do usuário logado
 *     tags: [Requisições]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de requisições do usuário ou todas as requisições (se admin/síndico)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Token não autorizado ou inválido
 *       500:
 *         description: Erro ao listar requisições
 */

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