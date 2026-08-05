import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const adminOnlyRoutes = ["/dashboard"];
const memberRoutes = ["/empresas", "/universidades"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. If login page → pass through (handled by authorized callback)
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // 2. If no session → the authorized callback already redirects to /login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = req.auth.user?.role as string | undefined;

  // 3/4. Admin-only routes
  if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole === "admin") {
      return NextResponse.next();
    }
    const empresasUrl = new URL("/empresas", req.nextUrl.origin);
    return NextResponse.redirect(empresasUrl);
  }

  // 5. Member routes → allow all authenticated
  if (memberRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Default: allow authenticated requests
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
