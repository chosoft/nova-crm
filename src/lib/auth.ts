import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          throw new Error("Correo electrónico o contraseña incorrectos");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("Correo electrónico o contraseña incorrectos");
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error(
            "Tu cuenta ha sido bloqueada temporalmente. Intenta nuevamente en 15 minutos"
          );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          // Increment failed login attempts
          const newFailedAttempts = user.failedLoginAttempts + 1;
          const updateData: { failedLoginAttempts: number; lockedUntil?: Date } =
            {
              failedLoginAttempts: newFailedAttempts,
            };

          // Lock account if max attempts reached
          if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
            updateData.lockedUntil = new Date(
              Date.now() + LOCKOUT_DURATION_MS
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          throw new Error("Correo electrónico o contraseña incorrectos");
        }

        // Successful login: reset failed attempts counter
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          role: user.role,
        };
      },
    }),
  ],
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
  },
});
