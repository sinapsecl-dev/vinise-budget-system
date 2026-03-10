-- =============================================================================
-- VINISE Budget System — Esquema de Base de Datos (Supabase/PostgreSQL)
-- Parte 1: Tablas, Constraints, Triggers
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Función auxiliar: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── USERS (vinculada a Supabase Auth) ───

CREATE TABLE users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-crear perfil al registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'editor')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── COMPANIES ───

CREATE TABLE companies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ITEMS ───

CREATE TABLE items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                TEXT NOT NULL,
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    partition_type      TEXT NOT NULL CHECK (partition_type IN (
                            'EMPALME', 'OOEE', 'OOCC', 'RED_DISTRIBUCION', 'INDUSTRIAL', 'OTRO')),
    description         TEXT NOT NULL,
    unit                TEXT NOT NULL DEFAULT 'CU' CHECK (unit IN ('CU','M','ML','M2','M3','GL','KG','UN','HR')),
    material_value_clp  INTEGER NOT NULL CHECK (material_value_clp >= 0 AND material_value_clp <= 999999999),
    hh_value_clp        INTEGER NOT NULL CHECK (hh_value_clp >= 0 AND hh_value_clp <= 999999999),
    default_margin      DECIMAL(5,4) NOT NULL DEFAULT 0.2000 CHECK (default_margin >= 0 AND default_margin <= 1),
    is_active           BOOLEAN NOT NULL DEFAULT true,
    last_reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_item_code_company UNIQUE (code, company_id)
);

CREATE TRIGGER trg_items_updated_at
    BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── GENERAL EXPENSES CATALOG ───

CREATE TABLE general_expenses_catalog (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    default_value_clp   INTEGER NOT NULL CHECK (default_value_clp >= 0),
    unit                TEXT NOT NULL DEFAULT 'GL',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_gec_updated_at
    BEFORE UPDATE ON general_expenses_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── CLIENTS ───

CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name    TEXT NOT NULL,
    contact_name    TEXT,
    city            TEXT,
    phone           TEXT CHECK (phone IS NULL OR phone ~ '^\+56\s?9\s?\d{4}\s?\d{4}$'),
    email           TEXT CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── BUDGETS ───

CREATE TABLE budgets (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    TEXT NOT NULL,
    revision                INTEGER NOT NULL DEFAULT 0,
    parent_budget_id        UUID REFERENCES budgets(id),
    client_id               UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_name            TEXT,
    project_location        TEXT,
    status                  TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','sent','partially_awarded','awarded','closed')),
    uf_value_at_creation    DECIMAL(12,2) NOT NULL,
    uf_value_at_send        DECIMAL(12,2),
    sent_at                 TIMESTAMPTZ,
    global_margin           DECIMAL(5,4) NOT NULL DEFAULT 0.2000 CHECK (global_margin >= 0 AND global_margin <= 1),
    considerations          TEXT DEFAULT '',
    proposal_duration       TEXT DEFAULT '30 días corridos',
    created_by              UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_budget_code_revision UNIQUE (code, revision)
);

CREATE SEQUENCE budget_code_seq START WITH 1 INCREMENT BY 1;

CREATE TRIGGER trg_budgets_updated_at
    BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── BUDGET PARTITIONS ───

CREATE TABLE budget_partitions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id   UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    number      INTEGER NOT NULL,
    name        TEXT NOT NULL,
    is_awarded  BOOLEAN NOT NULL DEFAULT false,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_partition_number UNIQUE (budget_id, number)
);

CREATE TRIGGER trg_partitions_updated_at
    BEFORE UPDATE ON budget_partitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── BUDGET LINES ───

CREATE TABLE budget_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partition_id        UUID NOT NULL REFERENCES budget_partitions(id) ON DELETE CASCADE,
    item_id             UUID REFERENCES items(id) ON DELETE SET NULL,
    custom_description  TEXT NOT NULL,
    quantity            DECIMAL(10,2) NOT NULL CHECK (quantity > 0 AND quantity <= 99999),
    unit                TEXT NOT NULL DEFAULT 'CU',
    material_value_clp  INTEGER NOT NULL CHECK (material_value_clp >= 0),
    hh_value_clp        INTEGER NOT NULL CHECK (hh_value_clp >= 0),
    line_margin         DECIMAL(5,4) CHECK (line_margin IS NULL OR (line_margin >= 0 AND line_margin <= 1)),
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          UUID REFERENCES users(id)
);

CREATE TRIGGER trg_lines_updated_at
    BEFORE UPDATE ON budget_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── BUDGET GENERAL EXPENSES ───

CREATE TABLE budget_general_expenses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id   UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    value_clp   INTEGER NOT NULL CHECK (value_clp >= 0),
    quantity    DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    allocation  TEXT NOT NULL DEFAULT 'A' CHECK (allocation = 'A' OR allocation ~ '^\d+$'),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON budget_general_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── AUDIT LOG (INMUTABLE) ───

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id       UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    action          TEXT NOT NULL,
    entity_type     TEXT,
    entity_id       UUID,
    field_changed   TEXT,
    old_value       TEXT,
    new_value       TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── UF CACHE ───

CREATE TABLE uf_cache (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date        DATE NOT NULL UNIQUE,
    value       DECIMAL(12,2) NOT NULL,
    source      TEXT NOT NULL DEFAULT 'cmf_api',
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
