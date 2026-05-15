CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =========================
-- REFRESH TOKENS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL, -- store hashed token
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- =========================
-- OTP TABLE (for signup & forgot password)
-- =========================
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    otp_code TEXT NOT NULL, -- store hashed OTP
    type VARCHAR(50) CHECK (type IN ('signup', 'forgot_password')),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id);

-- =========================
-- FOLDERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);

-- Prevent duplicate folder names per user (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_user_name 
ON folders(user_id, LOWER(name));

-- =========================
-- NOTES TABLE
-- =========================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    title VARCHAR(255),
    content TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_notes_fts ON notes
USING GIN (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
);

-- =========================
-- TAGS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- =========================
-- NOTE TAGS (MANY-TO-MANY)
-- =========================
CREATE TABLE IF NOT EXISTS note_tags (
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

-- =========================
-- NOTE LINKS (GRAPH FEATURE)
-- =========================
CREATE TABLE IF NOT EXISTS note_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_note_id, target_note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);

-- =========================
-- AI OUTPUTS
-- =========================
CREATE TABLE IF NOT EXISTS ai_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    input_text TEXT,
    output_text TEXT,
    type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_outputs_user_id ON ai_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_note_id ON ai_outputs(note_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_note_type ON ai_outputs(note_id, type);

-- Safe column additions for existing databases (idempotent)
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES notes(id) ON DELETE CASCADE;
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- =========================
-- NOTE EMBEDDINGS (PHASE 2 — SEMANTIC SEARCH)
-- Requires pgvector extension (enabled on Neon by default)
-- =========================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS note_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_user_id ON note_embeddings(user_id);

-- HNSW index enables fast approximate nearest-neighbor search at scale
-- m=16 (connections per layer), ef_construction=64 (build-time quality)
CREATE INDEX IF NOT EXISTS idx_note_embeddings_hnsw
ON note_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);