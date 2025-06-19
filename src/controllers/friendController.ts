// src/controllers/friendController.ts
import { Response } from "express";
import { Op } from "sequelize";
import FriendRequest from "../models/FriendRequest";
import Friendship from "../models/Friendship";
import User from "../models/User";
import { AuthenticatedRequest, ApiResponse, FriendWithProfile } from "../types";

export class FriendController {
  static async sendFriendRequest(
    req: AuthenticatedRequest,
    res: Response<ApiResponse<FriendRequest>>
  ): Promise<void> {
    try {
      const { receiverId } = req.body;
      const senderId = req.user!.userId;

      if (senderId === receiverId) {
        res.status(400).json({
          success: false,
          message: "Cannot send friend request to yourself",
        });
        return;
      }

      // Check if receiver exists
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Check if friendship already exists
      const existingFriendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { userId1: senderId, userId2: receiverId },
            { userId1: receiverId, userId2: senderId },
          ],
        },
      });

      if (existingFriendship) {
        res.status(400).json({
          success: false,
          message: "Already friends with this user",
        });
        return;
      }

      // Check if friend request already exists
      const existingRequest = await FriendRequest.findOne({
        where: {
          [Op.or]: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });

      if (existingRequest) {
        res.status(400).json({
          success: false,
          message: "Friend request already exists",
        });
        return;
      }

      const friendRequest = await FriendRequest.create({
        senderId,
        receiverId,
      });

      res.status(201).json({
        success: true,
        message: "Friend request sent successfully",
        data: friendRequest,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send friend request",
      });
    }
  }

  static async acceptFriendRequest(
    req: AuthenticatedRequest,
    res: Response<ApiResponse<Friendship>>
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const friendRequest = await FriendRequest.findOne({
        where: {
          id,
          receiverId: userId,
          status: "pending",
        },
      });

      if (!friendRequest) {
        res.status(404).json({
          success: false,
          message: "Friend request not found or already processed",
        });
        return;
      }

      // Update friend request status
      await friendRequest.update({ status: "accepted" });

      // Create friendship (ensure userId1 < userId2 for consistency)
      const userId1 = Math.min(
        friendRequest.senderId,
        friendRequest.receiverId
      );
      const userId2 = Math.max(
        friendRequest.senderId,
        friendRequest.receiverId
      );

      const friendship = await Friendship.create({
        userId1,
        userId2,
      });

      res.json({
        success: true,
        message: "Friend request accepted successfully",
        data: friendship,
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to accept friend request",
      });
    }
  }

  static async rejectFriendRequest(
    req: AuthenticatedRequest,
    res: Response<ApiResponse<null>>
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const friendRequest = await FriendRequest.findOne({
        where: {
          id,
          receiverId: userId,
          status: "pending",
        },
      });

      if (!friendRequest) {
        res.status(404).json({
          success: false,
          message: "Friend request not found or already processed",
        });
        return;
      }

      await friendRequest.update({ status: "rejected" });

      res.json({
        success: true,
        message: "Friend request rejected successfully",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject friend request",
      });
    }
  }

  static async getFriends(
    req: AuthenticatedRequest,
    res: Response<ApiResponse<FriendWithProfile[]>>
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const friendships = await Friendship.findAll({
        where: {
          [Op.or]: [{ userId1: userId }, { userId2: userId }],
        },
        include: [
          {
            model: User,
            as: "User1",
            attributes: [
              "id",
              "username",
              "email",
              "avatar",
              "bio",
              "isOnline",
              "lastSeen",
              "createdAt",
            ],
          },
          {
            model: User,
            as: "User2",
            attributes: [
              "id",
              "username",
              "email",
              "avatar",
              "bio",
              "isOnline",
              "lastSeen",
              "createdAt",
            ],
          },
        ],
      });

      const friends: FriendWithProfile[] = friendships.map(
        (friendship: any) => {
          const friend =
            friendship.userId1 === userId ? friendship.User2 : friendship.User1;
          return {
            ...friend.toJSON(),
            friendshipCreatedAt: friendship.createdAt,
          };
        }
      );

      res.json({
        success: true,
        message: "Friends fetched successfully",
        data: friends,
      });
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch friends",
      });
    }
  }

  static async getPendingRequests(
    req: AuthenticatedRequest,
    res: Response<ApiResponse<any[]>>
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const pendingRequests = await FriendRequest.findAll({
        where: {
          receiverId: userId,
          status: "pending",
        },
        include: [
          {
            model: User,
            as: "Sender",
            attributes: ["id", "username", "email", "avatar", "bio"],
          },
        ],
      });

      res.json({
        success: true,
        message: "Pending friend requests fetched successfully",
        data: pendingRequests,
      });
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending requests",
      });
    }
  }

  static async searchUsers(
    req: AuthenticatedRequest,
    res: Response<ApiResponse<User[]>>
  ): Promise<void> {
    try {
      const { q } = req.query;
      const userId = req.user!.userId;

      if (!q || typeof q !== "string") {
        res.status(400).json({
          success: false,
          message: "Search query is required",
        });
        return;
      }

      const users = await User.findAll({
        where: {
          [Op.and]: [
            {
              id: { [Op.ne]: userId }, // Exclude current user
            },
            {
              [Op.or]: [
                { username: { [Op.like]: `%${q}%` } },
                { email: { [Op.like]: `%${q}%` } },
              ],
            },
          ],
        },
        attributes: ["id", "username", "email", "avatar", "bio", "createdAt"],
        limit: 20,
      });

      res.json({
        success: true,
        message: "Users found successfully",
        data: users,
      });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search users",
      });
    }
  }
}
