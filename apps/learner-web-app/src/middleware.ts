import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Proxy sunbird-plugins to Player MFE
  if (url.pathname.startsWith("/sunbird-plugins")) {
    url.hostname = "localhost";
    url.port = "4108";
    return NextResponse.rewrite(url);
  }

  // Proxy sbplayer routes to Player MFE
  if (url.pathname.startsWith("/sbplayer")) {
    url.hostname = "localhost";
    url.port = "4108";
    return NextResponse.rewrite(url);
  }

  // Proxy forget-password routes
  if (url.pathname.startsWith("/forget-password")) {
    url.hostname = "localhost";
    url.port = "4109";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
