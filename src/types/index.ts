import { Request } from "express";

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: Date;
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

// src/types/index.ts (additions)
export interface FriendRequestAttributes {
  id: number;
  senderId: number;
  receiverId: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendRequestCreationAttributes {
  senderId: number;
  receiverId: number;
  status?: "pending" | "accepted" | "rejected";
}

export interface FriendshipAttributes {
  id: number;
  userId1: number;
  userId2: number;
  createdAt: Date;
}

export interface FriendshipCreationAttributes {
  userId1: number;
  userId2: number;
}

// Update MessageAttributes to include new fields
export interface MessageAttributes {
  id: number;
  senderId: number;
  receiverId?: number;
  username: string;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: "image" | "video" | "document" | "audio";
  fileSize?: number;
  isPrivate: boolean;
  createdAt: Date;
}

export interface MessageCreationAttributes {
  senderId: number;
  receiverId?: number;
  username: string;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: "image" | "video" | "document" | "audio";
  fileSize?: number;
  isPrivate?: boolean;
}

export interface FriendWithProfile {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  friendshipCreatedAt: Date;
}
