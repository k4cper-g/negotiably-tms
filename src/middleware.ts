import { clerkMiddleware } from "@clerk/nextjs/server";

// Use Clerk's middleware to protect all routes
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/|.*\\.).*)',
    // Include specific routes we want to protect
    '/dashboard(.*)',
    '/offers(.*)',
    '/negotiations(.*)',
    '/analytics(.*)',
    '/profile(.*)',
    '/settings(.*)',
  ],
};