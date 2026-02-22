-- Cortex AI Database Setup Script
-- PostgreSQL Database Initialization

-- Create database (run as postgres superuser)
CREATE DATABASE cortex_ai;

-- Connect to the database
\c cortex_ai;

-- Phase 4: Long-Term Knowledge (Vector Memory)
-- Enable the vector extension (requires superuser)
-- Ensure your Postgres installation has pgvector installed.
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables (these will be auto-created by Hibernate, but this is for reference)

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    title VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tool_name VARCHAR(255),
    tool_input TEXT,
    tool_output TEXT,
    agent_decision TEXT
);

-- Agent Tasks Table (Phase 2: Planning & Reasoning)
CREATE TABLE IF NOT EXISTS agent_tasks (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    parent_task_id VARCHAR(255),
    description TEXT NOT NULL,
    tool_name VARCHAR(255),
    tool_input TEXT,
    status VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 5,
    result TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    dependencies TEXT
);

-- Create indexes for performance
CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_is_active ON chat_sessions(is_active);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_agent_tasks_task_id ON agent_tasks(task_id);
CREATE INDEX idx_agent_tasks_session_id ON agent_tasks(session_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_priority ON agent_tasks(priority);
CREATE INDEX idx_agent_tasks_parent_task_id ON agent_tasks(parent_task_id);

-- Grant permissions (adjust username as needed)
GRANT ALL PRIVILEGES ON DATABASE cortex_ai TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
