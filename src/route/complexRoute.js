import { prisma } from '../lib/prisma.js';
import express from 'express'
import { getAllComplexesNames } from '../services/complexServices.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Complexos
 *   description: Gerenciamento de complexos residenciais
 */

/**
 * @swagger
 * /complex:
 *   get:
 *     summary: Lista todos os complexos disponíveis
 *     tags: [Complexos]
 *     responses:
 *       200:
 *         description: Lista de nomes dos complexos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Residencial Primavera"
 *       500:
 *         description: Erro ao buscar complexos
 */


//  router.post()

router.get('/complex', async (req, res) => {
    try{
        const complexes = await getAllComplexesNames()
        res.json(complexes)
    } catch(error) {
        res.status(500).json({error: 'Erro ao Buscar Complexos'})
    }
})

//router.put()

//router.delete()

export default router