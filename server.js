const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const Pusher = require("pusher");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("./models/User");
const { Op } = require("sequelize");

const { connectDB } = require("./config/database");
const Message = require("./models/Message");

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory
const uploadsDir = path.join(__dirname, "uploads");
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Expanded file type support
    const allowedTypes =
      /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|pdf|doc|docx|txt|rtf|odt|xlsx|xls|ppt|pptx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    // More comprehensive MIME type checking
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
      "text/plain",
      "text/rtf",
      "application/vnd.oasis.opendocument.text",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/aac", // Audio support
    ];

    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      console.log(
        `Rejected file: ${file.originalname}, MIME: ${file.mimetype}`
      );
      cb(new Error(`Invalid file type. Received: ${file.mimetype}`));
    }
  },
});

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));

// Helper function to determine file type
const getFileType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
};

// Routes

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Chat App API with File Support is running!" });
});

app.post(
  "/api/register",
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username, email, password, avatar, bio } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email or username already exists",
        });
      }

      // Create new user
      const newUser = await User.create({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
        avatar: avatar || null,
        bio: bio || null,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, username: newUser.username },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

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
);

// User Login Route
app.post(
  "/api/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
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
);

// Get all messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.findAll({
      order: [["createdAt", "ASC"]],
      limit: 100,
    });
    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
});

// Send a new message (text only)
app.post("/api/messages", async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username || !message) {
      return res.status(400).json({
        success: false,
        message: "Username and message are required",
      });
    }

    const newMessage = await Message.create({
      username: username.trim(),
      message: message.trim(),
    });

    await pusher.trigger("chat-channel", "new-message", {
      id: newMessage.id,
      username: newMessage.username,
      message: newMessage.message,
      fileUrl: newMessage.fileUrl,
      fileName: newMessage.fileName,
      fileType: newMessage.fileType,
      fileSize: newMessage.fileSize,
      createdAt: newMessage.createdAt,
    });

    res.status(201).json({
      success: true,
      data: newMessage,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
});

// Send a file message
app.post("/api/messages/file", upload.single("file"), async (req, res) => {
  try {
    const { username, message } = req.body;
    const file = req.file;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    if (!file && !message) {
      return res.status(400).json({
        success: false,
        message: "Either file or message is required",
      });
    }

    const messageData = {
      username: username.trim(),
      message: message ? message.trim() : null,
    };

    if (file) {
      messageData.fileUrl = `/uploads/${file.filename}`;
      messageData.fileName = file.originalname;
      messageData.fileType = getFileType(file.mimetype);
      messageData.fileSize = file.size;
    }

    const newMessage = await Message.create(messageData);

    await pusher.trigger("chat-channel", "new-message", {
      id: newMessage.id,
      username: newMessage.username,
      message: newMessage.message,
      fileUrl: newMessage.fileUrl,
      fileName: newMessage.fileName,
      fileType: newMessage.fileType,
      fileSize: newMessage.fileSize,
      createdAt: newMessage.createdAt,
    });

    res.status(201).json({
      success: true,
      data: newMessage,
      message: "File message sent successfully",
    });
  } catch (error) {
    console.error("Error sending file message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send file message",
    });
  }
});

// Get messages by username
app.get("/api/messages/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const messages = await Message.findAll({
      where: { username },
      order: [["createdAt", "ASC"]],
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching user messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user messages",
    });
  }
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
      console.log(`File uploads stored in: ${uploadsDir}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
