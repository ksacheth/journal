import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";
import { JWT_SECRET } from "../config";
import { signupSchema, signinSchema } from "../validators";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const validationResult = signupSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: validationResult.error.errors,
    });
  }

  const { username, password } = validationResult.data;

  try {
    const existingUser = await UserModel.findOne({
      username: username,
    }).select("+password");

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      username: username,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    return res.json({
      token,
    });
  } catch (e) {
    return res.status(500).json({
      message: "Error creating user",
    });
  }
});

// Pre-calculated dummy hash for timing attack protection
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklm";

router.post("/signin", async (req, res) => {
  const validationResult = signinSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: validationResult.error.errors,
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
    console.error("Signin error", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
