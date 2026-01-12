/**
 * tRPC Client Configuration
 */
import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/api/src/trpc/router';

export const trpc = createTRPCReact<AppRouter>();

export function getReactTRPCClient() {
    return trpc.createClient({
        links: [
            httpBatchLink({
                url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/trpc',
            }),
        ],
    });
}

export function getTRPCClient() {
    return createTRPCProxyClient<AppRouter>({
        links: [
            httpBatchLink({
                url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/trpc',
            }),
        ],
    });
}
