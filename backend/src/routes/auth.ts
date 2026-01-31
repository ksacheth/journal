import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";
import { JWT_SECRET, logger } from "../config";
import { signupSchema, signinSchema } from "../validators";

const router = express.Router();

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
      const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET);

      return res.json({
        token,
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

export default router;
