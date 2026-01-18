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
        const dbUser = await trpc.user.getByEmail.query({ email: user.email })
        console.log(`[Auth] DB User found:`, dbUser)

        if (dbUser) {
          return true
        }
        console.log(`[Auth] Access denied: User not found in DB`)
        return '/login?error=AccessDenied'
      } catch (error) {
        console.error("Auth Error:", error)
        return '/login?error=SystemError'
      }
    },
    async jwt({ token, user }) {
      if (user && user.email) {
        const trpc = getServerTRPCClient()
        try {
          const dbUser = await trpc.user.getByEmail.query({ email: user.email })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.orgId = dbUser.orgId
          }
        } catch (error) {
          console.error("JWT Auth Fetch Error:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string | undefined
        session.user.orgId = token.orgId as string | null | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  providers: [Google],
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth }: NextAuthResult = NextAuth(config)
