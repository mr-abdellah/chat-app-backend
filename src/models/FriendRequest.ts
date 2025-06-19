// src/models/FriendRequest.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import {
  FriendRequestAttributes,
  FriendRequestCreationAttributes,
} from "../types";

class FriendRequest
  extends Model<FriendRequestAttributes, FriendRequestCreationAttributes>
  implements FriendRequestAttributes
{
  declare id: number;
  declare senderId: number;
  declare receiverId: number;
  declare status: "pending" | "accepted" | "rejected";
  declare createdAt: Date;
  declare updatedAt: Date;
}

FriendRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "friend_requests",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["senderId", "receiverId"],
      },
    ],
  }
);

export default FriendRequest;
