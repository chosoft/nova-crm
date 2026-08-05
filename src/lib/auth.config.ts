import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js configuration that is Edge-compatible (no bcrypt, no prisma).
 * Used by the middleware for JWT session verification only.
 */
export const authConfig: NextAuthConfig = {
  providers: [], // Providers are added in auth.ts (Node-only)
  session: {
    strategy: "jwt",
    maxAge: 86400, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.nombre = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.nombre = token.nombre as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes - no login required
      if (pathname.startsWith("/login")) return true;
      if (pathname.startsWith("/empresas")) return true;
      if (pathname.startsWith("/universidades")) return true;
      if (pathname === "/") return true;

      // Admin-only routes require login
      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn;
      }

      return true;
    },
  },
};
