import express from 'express'
import { getComplexByName } from '../services/complexServices.js'
import { createNewUser, encryptPassword, checkPassword, getUserByUsername, updateUser, deleteUserByID } from "../services/userServices.js";
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
            where: { username },
            include: {
                complex: true
            }
        });

        if (user.type == USER_ROLES.NAO_VALIDADO) {
            return res.status(403).json({ error: "Usuários não validados não podem fazer login"})
        }

        if (!user || !(await checkPassword(password, user.password))) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        const { accessToken, refreshToken } = await createToken(user.id, user.username, user.type);

        res.status(200).json({
            accessToken,
            refreshToken,
            username: user.username,
            name: user.name,
            complexName: user.complex?.name || null,
            complement: user.complement,
            type: user.type
        });

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
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: "ID do usuário é obrigatório" });
        }

        const user = await prisma.user.findUnique({
        where: { id: id }
        });

        if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
        }

        await prisma.user.update({
        where: { id: id },
        data: { type: USER_ROLES.MORADOR }
        });


        return res.status(200).json({ message: "Usuário atualizado para MORADOR com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
});


/**
 * @swagger
 * /adminDeleteUser:
 *   delete:
 *     summary: Exclui um usuário (apenas ADMIN_COMPLEX)
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
 *                 description: Nome de usuário do usuário a ser excluído.
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso.
 *       403:
 *         description: Acesso negado ou tentativa de excluir outro ADMIN_COMPLEX.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro ao excluir usuário.
 */

router.delete('/adminDeleteUser',verifyToken, async (req, res) => {
    try {
        const { id, type } = req.user
        const { username } = req.body
        if( type !== USER_ROLES.ADMIN_COMPLEX){
            return res.status(403).json({error:"Acesso negado"})
        }

        const user = await getUserByUsername(username)
        if(!user){
            return res.status(404).json({error:"Usuário não encontrado"})
        }

        if(user.type == USER_ROLES.ADMIN_COMPLEX){
            return res.status(403).json({error:"Não é possível excluir outro Admin"})
        }

        await deleteUserByID(user.id)
        return res.status(200).json({message:"Usuario excluido com sucesso"})

    } catch (error) {
        console.error(error)
        res.status(500).json({error:"Erro ao excluir usuário"})
    }
})

router.post('/usuariosPendentes/:username', verifyToken, async (req, res) => {
    try {
        //const { id, type } = req.user;
        const { username } = req.params;

        /* Verifica se o usuário tem permissão
        if (![USER_ROLES.ADMIN_COMPLEX, USER_ROLES.SINDICO].includes(type)) {
            return res.status(403).json({ error: "Acesso negado" });
        }*/

        // Busca o usuário pelo username
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const idComplex = user.id_Complex;

        // Consulta usuários pendentes do mesmo complexo
        const usuariosPendentes = await prisma.user.findMany({
            where: {
                id_Complex: idComplex,
                type: USER_ROLES.NAO_VALIDADO,
            },
            select: {
                id: true,
                name: true,
                username: true,
                complement: true,
                type: true,
                status: true,
            },
        });

        return res.status(200).json({ usuarios: usuariosPendentes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao buscar usuários pendentes" });
    }
});

router.get('/usersByComplex/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    // Buscar o id do complexo do usuário
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id_Complex: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const complexId = user.id_Complex;

    // Buscar todos os usuários do mesmo complexo, exceto os não validados
    const usersInComplex = await prisma.user.findMany({
      where: {
        id_Complex: complexId,
        type: {
          not: USER_ROLES.NAO_VALIDADO
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        type: true,
        status: true,
        complement: true
      }
    });

    return res.json(usersInComplex);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar usuários do complexo" });
  }
});

// Atualiza o tipo de um usuário
router.put('/user/update-type/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (typeof type !== 'number') {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { type }
    });

    return res.json({
      message: 'Tipo de usuário atualizado com sucesso',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        type: updatedUser.type
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar tipo do usuário' });
  }
});

export default router
