-- ThaisightAI Survey Platform - Database Schema
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(org_id);

-- Surveys
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, closed
    default_language VARCHAR(10) DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_surveys_org ON surveys(org_id);
CREATE INDEX idx_surveys_owner ON surveys(owner_id);
CREATE INDEX idx_surveys_status ON surveys(status);

-- Survey Drafts (mutable working copy)
CREATE TABLE survey_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE UNIQUE,
    config JSONB NOT NULL DEFAULT '{"blocks": [], "settings": {}}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Survey Versions (immutable published versions)
CREATE TABLE survey_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    config_url VARCHAR(500), -- S3 path to immutable JSON
    compiled_graph JSONB, -- Pre-computed navigation graph
    published_at TIMESTAMPTZ DEFAULT NOW(),
    published_by UUID REFERENCES users(id),
    UNIQUE(survey_id, version_number)
);

CREATE INDEX idx_survey_versions_survey ON survey_versions(survey_id);

-- Respondent Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    version_id UUID REFERENCES survey_versions(id) ON DELETE CASCADE,
    resume_token VARCHAR(64) UNIQUE,
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    respondent_id VARCHAR(255), -- optional identifier
    metadata JSONB DEFAULT '{}', -- embedded data, UTM params, etc.
    ip_hash VARCHAR(64), -- hashed for privacy
    user_agent TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_survey ON sessions(survey_id);
CREATE INDEX idx_sessions_version ON sessions(version_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_resume_token ON sessions(resume_token);

-- Response Events (append-only log of all answers)
CREATE TABLE response_events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    block_id VARCHAR(100),
    value JSONB NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_response_events_session ON response_events(session_id);
CREATE INDEX idx_response_events_recorded ON response_events(recorded_at);

-- Responses (materialized final answers for fast queries)
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    version_id UUID REFERENCES survey_versions(id) ON DELETE CASCADE,
    answers JSONB NOT NULL, -- { questionId: value }
    duration_seconds INTEGER, -- time to complete
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_survey ON responses(survey_id);
CREATE INDEX idx_responses_version ON responses(version_id);
CREATE INDEX idx_responses_completed ON responses(completed_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_drafts_updated_at BEFORE UPDATE ON survey_drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
