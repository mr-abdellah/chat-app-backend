import { Router } from "express";
import { MessageController } from "../controllers/messageController";
import { upload } from "../utils/fileUtils";

const router = Router();

router.get("/", MessageController.getAllMessages);
router.post("/", MessageController.sendMessage);
router.post("/file", upload.single("file"), MessageController.sendFileMessage);
router.get("/user/:username", MessageController.getMessagesByUser);

export default router;
