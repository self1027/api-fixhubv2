import express from 'express'
import { getComplexByName } from '../services/complexServices.js'
import { createNewUser, encryptPassword, checkPassword, getUserByUsername, updateUser } from "../services/userServices.js";
import { prisma } from '../lib/prisma.js' 
import { createToken, verifyToken } from '../middleware/tokenHandler.js';
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

/**
 * @swagger
 * /allowUser:
 *   put:
 *     summary: Altera o nível de um usuário ou redefine sua senha
 *     tags: [Usuários]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nome de usuário do usuário a ser modificado.
 *               newType:
 *                 type: integer
 *                 description: Novo nível de permissão do usuário (opcional).
 *                 enum: [0, 1, 2, 3, 4, 9]
 *               newPassword:
 *                 type: string
 *                 description: Nova senha do usuário (opcional).
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário atualizado com sucesso
 *       400:
 *         description: Nenhum campo válido para atualização ou tipo de usuário inválido.
 *       403:
 *         description: Acesso negado (usuário sem permissão ou tentando modificar nível não permitido).
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro ao realizar liberação de usuário.
 */

router.put('/allowUser', verifyToken, async (req, res) => {
    try {
        const { id, type } = req.user; // Usuário logado
        const { username, newType, newPassword } = req.body;

        if (![USER_ROLES.ADMIN_COMPLEX, USER_ROLES.SINDICO].includes(type)) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Buscar usuário pelo username
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Restrição: Síndico só pode modificar usuários de tipo maior que 3 (não pode alterar síndicos ou admins)
        if (type === USER_ROLES.SINDICO && user.type < USER_ROLES.RESPONSAVEL_MANUTENCAO) {
            return res.status(403).json({ error: "Síndico não pode modificar este usuário" });
        }

        let updateData = {};

        // Validação do novo tipo (se fornecido)
        if (newType !== undefined) {
            if (!Object.values(USER_ROLES).includes(newType)) {
                return res.status(400).json({ error: "Tipo de usuário inválido" });
            }
            // Síndico não pode definir tipo admin ou Síndico
            if (type === USER_ROLES.SINDICO && newType < USER_ROLES.RESPONSAVEL_MANUTENCAO) {
                return res.status(403).json({ error: "Síndico não pode definir este nível de usuário" });
            }
            updateData.type = newType;
        }

        // Atualizar senha, se fornecida
        if (newPassword) {
            updateData.password = await encryptPassword(newPassword);
        }

        // Só atualizar se houver algo para modificar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "Nenhum campo válido para atualização" });
        }

        await updateUser(user.id, updateData);

        return res.status(200).json({ message: "Usuário atualizado com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao realizar liberação de usuário" });
    }
});


export default router
