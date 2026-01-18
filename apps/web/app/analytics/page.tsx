
import { auth } from '../../auth';
import { redirect } from 'next/navigation';
import { getServerTRPCClient } from '../lib/trpc-server';
import AnalyticsView from './_components/AnalyticsView';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session) redirect('/api/auth/signin');
    
    // Redirect member to surveys
    if (session.user.role === 'member') {
        redirect('/surveys');
    }

    const trpc = getServerTRPCClient();
    
    try {
        const data = await trpc.analytics.getDashboard.query();
        return <AnalyticsView data={data as any} />;
    } catch (error) {
        console.error("Failed to load dashboard data", error);
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Failed to load dashboard</h2>
                <p>Please try refreshing the page.</p>
            </div>
        );
    }
}
