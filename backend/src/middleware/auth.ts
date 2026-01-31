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
  // Try to get token from cookie first (more secure), fall back to Authorization header
  let token: string | undefined;

  // Check for authToken cookie (httpOnly)
  if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  } else {
    // Fallback to Authorization header for backward compatibility
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      // Extract token from "Bearer <token>" format
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Authorization token missing" });
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
