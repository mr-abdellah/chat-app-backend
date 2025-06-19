// src/models/Friendship.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { FriendshipAttributes, FriendshipCreationAttributes } from "../types";

class Friendship
  extends Model<FriendshipAttributes, FriendshipCreationAttributes>
  implements FriendshipAttributes
{
  declare id: number;
  declare userId1: number;
  declare userId2: number;
  declare createdAt: Date;
}

Friendship.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    userId2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "friendships",
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["userId1", "userId2"],
      },
    ],
  }
);

export default Friendship;
