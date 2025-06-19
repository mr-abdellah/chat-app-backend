// src/controllers/authController.ts (COMPLETE UPDATE)
import bcrypt from "bcryptjs";
import { Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { ApiResponse, AuthenticatedRequest } from "../types";

export class AuthController {
  static async register(req: any, res: Response<ApiResponse>): Promise<void> {
    try {
      const { username, email, password, bio, avatar } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
        return;
      }

      // Check if username is taken
      const existingUsername = await User.findOne({
        where: { username },
      });

      if (existingUsername) {
        res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
        return;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        bio,
        avatar,
        isOnline: true,
        lastSeen: new Date(),
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register user",
      });
    }
  }

  static async login(req: any, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Update online status
      await user.update({
        isOnline: true,
        lastSeen: new Date(),
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to login",
      });
    }
  }

  static async getProfile(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Profile fetched successfully",
        data: user,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  }

  static async updateOnlineStatus(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const body = req.body;
      const isOnline = body ? body?.isOnline : false;

      const user = await User.findByPk(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      await user.update({
        isOnline: isOnline,
        lastSeen: new Date(),
      });

      res.json({
        success: true,
        message: "Online status updated successfully",
        data: {
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
        },
      });
    } catch (error) {
      console.error("Update online status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update online status",
      });
    }
  }

  static async logout(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const user = await User.findByPk(userId);

      if (user) {
        await user.update({
          isOnline: false,
          lastSeen: new Date(),
        });
      }

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to logout",
      });
    }
  }
}
