import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes - always allow
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/empresas") ||
    pathname.startsWith("/universidades") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Dashboard - admin only
  if (pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
    if (req.auth.user?.role !== "admin") {
      const empresasUrl = new URL("/empresas", req.nextUrl.origin);
      return NextResponse.redirect(empresasUrl);
    }
    return NextResponse.next();
  }

  // Everything else - allow
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
