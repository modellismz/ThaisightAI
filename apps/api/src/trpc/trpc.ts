/**
 * tRPC Base Setup
 * Exports router and procedure utilities
 */
import { initTRPC, TRPCError } from '@trpc/server';
import type { Request } from 'express';
import { db } from '../db';
import type { User } from '@repo/shared/types';

// Context type
export interface Context {
    req?: Request;
    user?: User;
}

// Create context for each request
export const createContext = async ({ req }: { req: Request }): Promise<Context> => {
    const email = req.headers['x-user-email'] as string;
    let user: User | undefined;

    if (email) {
        try {
            user = await db.users.getByEmail(email);
        } catch (error) {
            console.error('Error fetching user context:', error);
        }
    }

    return {
        req,
        user,
    };
};

// Initialize tRPC
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
    const { ctx } = opts;
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return opts.next({
        ctx: {
            user: ctx.user,
        },
    });
});
