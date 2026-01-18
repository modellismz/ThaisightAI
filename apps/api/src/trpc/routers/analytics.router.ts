import { router, protectedProcedure } from '../trpc';
import { db } from '../../db';

export const analyticsRouter = router({
    getDashboard: protectedProcedure.query(async ({ ctx }) => {
        const { user } = ctx;
        let orgId: string | undefined;

        if (user.role !== 'admin') {
            if (!user.orgId) {
                // Return empty stats if user has no org and not admin
                return {
                    globalStats: { totalSurveys: 0, activeSurveys: 0, totalResponses: 0 },
                    dailyTrends: [],
                    recentActivity: [],
                    surveys: []
                };
            }
            orgId = user.orgId;
        }

        const totalSurveys = await db.surveys.countTotal(undefined, orgId);
        const activeSurveys = await db.surveys.countTotal('published', orgId);
        const totalResponses = await db.responses.countTotal(orgId);

        const surveysWithStats = await db.surveys.getDashboardStats(orgId);
        const dailyTrends = await db.responses.getDailyTrends(7, orgId);
        const recentActivity = await db.responses.getRecentActivity(10, orgId);

        return {
            globalStats: {
                totalSurveys,
                activeSurveys,
                totalResponses
            },
            dailyTrends,
            recentActivity,
            surveys: surveysWithStats
        };
    }),
});
