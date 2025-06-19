// src/routes/userRoutes.ts
import { Router } from "express";
import { FriendController } from "../controllers/friendController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/search", authenticateToken, FriendController.searchUsers);

export default router;
