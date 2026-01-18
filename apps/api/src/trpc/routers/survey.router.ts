/**
 * Survey Router
 * CRUD operations for surveys
 */
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
    CreateSurveySchema,
    UpdateSurveySchema,
    SurveyConfigSchema
} from '@repo/shared/schemas';
import { db } from '../../db';

export const surveyRouter = router({
    /**
     * List all surveys for the current organization
     */
    list: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(20),
            offset: z.number().min(0).default(0),
            status: z.enum(['draft', 'published', 'closed']).optional(),
        }))
        .query(async ({ input, ctx }) => {
            if (ctx.user.role === 'admin') {
                return await db.surveys.listWithOrgs(input);
            }

            if (!ctx.user.orgId) return []; // User has no org, sees nothing
            return await db.surveys.list({ ...input, orgId: ctx.user.orgId });
        }),

    /**
     * Get a single survey by ID
     */
    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const survey = await db.surveys.getById(input.id);
            if (!survey) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Survey not found' });
            }
            if (ctx.user.role !== 'admin' && survey.orgId !== ctx.user.orgId) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return survey;
        }),

    /**
     * Create a new survey
     */
    create: protectedProcedure
        .input(CreateSurveySchema)
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user.orgId) {
                throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'User must belong to an organization to create surveys' });
            }
            const survey = await db.surveys.create({ ...input, orgId: ctx.user.orgId });
            return survey;
        }),

    /**
     * Update survey metadata
     */
    update: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
            data: UpdateSurveySchema,
        }))
        .mutation(async ({ input, ctx }) => {
            const existing = await db.surveys.getById(input.id);
            if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });

            if (ctx.user.role !== 'admin' && existing.orgId !== ctx.user.orgId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            const survey = await db.surveys.update(input.id, input.data);
            return survey;
        }),

    /**
     * Delete a survey
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            const existing = await db.surveys.getById(input.id);
            if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });

            if (ctx.user.role !== 'admin' && existing.orgId !== ctx.user.orgId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            await db.surveys.delete(input.id);
            return { success: true };
        }),

    /**
     * Get the current draft config
     */
    getDraft: protectedProcedure
        .input(z.object({ surveyId: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const survey = await db.surveys.getById(input.surveyId);
            if (!survey) throw new TRPCError({ code: 'NOT_FOUND' });
            if (ctx.user.role !== 'admin' && survey.orgId !== ctx.user.orgId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            const draft = await db.surveyDrafts.getBySurveyId(input.surveyId);
            return draft;
        }),

    /**
     * Update the draft config
     */
    updateDraft: protectedProcedure
        .input(z.object({
            surveyId: z.string().uuid(),
            config: SurveyConfigSchema,
        }))
        .mutation(async ({ input, ctx }) => {
            const survey = await db.surveys.getById(input.surveyId);
            if (!survey) throw new TRPCError({ code: 'NOT_FOUND' });
            if (ctx.user.role !== 'admin' && survey.orgId !== ctx.user.orgId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            const draft = await db.surveyDrafts.upsert(input.surveyId, input.config);
            return draft;
        }),

    /**
     * Publish the current draft as a new version
     */
    publish: protectedProcedure
        .input(z.object({ surveyId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            const survey = await db.surveys.getById(input.surveyId);
            if (!survey) throw new TRPCError({ code: 'NOT_FOUND' });
            if (ctx.user.role !== 'admin' && survey.orgId !== ctx.user.orgId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // 1. Get the current draft
            const draft = await db.surveyDrafts.getBySurveyId(input.surveyId);
            if (!draft) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'No draft found to publish' });
            }

            // 2. Validate the config
            const parseResult = SurveyConfigSchema.safeParse(draft.config);
            if (!parseResult.success) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: `Invalid survey config: ${parseResult.error.message}` });
            }

            // 3. Get the next version number
            const latestVersion = await db.surveyVersions.getLatest(input.surveyId);
            const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

            // 4. Create immutable version
            const version = await db.surveyVersions.create({
                surveyId: input.surveyId,
                versionNumber: nextVersionNumber,
                config: parseResult.data,
            });

            // 5. Update survey status
            await db.surveys.update(input.surveyId, { status: 'published' });

            return version;
        }),

    /**
     * Get all published versions of a survey
     */
    listVersions: protectedProcedure
        .input(z.object({ surveyId: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const survey = await db.surveys.getById(input.surveyId);
            if (!survey) throw new TRPCError({ code: 'NOT_FOUND' });
            if (ctx.user.role !== 'admin' && survey.orgId !== ctx.user.orgId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            const versions = await db.surveyVersions.listBySurveyId(input.surveyId);
            return versions;
        }),

    /**
     * Get a specific published version
     */
    getVersion: protectedProcedure
        .input(z.object({
            surveyId: z.string().uuid(),
            versionId: z.string().uuid(),
        }))
        .query(async ({ input, ctx }) => {
            const survey = await db.surveys.getById(input.surveyId);
            if (!survey) throw new TRPCError({ code: 'NOT_FOUND' });
            if (ctx.user.role !== 'admin' && survey.orgId !== ctx.user.orgId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            const version = await db.surveyVersions.getById(input.versionId);
            if (!version || version.surveyId !== input.surveyId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Version not found' });
            }
            return version;
        }),
});
