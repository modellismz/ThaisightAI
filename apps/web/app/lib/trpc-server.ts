import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/api/src/trpc/router';

export function getServerTRPCClient() {
    return createTRPCProxyClient<AppRouter>({
        links: [
            httpBatchLink({
                url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/trpc',
            }),
        ],
    });
}
