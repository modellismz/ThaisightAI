import { auth } from "./auth"
import { NextResponse } from "next/server"
import type { NextRequest, NextMiddleware } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')

    // Allow access to public routes (login page)
    if (isOnLoginPage) {
        if (isLoggedIn) {
            return Response.redirect(new URL('/', req.nextUrl))
        }
        return
    }

    // Redirect unauthenticated users to login page
    if (!isLoggedIn) {
        return Response.redirect(new URL('/login', req.nextUrl))
    }
}) as unknown as NextMiddleware

// Optionally, don't invoke Middleware on some paths
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
