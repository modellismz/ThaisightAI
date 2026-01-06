/**
 * Session Router
 * Respondent session management
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../../db';
import crypto from 'crypto';

export const sessionRouter = router({
    /**
     * Start a new survey session
     */
    start: publicProcedure
        .input(z.object({
            surveyId: z.string().uuid(),
            versionId: z.string().uuid().optional(), // If not provided, use latest
            metadata: z.record(z.string()).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            // Get the version to use
            let versionId = input.versionId;

            if (!versionId) {
                const latestVersion = await db.surveyVersions.getLatest(input.surveyId);
                if (!latestVersion) {
                    throw new Error('No published version available');
                }
                versionId = latestVersion.id;
            }

            // Generate resume token
            const resumeToken = crypto.randomBytes(32).toString('hex');

            // Create session
            const session = await db.sessions.create({
                surveyId: input.surveyId,
                versionId,
                resumeToken,
                metadata: input.metadata || {},
                ipHash: ctx.req ? hashIP(ctx.req.ip || '') : null,
                userAgent: ctx.req?.get('user-agent') || null,
            });

            return {
                sessionId: session.id,
                resumeToken: session.resumeToken,
                versionId,
            };
        }),

    /**
     * Resume an existing session
     */
    resume: publicProcedure
        .input(z.object({
            resumeToken: z.string(),
        }))
        .query(async ({ input }) => {
            const session = await db.sessions.getByResumeToken(input.resumeToken);

            if (!session) {
                throw new Error('Session not found');
            }

            if (session.status === 'completed') {
                throw new Error('Session already completed');
            }

            // Get the survey version config
            const version = await db.surveyVersions.getById(session.versionId);
            if (!version) {
                throw new Error('Survey version not found');
            }

            // Get current answers
            const events = await db.responseEvents.getBySessionId(session.id);
            const answers: Record<string, unknown> = {};

            // Build current state from events (last value wins)
            for (const event of events) {
                answers[event.questionId] = event.value;
            }

            return {
                session,
                config: version.compiledGraph || version.configUrl,
                answers,
            };
        }),

    /**
     * Save answer(s) for current page
     */
    saveAnswers: publicProcedure
        .input(z.object({
            sessionId: z.string().uuid(),
            answers: z.record(z.unknown()),
            idempotencyKey: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            // Check session is still valid
            const session = await db.sessions.getById(input.sessionId);
            if (!session || session.status !== 'in_progress') {
                throw new Error('Invalid or completed session');
            }

            // Save each answer as an event
            const events = Object.entries(input.answers).map(([questionId, value]) => ({
                sessionId: input.sessionId,
                questionId,
                value,
            }));

            await db.responseEvents.createMany(events);

            // Update last activity
            await db.sessions.updateActivity(input.sessionId);

            return { success: true };
        }),

    /**
     * Submit completed survey
     */
    submit: publicProcedure
        .input(z.object({
            sessionId: z.string().uuid(),
            idempotencyKey: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            // Get session
            const session = await db.sessions.getById(input.sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            if (session.status === 'completed') {
                // Idempotent - already submitted
                return { success: true, alreadySubmitted: true };
            }

            // Get all answer events and build final response
            const events = await db.responseEvents.getBySessionId(input.sessionId);
            const answers: Record<string, unknown> = {};

            for (const event of events) {
                answers[event.questionId] = event.value;
            }

            // Calculate duration
            const durationSeconds = Math.floor(
                (Date.now() - new Date(session.startedAt).getTime()) / 1000
            );

            // Create materialized response
            await db.responses.create({
                sessionId: input.sessionId,
                surveyId: session.surveyId,
                versionId: session.versionId,
                answers,
                durationSeconds,
            });

            // Mark session as completed
            await db.sessions.complete(input.sessionId);

            return { success: true, alreadySubmitted: false };
        }),

    /**
     * Get session status
     */
    getStatus: publicProcedure
        .input(z.object({ sessionId: z.string().uuid() }))
        .query(async ({ input }) => {
            const session = await db.sessions.getById(input.sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            return {
                status: session.status,
                startedAt: session.startedAt,
                completedAt: session.completedAt,
            };
        }),
});

// Helper to hash IP for privacy
function hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}
