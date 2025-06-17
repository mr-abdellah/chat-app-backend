import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post(
  "/register",
  AuthController.registerValidation,
  AuthController.register
);
router.post("/login", AuthController.loginValidation, AuthController.login);
router.get("/profile", authenticateToken, AuthController.getProfile);

export default router;
