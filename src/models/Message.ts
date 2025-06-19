// src/models/Message.ts (updated)
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { MessageAttributes, MessageCreationAttributes } from "../types";
import User from "./User";
import Friendship from "./Friendship";
import { Op } from "sequelize";

interface MessageInstance
  extends Model<MessageAttributes, MessageCreationAttributes>,
    MessageAttributes {}

const Message = sequelize.define<MessageInstance>(
  "Message",
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
      allowNull: true, // null for public messages
      references: {
        model: "users",
        key: "id",
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.ENUM("image", "video", "document", "audio"),
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    updatedAt: false,
    validate: {
      messageOrFile(this: MessageInstance) {
        if (!this.message && !this.fileUrl) {
          throw new Error("Either message or file must be provided");
        }
      },
      async friendshipValidation(this: MessageInstance) {
        if (this.isPrivate && this.receiverId) {
          const friendship = await Friendship.findOne({
            where: {
              [Op.or]: [
                { userId1: this.senderId, userId2: this.receiverId },
                { userId1: this.receiverId, userId2: this.senderId },
              ],
            },
          });
          if (!friendship) {
            throw new Error("Can only send private messages to friends");
          }
        }
      },
    },
  }
);

export default Message;
