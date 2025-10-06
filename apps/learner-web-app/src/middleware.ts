import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.pathname.startsWith('/sbplayer')) {
    url.hostname = 'localhost';
    url.port = '4108';
    
    // For local development, ensure userId is passed via URL parameters
    const userId = request.cookies.get('userId')?.value;
    if (userId && !url.searchParams.has('userId')) {
      url.searchParams.set('userId', userId);
    }
    
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
