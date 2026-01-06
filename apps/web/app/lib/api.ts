/**
 * Survey API Hooks
 * Custom hooks for survey CRUD operations using fetch (simpler than tRPC for now)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Survey {
    id: string;
    title: string;
    description?: string;
    status: 'draft' | 'published' | 'closed';
    createdAt: string;
    updatedAt: string;
}

interface SurveyDraft {
    id: string;
    surveyId: string;
    config: unknown;
    updatedAt: string;
}

// Create a new survey
export async function createSurvey(data: { title: string; description?: string }): Promise<Survey> {
    const response = await fetch(`${API_BASE}/api/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create survey');
    }

    return response.json();
}

// Get survey by ID
export async function getSurvey(id: string): Promise<Survey> {
    const response = await fetch(`${API_BASE}/api/surveys/${id}`);

    if (!response.ok) {
        throw new Error('Survey not found');
    }

    return response.json();
}

// Update survey draft config
export async function saveDraft(surveyId: string, config: unknown): Promise<SurveyDraft> {
    const response = await fetch(`${API_BASE}/api/surveys/${surveyId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
    });

    if (!response.ok) {
        throw new Error('Failed to save draft');
    }

    return response.json();
}

// Get survey draft
export async function getDraft(surveyId: string): Promise<SurveyDraft | null> {
    const response = await fetch(`${API_BASE}/api/surveys/${surveyId}/draft`);

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error('Failed to get draft');
    }

    return response.json();
}

// Publish survey
export async function publishSurvey(surveyId: string): Promise<{ versionId: string; shareUrl: string }> {
    const response = await fetch(`${API_BASE}/api/surveys/${surveyId}/publish`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error('Failed to publish survey');
    }

    return response.json();
}

// List all surveys
export async function listSurveys(options?: { status?: string; limit?: number; offset?: number }): Promise<Survey[]> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await fetch(`${API_BASE}/api/surveys?${params}`);

    if (!response.ok) {
        throw new Error('Failed to list surveys');
    }

    return response.json();
}
