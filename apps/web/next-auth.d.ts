
import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            role?: string
            orgId?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        role?: string
        orgId?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        role?: string
        orgId?: string | null
    }
}
