import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Routes that require a valid Supabase session
const PROTECTED_ROUTES = [
  "/dashboard",
  "/expert",
  "/peer-connect",
  "/blackbox",
  "/sound-therapy",
  "/profile",
];

// Routes that should redirect to /dashboard when the user is already signed in
const AUTH_ROUTES = ["/", "/login", "/scan", "/activate"];

export async function middleware(request: NextRequest) {
  // 1. Refresh the Supabase session cookies (keeps JWTs alive)
  const response = await updateSession(request);

  // 2. Build a lightweight read-only Supabase client to check auth state.
  //    Cookie mutations are already handled by updateSession above, so
  //    setAll is intentionally a no-op here.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Handled by updateSession — no-op here.
        },
      },
    },
  );

  // getUser() validates the JWT with the Supabase Auth server on every call,
  // making it safe to use in middleware for auth-gating decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Guard 1: Unauthenticated user hitting a protected route ───────────────
  // Send them back to the home / code-entry page so they go through the
  // full onboarding or login flow before accessing the app.
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !user) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("redirected", "1"); // optional hint for UI
    return NextResponse.redirect(redirectUrl);
  }

  // ── Guard 2: Already-authenticated user hitting an auth / onboarding page ─
  // Redirect straight to the dashboard — no need to re-enter code or login.
  if (AUTH_ROUTES.includes(pathname) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
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
