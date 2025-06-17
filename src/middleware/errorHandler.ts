import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [err.message],
    });
    return;
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    res.status(400).json({
      success: false,
      message: "Resource already exists",
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
