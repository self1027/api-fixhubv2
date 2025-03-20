import express from 'express'
import { getComplexByName } from '../services/complexServices.js'
import { createNewUser, encryptPassword, checkPassword } from "../services/userServices.js";
import { prisma } from '../lib/prisma.js' 
import { createToken } from '../middleware/tokenHandler.js';
import { loginLimiter } from '../middleware/loginLimiter.js';
import { USER_ROLES } from '../constant/userRole.js';

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Endpoints relacionados ao login e registro de usuários
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - password
 *               - complexName
 *               - complement
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               username:
 *                 type: string
 *                 example: "joaosilva"
 *               password:
 *                 type: string
 *                 example: "senhaSegura123"
 *               complexName:
 *                 type: string
 *                 example: "Residencial Alpha"
 *               complement:
 *                 type: string
 *                 example: "Bloco A, Apartamento 101"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "João Silva"
 *                 username:
 *                   type: string
 *                   example: "joaosilva"
 *                 complexId:
 *                   type: integer
 *                   example: 5
 *                 complement:
 *                   type: string
 *                   example: "Bloco A, Apartamento 101"
 *       400:
 *         description: Erro - Campos obrigatórios não preenchidos
 *       404:
 *         description: Complexo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autentica um usuário e retorna tokens de acesso
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "joaosilva"
 *               password:
 *                 type: string
 *                 example: "senhaSegura123"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsIn..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsIn..."
 *       400:
 *         description: Usuário e senha são obrigatórios
 *       401:
 *         description: Credenciais inválidas
 *       403:
 *         description: Usuário não validado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
        }

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (user.type == USER_ROLES.NAO_VALIDADO) {
            return res.status(403).json({ error: "Usuários não validados não podem fazer login"})
        }

        if (!user || !(await checkPassword(password, user.password))) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        const { accessToken, refreshToken } = await createToken(user.id, user.username, user.type);

        res.status(200).json({ accessToken, refreshToken });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao processar login" });
    }
})

export default router
