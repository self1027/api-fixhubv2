import { prisma } from '../lib/prisma.js';
import express from 'express'
import { getAllComplexesNames } from '../services/complexServices.js'

const router = express.Router()

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