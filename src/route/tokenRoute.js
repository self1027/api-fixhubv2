import express from "express";
import { validateRefreshToken, generateAccessToken, generateRefreshToken, saveToken } from "../middleware/tokenHandler.js";


const router = express.Router();

router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token é obrigatório" });
        }

        const tokenData = await validateRefreshToken(refreshToken);
        if (!tokenData) {
            return res.status(403).json({ error: "Refresh token inválido ou expirado" });
        }

        const user = { id: tokenData.id_User, username: tokenData.username, type: tokenData.type };
        const newAccessToken = generateAccessToken(user.id, user.username, user.type);
        const newRefreshToken = generateRefreshToken(user.id, user.username, user.type);

        await saveToken(user.id, newAccessToken, newRefreshToken);

        return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        console.error("Erro ao renovar token:", error);
        return res.status(500).json({ error: "Erro interno ao processar o refresh token" });
    }
});

export default router;
