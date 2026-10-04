import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Toutes les pages exigent le mot de passe d'équipe, sauf /login.
// /api/mcp a sa propre authentification (clé Bearer).
export async function proxy(request: NextRequest) {
  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api/mcp|_next/static|_next/image|game/|favicon.ico|icon.svg).*)"],
};
