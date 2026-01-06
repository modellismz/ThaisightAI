/**
 * tRPC Client Configuration
 * Simplified version that works without the API type import
 */
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

// Define a placeholder type - will be replaced with proper type from API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
    return trpc.createClient({
        links: [
            httpBatchLink({
                url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/trpc',
            }),
        ],
    });
}
