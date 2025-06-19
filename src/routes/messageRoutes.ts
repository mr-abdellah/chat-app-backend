// src/routes/messageRoutes.ts (updated)
import { Router } from "express";
import { MessageController } from "../controllers/messageController";
import { authenticateToken } from "../middleware/auth";
import { upload } from "../utils/fileUtils";

const router = Router();

router.get("/", MessageController.getAllMessages);
router.post("/", authenticateToken, MessageController.sendMessage);
router.post(
  "/file",
  authenticateToken,
  upload.single("file"),
  MessageController.sendFileMessage
);
router.get(
  "/private/:friendId",
  authenticateToken,
  MessageController.getPrivateMessages
);
router.get("/user/:username", MessageController.getMessagesByUser);

export default router;
