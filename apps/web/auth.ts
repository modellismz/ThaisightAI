import NextAuth from "next-auth"
import type { NextAuthConfig, NextAuthResult } from "next-auth"
import Google from "next-auth/providers/google"
import { getServerTRPCClient } from "./app/lib/trpc-server"

const config = {
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false


      try {
        console.log(`[Auth] Checking access for email: ${user.email}`)
        const trpc = getServerTRPCClient()
        console.log(`[Auth] Fetching user from DB...`)
        const dbUser = await trpc.user.getByEmail.query({ email: user.email })
        console.log(`[Auth] DB User found:`, dbUser)

        if (dbUser && dbUser.role === 'admin') {
          return true
        }
        console.log(`[Auth] Access denied: User not found or not admin`)
      } catch (error) {
        console.error("Auth Error:", error)
      }

      return '/login?error=AccessDenied' // Return URL to redirect to login page with error
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  providers: [Google],
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth }: NextAuthResult = NextAuth(config)
