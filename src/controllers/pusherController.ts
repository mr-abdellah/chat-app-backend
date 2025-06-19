// src/controllers/pusherController.ts (NEW FILE)
import { Response } from "express";
import Pusher from "pusher";
import { AuthenticatedRequest } from "../types";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export class PusherController {
  static async authenticateUser(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const socketId = req.body.socket_id;
      const channelName = req.body.channel_name;
      const userId = req.user!.userId;

      // Only allow authentication for private channels that include the user's ID
      if (channelName.startsWith("private-chat-")) {
        const channelParts = channelName.split("-");
        const userId1 = parseInt(channelParts[2]);
        const userId2 = parseInt(channelParts[3]);

        // Check if user is part of this private channel
        if (userId === userId1 || userId === userId2) {
          const presenceData = {
            user_id: userId.toString(),
            user_info: {
              username: req.user!.username,
            },
          };

          const authResponse = pusher.authorizeChannel(
            socketId,
            channelName,
            presenceData
          );
          res.send(authResponse);
          return;
        }
      }

      res.status(403).json({
        success: false,
        message: "Unauthorized channel access",
      });
    } catch (error) {
      console.error("Pusher auth error:", error);
      res.status(500).json({
        success: false,
        message: "Authentication failed",
      });
    }
  }
}
