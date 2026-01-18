'use client';

import { useState, useRef, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, getReactTRPCClient } from './trpc';

export function TRPCProvider({ children, user }: { children: React.ReactNode, user?: { email?: string | null } }) {
    const userRef = useRef(user);

    // Update ref when user changes
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                refetchOnWindowFocus: false,
            },
        },
    }));

    const [trpcClient] = useState(() => getReactTRPCClient(() => userRef.current));

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
}
