/**
 * tRPC Base Setup
 * Exports router and procedure utilities
 */
import { initTRPC } from '@trpc/server';
import type { Request } from 'express';

// Context type
export interface Context {
    req?: Request;
    userId?: string;
    orgId?: string;
}

// Create context for each request
export const createContext = ({ req }: { req: Request }): Context => {
    // TODO: Extract user from JWT token
    return {
        req,
        userId: undefined,
        orgId: undefined,
    };
};

// Initialize tRPC
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
