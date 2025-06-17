import { Request } from "express";

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
}

export interface UserCreationAttributes {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
}

export interface MessageAttributes {
  id: number;
  username: string;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: "image" | "video" | "document" | "audio";
  fileSize?: number;
  createdAt: Date;
}

export interface MessageCreationAttributes {
  username: string;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: "image" | "video" | "document" | "audio";
  fileSize?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

export interface JWTPayload {
  userId: number;
  username: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}
