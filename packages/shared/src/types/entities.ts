/**
 * Entity Type Definitions
 * TypeScript types for database entities
 */

// ============================================
// ============================================
// Organization
// ============================================

export interface Organization {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// User
// ============================================

export type UserRole = 'admin' | 'owner' | 'member';

export interface User {
    id: string;
    orgId?: string | null; // Admin might not have an org, or can view all. Owner/Member belongs to an org.
    email: string;
    name: string | null;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserWithoutPassword extends Omit<User, 'passwordHash'> { }

// ============================================
// Survey
// ============================================

export type SurveyStatus = 'draft' | 'published' | 'closed';

export interface Survey {
    id: string;
    orgId: string;
    ownerId: string | null;
    title: string;
    description: string | null;
    status: SurveyStatus;
    defaultLanguage: string;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface SurveyWithDraft extends Survey {
    draft?: SurveyDraft | null;
}

export interface SurveyWithVersions extends Survey {
    versions: SurveyVersion[];
}

// ============================================
// Survey Draft
// ============================================

export interface SurveyDraft {
    id: string;
    surveyId: string;
    config: unknown; // SurveyConfig from schema
    updatedAt: Date;
    updatedBy: string | null;
}

// ============================================
// Survey Version (Immutable)
// ============================================

export interface SurveyVersion {
    id: string;
    surveyId: string;
    versionNumber: number;
    configUrl: string | null;
    compiledGraph: unknown;
    publishedAt: Date;
    publishedBy: string | null;
}

// ============================================
// Session
// ============================================

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface Session {
    id: string;
    surveyId: string;
    versionId: string;
    resumeToken: string | null;
    status: SessionStatus;
    respondentId: string | null;
    metadata: Record<string, unknown>;
    ipHash: string | null;
    userAgent: string | null;
    startedAt: Date;
    lastActivityAt: Date;
    completedAt: Date | null;
}

// ============================================
// Response Event (Append-only)
// ============================================

export interface ResponseEvent {
    id: number;
    sessionId: string;
    questionId: string;
    blockId: string | null;
    value: unknown;
    recordedAt: Date;
}

// ============================================
// Response (Materialized)
// ============================================

export interface Response {
    id: string;
    sessionId: string;
    surveyId: string;
    versionId: string;
    answers: Record<string, unknown>;
    durationSeconds: number | null;
    completedAt: Date;
}
