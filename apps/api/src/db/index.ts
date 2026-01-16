/**
 * Database Layer
 * Abstraction over PostgreSQL using pg
 */
import { Pool } from 'pg';
import type {
    Survey,
    SurveyDraft,
    SurveyVersion,
    Session,
    ResponseEvent,
    Response as SurveyResponse
} from '@repo/shared/types';
import type { CreateSurvey, UpdateSurvey, SurveyConfig } from '@repo/shared/schemas';

// Create connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'thaisight',
    password: process.env.DB_PASSWORD || 'thaisight_dev',
    database: process.env.DB_NAME || 'thaisight',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// ============================================
// Surveys
// ============================================

const surveys = {
    async list(params: { limit: number; offset: number; status?: string }) {
        const { limit, offset, status } = params;
        let query = 'SELECT * FROM surveys';
        const values: unknown[] = [];

        if (status) {
            query += ' WHERE status = $1';
            values.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows as Survey[];
    },

    async getById(id: string) {
        const result = await pool.query(
            'SELECT * FROM surveys WHERE id = $1',
            [id]
        );
        return result.rows[0] as Survey | undefined;
    },

    async create(data: CreateSurvey) {
        const result = await pool.query(
            `INSERT INTO surveys (title, description, default_language, status)
       VALUES ($1, $2, $3, 'draft')
       RETURNING *`,
            [data.title, data.description || null, data.defaultLanguage || 'en']
        );

        const survey = result.rows[0] as Survey;

        // Create initial empty draft
        await pool.query(
            `INSERT INTO survey_drafts (survey_id, config)
       VALUES ($1, $2)`,
            [survey.id, JSON.stringify({ version: '1.0', blocks: [], settings: {} })]
        );

        return survey;
    },

    async update(id: string, data: UpdateSurvey) {
        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(data.status);
        }

        if (updates.length === 0) return null;

        values.push(id);
        const result = await pool.query(
            `UPDATE surveys SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] as Survey;
    },

    async delete(id: string) {
        await pool.query('DELETE FROM surveys WHERE id = $1', [id]);
    },
};

// ============================================
// Survey Drafts
// ============================================

const surveyDrafts = {
    async getBySurveyId(surveyId: string) {
        const result = await pool.query(
            'SELECT * FROM survey_drafts WHERE survey_id = $1',
            [surveyId]
        );
        return result.rows[0] as SurveyDraft | undefined;
    },

    async upsert(surveyId: string, config: SurveyConfig) {
        const result = await pool.query(
            `INSERT INTO survey_drafts (survey_id, config)
       VALUES ($1, $2)
       ON CONFLICT (survey_id) 
       DO UPDATE SET config = $2, updated_at = NOW()
       RETURNING *`,
            [surveyId, JSON.stringify(config)]
        );
        return result.rows[0] as SurveyDraft;
    },
};

// ============================================
// Survey Versions
// ============================================

const surveyVersions = {
    async getById(id: string) {
        const result = await pool.query(
            'SELECT id, survey_id, version_number, compiled_graph, config_url, published_at FROM survey_versions WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) return undefined;
        const row = result.rows[0];
        return {
            id: row.id,
            surveyId: row.survey_id,
            versionNumber: row.version_number,
            compiledGraph: row.compiled_graph,
            configUrl: row.config_url,
            publishedAt: row.published_at,
        } as SurveyVersion;
    },

    async getLatest(surveyId: string) {
        const result = await pool.query(
            `SELECT id, survey_id, version_number, compiled_graph, config_url, published_at 
       FROM survey_versions 
       WHERE survey_id = $1 
       ORDER BY version_number DESC 
       LIMIT 1`,
            [surveyId]
        );
        if (result.rows.length === 0) return undefined;
        const row = result.rows[0];
        return {
            id: row.id,
            surveyId: row.survey_id,
            versionNumber: row.version_number,
            compiledGraph: row.compiled_graph,
            configUrl: row.config_url,
            publishedAt: row.published_at,
        } as SurveyVersion;
    },

    async listBySurveyId(surveyId: string) {
        const result = await pool.query(
            `SELECT * FROM survey_versions 
       WHERE survey_id = $1 
       ORDER BY version_number DESC`,
            [surveyId]
        );
        return result.rows as SurveyVersion[];
    },

    async create(data: { surveyId: string; versionNumber: number; config: SurveyConfig }) {
        const result = await pool.query(
            `INSERT INTO survey_versions (survey_id, version_number, compiled_graph)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [data.surveyId, data.versionNumber, JSON.stringify(data.config)]
        );
        return result.rows[0] as SurveyVersion;
    },
};

