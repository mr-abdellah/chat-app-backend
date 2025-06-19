// src/controllers/messageController.ts (COMPLETE UPDATE)
import { Response } from "express";
import { Op } from "sequelize";
import Pusher from "pusher";
import Message from "../models/Message";
import Friendship from "../models/Friendship";
import User from "../models/User";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { getFileType } from "../utils/fileUtils";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export class MessageController {
  static async getAllMessages(req: any, res: Response): Promise<void> {
    try {
      const messages = await Message.findAll({
        where: { isPrivate: false },
        order: [["createdAt", "ASC"]],
        limit: 100,
      });

      res.json({
        success: true,
        message: "Messages fetched successfully",
        data: messages,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
      });
    }
  }

  static async sendMessage(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { message, receiverId } = req.body;
      const senderId = req.user!.userId;
      const username = req.user!.username;

      if (!message) {
        res.status(400).json({
          success: false,
          message: "Message is required",
        });
        return;
      }

      const isPrivate = !!receiverId;

      // If private message, check friendship
      if (isPrivate) {
        const friendship = await Friendship.findOne({
          where: {
            [Op.or]: [
              { userId1: senderId, userId2: receiverId },
              { userId1: receiverId, userId2: senderId },
            ],
          },
        });

        if (!friendship) {
          res.status(403).json({
            success: false,
            message: "Can only send messages to friends",
          });
          return;
        }
      }

      const newMessage = await Message.create({
        senderId,
        receiverId: isPrivate ? receiverId : undefined, // Changed from null to undefined
        username: username,
        message: message.trim(),
        isPrivate,
      });

      // Trigger appropriate Pusher channel
      let channelName: string;

      if (isPrivate) {
        // Create consistent private channel name (smaller ID first)
        const userId1 = Math.min(senderId, receiverId);
        const userId2 = Math.max(senderId, receiverId);
        channelName = `private-chat-${userId1}-${userId2}`;
      } else {
        channelName = "chat-channel";
      }

      await pusher.trigger(channelName, "new-message", {
        id: newMessage.id,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        username: newMessage.username,
        message: newMessage.message,
        fileUrl: newMessage.fileUrl,
        fileName: newMessage.fileName,
        fileType: newMessage.fileType,
        fileSize: newMessage.fileSize,
        isPrivate: newMessage.isPrivate,
        createdAt: newMessage.createdAt,
      });

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message",
      });
    }
  }

  static async sendFileMessage(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { username, message, receiverId } = req.body;
      const senderId = req.user!.userId;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: "File is required",
        });
        return;
      }

      const isPrivate = !!receiverId;

      // If private message, check friendship
      if (isPrivate) {
        const friendship = await Friendship.findOne({
          where: {
            [Op.or]: [
              { userId1: senderId, userId2: parseInt(receiverId) },
              { userId1: parseInt(receiverId), userId2: senderId },
            ],
          },
        });

        if (!friendship) {
          res.status(403).json({
            success: false,
            message: "Can only send files to friends",
          });
          return;
        }
      }

      const fileType = getFileType(file.mimetype);
      const fileUrl = `/uploads/${file.filename}`;

      const newMessage = await Message.create({
        senderId,
        receiverId: isPrivate ? parseInt(receiverId) : undefined, // Changed from null to undefined
        username: username,
        message: message || undefined, // Changed from null to undefined
        fileUrl,
        fileName: file.originalname,
        fileType,
        fileSize: file.size,
        isPrivate,
      });

      // Trigger appropriate Pusher channel
      let channelName: string;

      if (isPrivate) {
        const userId1 = Math.min(senderId, parseInt(receiverId));
        const userId2 = Math.max(senderId, parseInt(receiverId));
        channelName = `private-chat-${userId1}-${userId2}`;
      } else {
        channelName = "chat-channel";
      }

      await pusher.trigger(channelName, "new-message", {
        id: newMessage.id,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        username: newMessage.username,
        message: newMessage.message,
        fileUrl: newMessage.fileUrl,
        fileName: newMessage.fileName,
        fileType: newMessage.fileType,
        fileSize: newMessage.fileSize,
        isPrivate: newMessage.isPrivate,
        createdAt: newMessage.createdAt,
      });

      res.status(201).json({
        success: true,
        message: "File message sent successfully",
        data: newMessage,
      });
    } catch (error) {
      console.error("Error sending file message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send file message",
      });
    }
  }

  static async getPrivateMessages(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { friendId } = req.params;
      const userId = req.user!.userId;

      // Verify friendship
      const friendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { userId1: userId, userId2: parseInt(friendId) },
            { userId1: parseInt(friendId), userId2: userId },
          ],
        },
      });

      if (!friendship) {
        res.status(403).json({
          success: false,
          message: "Can only view messages with friends",
        });
        return;
      }

      const messages = await Message.findAll({
        where: {
          isPrivate: true,
          [Op.or]: [
            { senderId: userId, receiverId: parseInt(friendId) },
            { senderId: parseInt(friendId), receiverId: userId },
          ],
        },
        order: [["createdAt", "ASC"]],
        limit: 100,
      });

      res.json({
        success: true,
        message: "Private messages fetched successfully",
        data: messages,
      });
    } catch (error) {
      console.error("Error fetching private messages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch private messages",
      });
    }
  }

  static async getMessagesByUser(req: any, res: Response): Promise<void> {
    try {
      const { username } = req.params;

      const messages = await Message.findAll({
        where: {
          username,
          isPrivate: false,
        },
        order: [["createdAt", "DESC"]],
        limit: 50,
      });

      res.json({
        success: true,
        message: "User messages fetched successfully",
        data: messages,
      });
    } catch (error) {
      console.error("Error fetching user messages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user messages",
      });
    }
  }
}
