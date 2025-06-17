const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Message = sequelize.define(
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
      allowNull: true, // Now optional for file-only messages
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
      messageOrFile() {
        if (!this.message && !this.fileUrl) {
          throw new Error("Either message or file must be provided");
        }
      },
    },
  }
);

module.exports = Message;
