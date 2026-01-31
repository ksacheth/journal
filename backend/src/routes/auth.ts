import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { UserModel } from "../models/User";
import { JWT_SECRET, logger } from "../config";
import { signupSchema, signinSchema } from "../validators";

const router = express.Router();

// Rate limiting for auth routes - 5 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to signin route
router.use("/signin", authLimiter);

// Signup disabled
router.post("/signup", async (_req, res) => {
  return res.status(403).json({
    message: "Sign up is currently disabled",
  });
});

// Pre-calculated dummy hash for timing attack protection
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklm";

router.post("/signin", async (req, res) => {
  const validationResult = signinSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: validationResult.error.issues,
    });
  }

  const { username, password } = validationResult.data;

  try {
    const existingUser = await UserModel.findOne({
      username: username,
    }).select("+password");

    // Always perform a comparison to prevent timing attacks
    const targetHash = existingUser ? existingUser.password : DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, targetHash);

    if (existingUser && passwordMatch) {
      const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET, {
        expiresIn: "7d", // Token expires in 7 days
      });

      // Set httpOnly cookie - more secure than localStorage
      res.cookie("authToken", token, {
        httpOnly: true, // Not accessible via JavaScript
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict", // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      return res.json({
        message: "Signed in successfully",
      });
    } else {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }
  } catch (error) {
    logger.error({ err: error, username }, "Signin error");
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Signout route - clears the auth cookie
router.post("/signout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return res.json({ message: "Signed out successfully" });
});

export default router;
