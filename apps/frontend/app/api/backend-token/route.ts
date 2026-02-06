import { auth } from "@/auth";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

/**
 * API route to generate a JWT token for backend communication
 * This token is signed with AUTH_SECRET and can be verified by the backend
 */
export async function GET() {
  console.log("🎫 [backend-token] Token generation requested");

  try {
    const session = await auth();
    console.log("🔍 [backend-token] Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
    });

    if (!session?.user?.id) {
      console.warn("❌ [backend-token] Unauthorized - no session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error("❌ [backend-token] AUTH_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    console.log("🔐 [backend-token] Creating JWT for user:", session.user.id);

    // Create a JWT token that the backend can verify
    const encoder = new TextEncoder();
    const token = await new SignJWT({ sub: session.user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(encoder.encode(secret));

    const tokenPreview = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
    console.log("✅ [backend-token] Token generated successfully:", {
      userId: session.user.id,
      tokenPreview,
      tokenLength: token.length,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("❌ [backend-token] Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 },
    );
  }
}
