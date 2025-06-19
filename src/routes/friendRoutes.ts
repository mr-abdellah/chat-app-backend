// src/routes/friendRoutes.ts
import { Router } from "express";
import { FriendController } from "../controllers/friendController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All friend routes require authentication
router.use(authenticateToken);

router.post("/request", FriendController.sendFriendRequest);
router.post("/request/:id/accept", FriendController.acceptFriendRequest);
router.post("/request/:id/reject", FriendController.rejectFriendRequest);
router.get("/", FriendController.getFriends);
router.get("/requests/pending", FriendController.getPendingRequests);

export default router;
