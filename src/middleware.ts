import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login"];
const adminOnlyRoutes = ["/dashboard"];
const memberRoutes = ["/empresas", "/universidades"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. If public route → pass through
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. If no session → redirect /login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = req.auth.user?.role as string | undefined;

  // 3. If admin accesses adminOnlyRoutes → pass through
  // 4. If miembro accesses adminOnlyRoutes → redirect /empresas
  if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole === "admin") {
      return NextResponse.next();
    }
    // Miembro trying to access admin routes
    const empresasUrl = new URL("/empresas", req.nextUrl.origin);
    return NextResponse.redirect(empresasUrl);
  }

  // 5. If any role accesses memberRoutes → pass through
  if (memberRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Default: allow authenticated requests to pass through
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     * - API routes except auth
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
