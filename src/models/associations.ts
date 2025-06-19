// src/models/associations.ts
import User from "./User";
import Message from "./Message";
import FriendRequest from "./FriendRequest";
import Friendship from "./Friendship";

// User associations
User.hasMany(Message, { foreignKey: "senderId", as: "SentMessages" });
User.hasMany(Message, { foreignKey: "receiverId", as: "ReceivedMessages" });
User.hasMany(FriendRequest, { foreignKey: "senderId", as: "SentRequests" });
User.hasMany(FriendRequest, {
  foreignKey: "receiverId",
  as: "ReceivedRequests",
});

// Message associations
Message.belongsTo(User, { foreignKey: "senderId", as: "Sender" });
Message.belongsTo(User, { foreignKey: "receiverId", as: "Receiver" });

// FriendRequest associations
FriendRequest.belongsTo(User, { foreignKey: "senderId", as: "Sender" });
FriendRequest.belongsTo(User, { foreignKey: "receiverId", as: "Receiver" });

// Friendship associations
Friendship.belongsTo(User, { foreignKey: "userId1", as: "User1" });
Friendship.belongsTo(User, { foreignKey: "userId2", as: "User2" });

export { User, Message, FriendRequest, Friendship };
