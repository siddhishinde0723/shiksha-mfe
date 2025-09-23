import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.pathname.startsWith('/sbplayer')) {
    url.hostname = 'localhost';
    url.port = '4108';
    return NextResponse.rewrite(url);
  }
  //forget-password
  if (url.pathname.startsWith("/forget-password")) {
    url.hostname = "localhost";
    url.port = "4109";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
