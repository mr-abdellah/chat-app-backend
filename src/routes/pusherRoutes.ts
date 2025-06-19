// src/routes/pusherRoutes.ts (NEW FILE)
import { Router } from "express";
import { PusherController } from "../controllers/pusherController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/auth", authenticateToken, PusherController.authenticateUser);

export default router;
