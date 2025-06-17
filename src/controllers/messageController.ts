import { Request, Response } from "express";
import Pusher from "pusher";
import Message from "../models/Message";
import { ApiResponse } from "../types";
import { getFileType } from "../utils/fileUtils";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export class MessageController {
  static async getAllMessages(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const messages = await Message.findAll({
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
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { username, message } = req.body;

      if (!username || !message) {
        res.status(400).json({
          success: false,
          message: "Username and message are required",
        });
        return;
      }

      const newMessage = await Message.create({
        username: username.trim(),
        message: message.trim(),
      });

      await pusher.trigger("chat-channel", "new-message", {
        id: newMessage.id,
        username: newMessage.username,
        message: newMessage.message,
        fileUrl: newMessage.fileUrl,
        fileName: newMessage.fileName,
        fileType: newMessage.fileType,
        fileSize: newMessage.fileSize,
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
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { username, message } = req.body;
      const file = req.file;

      if (!username) {
        res.status(400).json({
          success: false,
          message: "Username is required",
        });
        return;
      }

      if (!file && !message) {
        res.status(400).json({
          success: false,
          message: "Either file or message is required",
        });
        return;
      }

      const messageData: any = {
        username: username.trim(),
        message: message ? message.trim() : null,
      };

      if (file) {
        messageData.fileUrl = `/uploads/${file.filename}`;
        messageData.fileName = file.originalname;
        messageData.fileType = getFileType(file.mimetype);
        messageData.fileSize = file.size;
      }

      const newMessage = await Message.create(messageData);

      await pusher.trigger("chat-channel", "new-message", {
        id: newMessage.id,
        username: newMessage.username,
        message: newMessage.message,
        fileUrl: newMessage.fileUrl,
        fileName: newMessage.fileName,
        fileType: newMessage.fileType,
        fileSize: newMessage.fileSize,
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

  static async getMessagesByUser(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { username } = req.params;

      const messages = await Message.findAll({
        where: { username },
        order: [["createdAt", "ASC"]],
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
