import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config";

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authHandle = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: "JWT secret not configured" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (typeof decoded === "object" && decoded.userId) {
      req.userId = decoded.userId;
      next();
    } else {
      return res.status(401).json({ error: "Invalid token payload" });
    }
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
