import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Define protected paths - excluding PDF routes from protection
  const isProtectedPath =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    (request.nextUrl.pathname.startsWith("/api/amendments") &&
      !request.nextUrl.pathname.startsWith("/api/pdf-text") &&
      !request.nextUrl.pathname.startsWith("/api/pdf-proxy"));

  // Define auth paths
  const isAuthPath = request.nextUrl.pathname.startsWith("/login");

  // Redirect to login if accessing protected route without authentication
  if (isProtectedPath && !isAuthenticated) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure the paths that should be matched by the middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/amendments/:path*",
    "/api/pdf-text/:path*",
    "/api/pdf-proxy/:path*",
    "/login",
  ],
};
