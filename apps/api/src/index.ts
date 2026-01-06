/**
 * ThaisightAI API Server
 * Main entry point
 */
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from './trpc/router';
import { db } from './db';
import { SurveyConfigSchema } from '@repo/shared/schemas';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============== REST API Routes ==============

// List surveys
app.get('/api/surveys', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        const status = req.query.status as string | undefined;

        const surveys = await db.surveys.list({ limit, offset, status: status as any });
        res.json(surveys);
    } catch (error) {
        console.error('Error listing surveys:', error);
        res.status(500).json({ error: 'Failed to list surveys' });
    }
});

// Create survey
app.post('/api/surveys', async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }

        const survey = await db.surveys.create({
            title,
            description,
            defaultLanguage: 'en',
        });
        res.status(201).json(survey);
    } catch (error) {
        console.error('Error creating survey:', error);
        res.status(500).json({ error: 'Failed to create survey' });
    }
});

// Get survey by ID
app.get('/api/surveys/:id', async (req, res) => {
    try {
        const survey = await db.surveys.getById(req.params.id);
        if (!survey) {
            res.status(404).json({ error: 'Survey not found' });
            return;
        }
        res.json(survey);
    } catch (error) {
        console.error('Error getting survey:', error);
        res.status(500).json({ error: 'Failed to get survey' });
    }
});

// Update survey
app.patch('/api/surveys/:id', async (req, res) => {
    try {
        const survey = await db.surveys.update(req.params.id, req.body);
        res.json(survey);
    } catch (error) {
        console.error('Error updating survey:', error);
        res.status(500).json({ error: 'Failed to update survey' });
    }
});

// Delete survey
app.delete('/api/surveys/:id', async (req, res) => {
    try {
        await db.surveys.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting survey:', error);
        res.status(500).json({ error: 'Failed to delete survey' });
    }
});

// Get survey draft
app.get('/api/surveys/:id/draft', async (req, res) => {
    try {
        const draft = await db.surveyDrafts.getBySurveyId(req.params.id);
        if (!draft) {
            res.status(404).json({ error: 'Draft not found' });
            return;
        }
        res.json(draft);
    } catch (error) {
        console.error('Error getting draft:', error);
        res.status(500).json({ error: 'Failed to get draft' });
    }
});

// Get published survey for respondents
app.get('/api/surveys/:id/published', async (req, res) => {
    try {
        const surveyId = req.params.id;

        // Get latest published version
        const version = await db.surveyVersions.getLatest(surveyId);
        if (!version) {
            res.status(404).json({ error: 'Survey not published yet' });
            return;
        }

        res.json({
            surveyId,
            versionId: version.id,
            versionNumber: version.versionNumber,
            config: version.compiledGraph,
        });
    } catch (error) {
        console.error('Error getting published survey:', error);
        res.status(500).json({ error: 'Failed to load survey' });
    }
});

// Save survey draft
app.put('/api/surveys/:id/draft', async (req, res) => {
    try {
        const { config } = req.body;

        if (!config) {
            res.status(400).json({ error: 'Config is required' });
            return;
        }

        const draft = await db.surveyDrafts.upsert(req.params.id, config);
        res.json(draft);
    } catch (error) {
        console.error('Error saving draft:', error);
        res.status(500).json({ error: 'Failed to save draft' });
    }
});

// Publish survey
app.post('/api/surveys/:id/publish', async (req, res) => {
    try {
        const surveyId = req.params.id;

        // Get current draft
        const draft = await db.surveyDrafts.getBySurveyId(surveyId);
        if (!draft) {
            res.status(400).json({ error: 'No draft found to publish' });
            return;
        }

        // Validate config
        const parseResult = SurveyConfigSchema.safeParse(draft.config);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Invalid survey config', details: parseResult.error.message });
            return;
        }

        // Get next version number
        const latestVersion = await db.surveyVersions.getLatest(surveyId);
        const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

        // Create immutable version
        const version = await db.surveyVersions.create({
            surveyId,
            versionNumber: nextVersionNumber,
            config: parseResult.data,
        });

        // Update survey status
        await db.surveys.update(surveyId, { status: 'published' });

        // Generate share URL
        const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/${surveyId}`;

        res.json({
            versionId: version.id,
            versionNumber: version.versionNumber,
            shareUrl
        });
    } catch (error) {
        console.error('Error publishing survey:', error);
        res.status(500).json({ error: 'Failed to publish survey' });
    }
});

// Get survey responses
app.get('/api/surveys/:id/responses', async (req, res) => {
    try {
        const surveyId = req.params.id;
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;

        const responses = await db.responses.getBySurveyId(surveyId, limit, offset);
        res.json(responses);
    } catch (error) {
        console.error('Error getting responses:', error);
        res.status(500).json({ error: 'Failed to get responses' });
    }
});

// Get survey analytics summary
app.get('/api/surveys/:id/analytics', async (req, res) => {
    try {
        const surveyId = req.params.id;

        // Get all responses
        const responses = await db.responses.getBySurveyId(surveyId, 1000, 0);

        // Get survey draft for question metadata  
        const draft = await db.surveyDrafts.getBySurveyId(surveyId);
        const config = draft?.config as any;

        // Calculate stats
        const totalResponses = responses.length;
        const avgDuration = responses.length > 0
            ? Math.round(responses.reduce((sum: number, r: any) => sum + (r.duration_seconds || 0), 0) / responses.length)
            : 0;

        // Aggregate answers by question
        const questionStats: Record<string, any> = {};

        for (const response of responses) {
            const answers = response.answers || {};
            for (const [questionId, value] of Object.entries(answers)) {
                if (!questionStats[questionId]) {
                    questionStats[questionId] = {
                        questionId,
                        values: [],
                        counts: {},
                    };
                }
                questionStats[questionId].values.push(value);

                // Count for choice-based questions
                const key = String(value);
                questionStats[questionId].counts[key] = (questionStats[questionId].counts[key] || 0) + 1;
            }
        }

        res.json({
            surveyId,
            totalResponses,
            avgDurationSeconds: avgDuration,
            questionStats,
            config,
            responses: responses.slice(0, 50), // Sample of responses
        });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

// Export responses as CSV
app.get('/api/surveys/:id/export', async (req, res) => {
    try {
        const surveyId = req.params.id;
        const responses = await db.responses.getBySurveyId(surveyId, 10000, 0);

        if (responses.length === 0) {
            res.status(404).json({ error: 'No responses to export' });
            return;
        }

        // Get all unique question IDs
        const allQuestionIds = new Set<string>();
        for (const response of responses) {
            const answers = response.answers || {};
            Object.keys(answers).forEach(id => allQuestionIds.add(id));
        }

        // Build CSV header
        const headers = ['Response ID', 'Completed At', 'Duration (s)', ...Array.from(allQuestionIds)];
        const rows = responses.map((r: any) => {
            const answers = r.answers || {};
            return [
                r.id,
                r.completed_at,
                r.duration_seconds,
                ...Array.from(allQuestionIds).map(id => {
                    const val = answers[id];
                    if (Array.isArray(val)) return val.join('; ');
                    return val ?? '';
                }),
            ];
        });

        // Generate CSV
        const csv = [
            headers.join(','),
            ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="survey-${surveyId}-responses.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting responses:', error);
        res.status(500).json({ error: 'Failed to export' });
    }
});

// ============== tRPC Handler ==============
app.use('/trpc', createExpressMiddleware({
    router: appRouter,
    createContext,
}));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`);
    console.log(`🔌 REST API: http://localhost:${PORT}/api`);
});

// Export the router type for the client
export type { AppRouter } from './trpc/router';
