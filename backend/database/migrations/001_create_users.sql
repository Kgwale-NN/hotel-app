BEGIN;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'guest',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_role_check
        CHECK (role IN ('guest', 'admin')),

    CONSTRAINT users_name_check
        CHECK (LENGTH(TRIM(full_name)) > 0)
);

CREATE UNIQUE INDEX users_email_unique
    ON users (LOWER(email));

CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT oauth_accounts_identity_unique
        UNIQUE (provider, provider_user_id)
);

CREATE INDEX oauth_accounts_user_id_index
    ON oauth_accounts (user_id);

COMMIT;