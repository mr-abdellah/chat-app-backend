import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/profile", authenticateToken, AuthController.getProfile);
router.post(
  "/online-status",
  authenticateToken,
  AuthController.updateOnlineStatus
);
router.post("/logout", authenticateToken, AuthController.logout);

export default router;
