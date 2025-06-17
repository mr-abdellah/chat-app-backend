import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import User from "../models/User";
import { AuthService } from "../services/authService";
import { ApiResponse, AuthenticatedRequest } from "../types";

export class AuthController {
  static registerValidation = [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];

  static loginValidation = [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ];

  static async register(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { username, email, password, avatar, bio } = req.body;

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }],
        },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "User with this email or username already exists",
        });
        return;
      }

      const newUser = await User.create({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
        avatar: avatar || null,
        bio: bio || null,
      });

      const token = AuthService.generateToken({
        userId: newUser.id,
        username: newUser.username,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            avatar: newUser.avatar,
            bio: newUser.bio,
            createdAt: newUser.createdAt,
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

  static async login(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      const token = AuthService.generateToken({
        userId: user.id,
        username: user.username,
      });

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
      const user = await User.findByPk(req.user!.userId, {
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
      console.error("Profile fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  }
}
