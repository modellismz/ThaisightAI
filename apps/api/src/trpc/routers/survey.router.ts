/**
 * Survey Router
 * CRUD operations for surveys
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
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
    list: publicProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(20),
            offset: z.number().min(0).default(0),
            status: z.enum(['draft', 'published', 'closed']).optional(),
        }))
        .query(async ({ input }) => {
            const surveys = await db.surveys.list(input);
            return surveys;
        }),

    /**
     * Get a single survey by ID
     */
    getById: publicProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input }) => {
            const survey = await db.surveys.getById(input.id);
            if (!survey) {
                throw new Error('Survey not found');
            }
            return survey;
        }),

    /**
     * Create a new survey
     */
    create: publicProcedure
        .input(CreateSurveySchema)
        .mutation(async ({ input }) => {
            const survey = await db.surveys.create(input);
            return survey;
        }),

    /**
     * Update survey metadata
     */
    update: publicProcedure
        .input(z.object({
            id: z.string().uuid(),
            data: UpdateSurveySchema,
        }))
        .mutation(async ({ input }) => {
            const survey = await db.surveys.update(input.id, input.data);
            return survey;
        }),

    /**
     * Delete a survey
     */
    delete: publicProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input }) => {
            await db.surveys.delete(input.id);
            return { success: true };
        }),

    /**
     * Get the current draft config
     */
    getDraft: publicProcedure
        .input(z.object({ surveyId: z.string().uuid() }))
        .query(async ({ input }) => {
            const draft = await db.surveyDrafts.getBySurveyId(input.surveyId);
            return draft;
        }),

    /**
     * Update the draft config
     */
    updateDraft: publicProcedure
        .input(z.object({
            surveyId: z.string().uuid(),
            config: SurveyConfigSchema,
        }))
        .mutation(async ({ input }) => {
            const draft = await db.surveyDrafts.upsert(input.surveyId, input.config);
            return draft;
        }),

    /**
     * Publish the current draft as a new version
     */
    publish: publicProcedure
        .input(z.object({ surveyId: z.string().uuid() }))
        .mutation(async ({ input }) => {
            // 1. Get the current draft
            const draft = await db.surveyDrafts.getBySurveyId(input.surveyId);
            if (!draft) {
                throw new Error('No draft found to publish');
            }

            // 2. Validate the config
            const parseResult = SurveyConfigSchema.safeParse(draft.config);
            if (!parseResult.success) {
                throw new Error(`Invalid survey config: ${parseResult.error.message}`);
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
    listVersions: publicProcedure
        .input(z.object({ surveyId: z.string().uuid() }))
        .query(async ({ input }) => {
            const versions = await db.surveyVersions.listBySurveyId(input.surveyId);
            return versions;
        }),

    /**
     * Get a specific published version
     */
    getVersion: publicProcedure
        .input(z.object({
            surveyId: z.string().uuid(),
            versionId: z.string().uuid(),
        }))
        .query(async ({ input }) => {
            const version = await db.surveyVersions.getById(input.versionId);
            if (!version || version.surveyId !== input.surveyId) {
                throw new Error('Version not found');
            }
            return version;
        }),
});
