import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { MessageAttributes, MessageCreationAttributes } from "../types";

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
    },
  }
);

export default Message;
