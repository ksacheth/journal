import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const identifier = credentials.username as string;
        const password = credentials.password as string;

        try {
          console.info("Credentials auth attempt", {
            identifier,
            hasPassword: !!password,
          });

          const client = await clientPromise;
          const db = client.db();
          const usersCollection = db.collection("users");

          // Find user by email or username
          const user = await usersCollection.findOne({
            $or: [{ email: identifier }, { username: identifier }],
          });

          console.info("Credentials user lookup", {
            identifier,
            userFound: !!user,
            hasPasswordField: !!user?.password,
            hasEmail: !!user?.email,
            hasUsername: !!user?.username,
          });

          if (!user || !user.password) {
            // User doesn't exist or doesn't have a password (OAuth user)
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);
          console.info("Credentials password check", {
            identifier,
            isValidPassword,
          });

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email || null,
            name: user.name || user.username || null,
            image: user.image || null,
          };
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to the JWT token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose user ID to the client session
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
});