// ============================================
// Sessions
// ============================================

// Helper to map snake_case PostgreSQL row to camelCase Session type
function mapSessionRow(row: Record<string, unknown>): Session {
    return {
        id: row.id as string,
        surveyId: row.survey_id as string,
        versionId: row.version_id as string,
        resumeToken: row.resume_token as string | null,
        status: row.status as Session['status'],
        respondentId: row.respondent_id as string | null,
        metadata: row.metadata as Record<string, unknown>,
        ipHash: row.ip_hash as string | null,
        userAgent: row.user_agent as string | null,
        startedAt: row.started_at as Date,
        lastActivityAt: row.last_activity_at as Date,
        completedAt: row.completed_at as Date | null,
    };
}

const sessions = {
    async getById(id: string) {
        const result = await pool.query(
            'SELECT * FROM sessions WHERE id = $1',
            [id]
        );
        return result.rows[0] ? mapSessionRow(result.rows[0]) : undefined;
    },

    async getByResumeToken(token: string) {
        const result = await pool.query(
            'SELECT * FROM sessions WHERE resume_token = $1',
            [token]
        );
        return result.rows[0] ? mapSessionRow(result.rows[0]) : undefined;
    },

    async create(data: {
        surveyId: string;
        versionId: string;
        resumeToken: string;
        metadata: Record<string, unknown>;
        ipHash: string | null;
        userAgent: string | null;
    }) {
        const result = await pool.query(
            `INSERT INTO sessions (survey_id, version_id, resume_token, metadata, ip_hash, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [data.surveyId, data.versionId, data.resumeToken, JSON.stringify(data.metadata), data.ipHash, data.userAgent]
        );
        return mapSessionRow(result.rows[0]);
    },

    async updateActivity(id: string) {
        await pool.query(
            'UPDATE sessions SET last_activity_at = NOW() WHERE id = $1',
            [id]
        );
    },

    async complete(id: string) {
        await pool.query(
            `UPDATE sessions SET status = 'completed', completed_at = NOW() WHERE id = $1`,
            [id]
        );
    },
};

// ============================================
// Response Events
// ============================================

const responseEvents = {
    async getBySessionId(sessionId: string) {
        const result = await pool.query(
            'SELECT id, session_id, question_id, value, recorded_at FROM response_events WHERE session_id = $1 ORDER BY recorded_at ASC',
            [sessionId]
        );
        return result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            questionId: row.question_id,
            value: row.value,
            recordedAt: row.recorded_at,
        })) as ResponseEvent[];
    },

    async createMany(events: { sessionId: string; questionId: string; value: unknown }[]) {
        if (events.length === 0) return;

        const values: unknown[] = [];
        const placeholders: string[] = [];

        events.forEach((event, i) => {
            const offset = i * 3;
            placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
            values.push(event.sessionId, event.questionId, JSON.stringify(event.value));
        });

        await pool.query(
            `INSERT INTO response_events (session_id, question_id, value) VALUES ${placeholders.join(', ')}`,
            values
        );
    },
};

// ============================================
// Responses (Materialized)
// ============================================

const responses = {
    async create(data: {
        sessionId: string;
        surveyId: string;
        versionId: string;
        answers: Record<string, unknown>;
        durationSeconds: number;
    }) {
        const result = await pool.query(
            `INSERT INTO responses (session_id, survey_id, version_id, answers, duration_seconds)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [data.sessionId, data.surveyId, data.versionId, JSON.stringify(data.answers), data.durationSeconds]
        );
        return result.rows[0] as SurveyResponse;
    },

    async getBySurveyId(surveyId: string, limit = 100, offset = 0) {
        const result = await pool.query(
            `SELECT * FROM responses 
       WHERE survey_id = $1 
       ORDER BY completed_at DESC 
       LIMIT $2 OFFSET $3`,
            [surveyId, limit, offset]
        );
        return result.rows as SurveyResponse[];
    },

    async countBySurveyId(surveyId: string): Promise<number> {
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM responses WHERE survey_id = $1',
            [surveyId]
        );
        return parseInt(result.rows[0].count, 10);
    },
};

// ============================================
// Users
// ============================================

const users = {
    async getByEmail(email: string) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] as { id: string; email: string; role: string } | undefined;
    },
};

// Export database interface
export const db = {
    pool,
    users,
    surveys,
    surveyDrafts,
    surveyVersions,
    sessions,
    responseEvents,
    responses,
};
