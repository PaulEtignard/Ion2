import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Consultables par tout le monde (lecture seule) : builds et classes.
// Le reste (tableau de bord, progression, activités, équipe) exige le mot de passe de la team.
const PUBLIC_PREFIXES = ["/builds", "/classes"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = new URL("/login", request.url);
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // .well-known : les clients MCP y cherchent une config OAuth ; il faut un 404, pas la page de login
  matcher: ["/((?!login|api/mcp|_next/static|_next/image|game/|\\.well-known|favicon.ico|icon|apple-icon|opengraph-image|logo\\.webp).*)"],
};
