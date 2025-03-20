import express from 'express'
import { getComplexByName } from '../services/complexServices.js'
import { createNewUser, encryptPassword, checkPassword } from "../services/userServices.js";
import { prisma } from '../lib/prisma.js' 
import jwt from "jsonwebtoken";
import { createToken, saveToken } from '../middleware/tokenHandler.js';

const router = express.Router()

router.post('/register', async (req, res) => {
    try {
        const { name, username, password, complexName, complement } = req.body

        if (!name || !username || !password || !complexName || !complement) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
        }

        const complex = await getComplexByName(complexName)
        if (!complex) {
            return res.status(404).json({ error: 'Complexo não encontrado' })
        }

        let encryptedPassword = await encryptPassword(password)

        const newUser = await createNewUser(name, username, encryptedPassword, complex.id, complement)

        res.status(201).json(newUser)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Erro ao criar usuário' })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
        }

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user || !(await checkPassword(password, user.password))) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, type: user.type },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao processar login" });
    }
});


//router.put()

//router.delete()

export default router