import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { logger } from "../config";

const AUTH_SECRET = process.env.AUTH_SECRET;

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authHandle = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestInfo = {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    userAgent: req.headers["user-agent"],
  };

  logger.info(requestInfo, "⚡ Incoming authenticated request");

  // Get token from Authorization header or NextAuth session cookies
  let token: string | undefined;
  let tokenSource: string | undefined;
  const cookieKeys = req.cookies ? Object.keys(req.cookies) : [];

  logger.debug({ cookieKeys }, "🍪 Available cookies");

  // Check Authorization header FIRST (preferred method)
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
    tokenSource = "authorization-bearer";
    logger.info(
      {
        hasAuthHeader: true,
        tokenLength: token.length,
      },
      "🔑 Using Authorization header token",
    );
  } else if (req.cookies?.["authjs.session-token"]) {
    // Fallback to cookies (development)
    token = req.cookies["authjs.session-token"];
    tokenSource = "authjs.session-token";
  } else if (req.cookies?.["__Secure-authjs.session-token"]) {
    // Production uses __Secure- prefix
    token = req.cookies["__Secure-authjs.session-token"];
    tokenSource = "__Secure-authjs.session-token";
  } else if (req.cookies?.["next-auth.session-token"]) {
    token = req.cookies["next-auth.session-token"];
    tokenSource = "next-auth.session-token";
  } else if (req.cookies?.["__Secure-next-auth.session-token"]) {
    // Backward compatibility with older NextAuth cookie name
    token = req.cookies["__Secure-next-auth.session-token"];
    tokenSource = "__Secure-next-auth.session-token";
  } else if (req.cookies?.authToken) {
    // Fallback to legacy authToken cookie for backward compatibility
    token = req.cookies.authToken;
    tokenSource = "authToken";
  }

  if (!token) {
    logger.warn(
      {
        ...requestInfo,
        cookieKeys,
        hasAuthHeader: !!req.headers["authorization"],
      },
      "❌ Authorization token missing",
    );
    return res.status(401).json({ error: "Authorization token missing" });
  }

  const tokenPreview = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
  logger.info(
    { ...requestInfo, tokenSource, tokenPreview, tokenLength: token.length },
    "🎫 Token found",
  );

  if (!AUTH_SECRET) {
    logger.error({ path: req.path }, "❌ AUTH_SECRET not configured");
    return res.status(500).json({ error: "AUTH_SECRET not configured" });
  }

  try {
    // NextAuth v5 uses JWT with HS256 algorithm by default
    const encoder = new TextEncoder();
    logger.debug("🔐 Attempting JWT verification");

    const { payload } = await jwtVerify(token, encoder.encode(AUTH_SECRET), {
      algorithms: ["HS256"],
    });

    logger.debug(
      { payload: { sub: payload.sub, iat: payload.iat, exp: payload.exp } },
      "📦 JWT payload decoded",
    );

    if (payload.sub) {
      req.userId = payload.sub;
      logger.info(
        {
          userId: payload.sub,
          path: req.path,
          tokenSource,
          expiresAt: payload.exp
            ? new Date(payload.exp * 1000).toISOString()
            : "unknown",
        },
        "✅ Auth token verified successfully",
      );
      next();
    } else {
      logger.warn(
        { path: req.path, tokenSource, payload },
        "❌ Invalid token payload - missing sub",
      );
      return res.status(401).json({ error: "Invalid token payload" });
    }
  } catch (error) {
    const errorInfo = {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
    };

    logger.warn(
      { ...requestInfo, tokenSource, tokenPreview, ...errorInfo },
      "❌ JWT verification failed",
    );
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
