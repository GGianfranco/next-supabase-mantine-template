import { withMiddlewareAuth } from "@supabase/auth-helpers-nextjs";

export const middleware = withMiddlewareAuth({
  redirectTo: "/sign-in",
});

// For testing
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(req: NextRequest) {
//   console.log(req.method, req.url);
//   return NextResponse.next();
// }

export const config = {
  matcher: ["/p/:path*", "/api/p/:path*"],
};
