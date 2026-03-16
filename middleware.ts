import { type NextRequest, NextResponse } from "next/server";

// Auth guards fully bypassed — all routes are accessible without a session.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every route EXCEPT:
     *   - Next.js internal routes (_next/static, _next/image)
     *   - favicon.ico
     *   - Static file extensions (svg, png, jpg, jpeg, gif, webp, ico, css, js, woff, woff2)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
  ],
};
