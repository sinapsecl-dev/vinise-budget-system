-- =============================================================================
-- VINISE Budget System — Esquema de Base de Datos (Supabase/PostgreSQL)
-- Parte 2: Índices, Audit Triggers, RLS Policies, Seed Data
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX idx_items_code_trgm ON items USING gin (code gin_trgm_ops);
CREATE INDEX idx_items_desc_trgm ON items USING gin (description gin_trgm_ops);
CREATE INDEX idx_items_company ON items (company_id);
CREATE INDEX idx_items_type ON items (partition_type);
CREATE INDEX idx_items_active ON items (is_active);
CREATE INDEX idx_items_reviewed ON items (last_reviewed_at);
CREATE INDEX idx_budgets_status ON budgets (status);
CREATE INDEX idx_budgets_client ON budgets (client_id);
CREATE INDEX idx_budgets_created_by ON budgets (created_by);
CREATE INDEX idx_budgets_code ON budgets (code);
CREATE INDEX idx_budgets_date ON budgets (created_at DESC);
CREATE INDEX idx_partitions_budget ON budget_partitions (budget_id);
CREATE INDEX idx_lines_partition ON budget_lines (partition_id);
CREATE INDEX idx_lines_item ON budget_lines (item_id);
CREATE INDEX idx_expenses_budget ON budget_general_expenses (budget_id);
CREATE INDEX idx_audit_budget ON audit_log (budget_id);
CREATE INDEX idx_audit_date ON audit_log (created_at DESC);
CREATE INDEX idx_audit_user ON audit_log (user_id);
CREATE INDEX idx_clients_name_trgm ON clients USING gin (company_name gin_trgm_ops);
CREATE INDEX idx_uf_date ON uf_cache (date DESC);

-- ═══════════════════════════════════════════════════════════════
-- AUDIT TRIGGERS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION audit_budget_line_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_budget_id UUID;
    v_user_id UUID;
BEGIN
    SELECT bp.budget_id INTO v_budget_id
    FROM budget_partitions bp WHERE bp.id = COALESCE(NEW.partition_id, OLD.partition_id);
    v_user_id := COALESCE(NEW.updated_by, OLD.updated_by);

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (budget_id, user_id, action, entity_type, entity_id, field_changed, new_value)
        VALUES (v_budget_id, v_user_id, 'item_added', 'budget_line', NEW.id, 'line', NEW.custom_description);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
            INSERT INTO audit_log (budget_id, user_id, action, entity_type, entity_id, field_changed, old_value, new_value)
            VALUES (v_budget_id, v_user_id, 'quantity_changed', 'budget_line', NEW.id, 'quantity', OLD.quantity::TEXT, NEW.quantity::TEXT);
        END IF;
        IF OLD.line_margin IS DISTINCT FROM NEW.line_margin THEN
            INSERT INTO audit_log (budget_id, user_id, action, entity_type, entity_id, field_changed, old_value, new_value)
            VALUES (v_budget_id, v_user_id, 'margin_changed', 'budget_line', NEW.id, 'line_margin',
                    COALESCE(OLD.line_margin::TEXT, 'NULL'), COALESCE(NEW.line_margin::TEXT, 'NULL'));
        END IF;
        IF OLD.custom_description IS DISTINCT FROM NEW.custom_description THEN
            INSERT INTO audit_log (budget_id, user_id, action, entity_type, entity_id, field_changed, old_value, new_value)
            VALUES (v_budget_id, v_user_id, 'description_changed', 'budget_line', NEW.id, 'custom_description',
                    OLD.custom_description, NEW.custom_description);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (budget_id, user_id, action, entity_type, entity_id, field_changed, old_value)
        VALUES (v_budget_id, v_user_id, 'item_removed', 'budget_line', OLD.id, 'line', OLD.custom_description);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_budget_lines
    AFTER INSERT OR UPDATE OR DELETE ON budget_lines
    FOR EACH ROW EXECUTE FUNCTION audit_budget_line_changes();

CREATE OR REPLACE FUNCTION audit_budget_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_log (budget_id, user_id, action, entity_type, entity_id, field_changed, old_value, new_value)
        VALUES (NEW.id, NEW.created_by, 'status_changed', 'budget', NEW.id, 'status', OLD.status, NEW.status);
    END IF;
    IF OLD.global_margin IS DISTINCT FROM NEW.global_margin THEN
        INSERT INTO audit_log (budget_id, user_id, action, entity_type, entity_id, field_changed, old_value, new_value)
        VALUES (NEW.id, NEW.created_by, 'margin_changed', 'budget', NEW.id, 'global_margin',
                OLD.global_margin::TEXT, NEW.global_margin::TEXT);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_budget_status
    AFTER UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION audit_budget_status_changes();

-- ═══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_expenses_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_partitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_general_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE uf_cache ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "users_admin_all" ON users FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Companies
CREATE POLICY "companies_select" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "companies_admin" ON companies FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Items
CREATE POLICY "items_select" ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_admin_insert" ON items FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "items_admin_update" ON items FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "items_admin_delete" ON items FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- General Expenses Catalog
CREATE POLICY "gec_select" ON general_expenses_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "gec_admin" ON general_expenses_catalog FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Clients
CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated USING (true);

-- Budgets
CREATE POLICY "budgets_select" ON budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "budgets_insert" ON budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "budgets_update" ON budgets FOR UPDATE TO authenticated USING (true);

-- Budget Partitions
CREATE POLICY "partitions_select" ON budget_partitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "partitions_insert" ON budget_partitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "partitions_update" ON budget_partitions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "partitions_delete" ON budget_partitions FOR DELETE TO authenticated USING (true);

-- Budget Lines
CREATE POLICY "lines_select" ON budget_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "lines_insert" ON budget_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lines_update" ON budget_lines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lines_delete" ON budget_lines FOR DELETE TO authenticated USING (true);

-- Budget General Expenses
CREATE POLICY "bge_select" ON budget_general_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "bge_insert" ON budget_general_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "bge_update" ON budget_general_expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "bge_delete" ON budget_general_expenses FOR DELETE TO authenticated USING (true);

-- Audit Log (INSERT-ONLY — INMUTABLE)
CREATE POLICY "audit_select" ON audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_insert" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);
-- NO UPDATE/DELETE policies → inmutable

-- UF Cache
CREATE POLICY "uf_select" ON uf_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "uf_insert" ON uf_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "uf_update" ON uf_cache FOR UPDATE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

INSERT INTO companies (id, name) VALUES
    (uuid_generate_v4(), 'Chilquinta'),
    (uuid_generate_v4(), 'CGE'),
    (uuid_generate_v4(), 'ENEL'),
    (uuid_generate_v4(), 'Industrial');

-- Chilquinta
INSERT INTO items (code, company_id, partition_type, description, unit, material_value_clp, hh_value_clp, default_margin) VALUES
    ('CHQ-EMP-MONO-001', (SELECT id FROM companies WHERE name='Chilquinta'), 'EMPALME', 'Empalme monofásico subterráneo', 'CU', 25000, 15000, 0.2000),
    ('CHQ-EMP-MONO-002', (SELECT id FROM companies WHERE name='Chilquinta'), 'EMPALME', 'Empalme monofásico aéreo', 'CU', 22000, 13000, 0.2000),
    ('CHQ-EMP-TRI-001', (SELECT id FROM companies WHERE name='Chilquinta'), 'EMPALME', 'Empalme trifásico subterráneo', 'CU', 75000, 25000, 0.2000),
    ('CHQ-OOEE-001', (SELECT id FROM companies WHERE name='Chilquinta'), 'OOEE', 'Canalización eléctrica subterránea', 'ML', 8000, 5000, 0.2000),
    ('CHQ-OOCC-001', (SELECT id FROM companies WHERE name='Chilquinta'), 'OOCC', 'Excavación zanja tipo B (0.4x0.6m)', 'ML', 3000, 7000, 0.2000);

-- CGE
INSERT INTO items (code, company_id, partition_type, description, unit, material_value_clp, hh_value_clp, default_margin) VALUES
    ('CGE-EMP-MONO-001', (SELECT id FROM companies WHERE name='CGE'), 'EMPALME', 'Empalme monofásico', 'CU', 45000, 15000, 0.2000),
    ('CGE-EMP-TRI-001', (SELECT id FROM companies WHERE name='CGE'), 'EMPALME', 'Empalme trifásico', 'CU', 95000, 28000, 0.2000),
    ('CGE-OOEE-001', (SELECT id FROM companies WHERE name='CGE'), 'OOEE', 'Tablero distribución monofásico', 'CU', 35000, 12000, 0.2000);

-- ENEL
INSERT INTO items (code, company_id, partition_type, description, unit, material_value_clp, hh_value_clp, default_margin) VALUES
    ('ENL-EMP-MONO-001', (SELECT id FROM companies WHERE name='ENEL'), 'EMPALME', 'Empalme monofásico concentrado', 'CU', 55000, 15000, 0.2000),
    ('ENL-EMP-TRI-001', (SELECT id FROM companies WHERE name='ENEL'), 'EMPALME', 'Empalme trifásico concentrado', 'CU', 110000, 30000, 0.2000),
    ('ENL-OOEE-001', (SELECT id FROM companies WHERE name='ENEL'), 'OOEE', 'Red distribución BT 4x50mm²', 'ML', 12000, 8000, 0.2000);

-- Industrial
INSERT INTO items (code, company_id, partition_type, description, unit, material_value_clp, hh_value_clp, default_margin) VALUES
    ('IND-GEN-001', (SELECT id FROM companies WHERE name='Industrial'), 'INDUSTRIAL', 'Instalación tablero general industrial', 'GL', 250000, 80000, 0.2500),
    ('IND-GEN-002', (SELECT id FROM companies WHERE name='Industrial'), 'INDUSTRIAL', 'Canalización industrial bandejas portacables', 'ML', 18000, 10000, 0.2500);

-- Catálogo Gastos Generales
INSERT INTO general_expenses_catalog (name, default_value_clp, unit) VALUES
    ('Viático diario', 50000, 'GL'),
    ('Combustible', 30000, 'GL'),
    ('Arriendo vehículo', 45000, 'GL'),
    ('Bono de viaje', 100000, 'GL'),
    ('Arriendo grúa pluma', 800000, 'GL'),
    ('Arriendo retroexcavadora', 600000, 'GL'),
    ('Peajes y estacionamiento', 15000, 'GL'),
    ('Alimentación cuadrilla', 8000, 'GL'),
    ('Hospedaje', 40000, 'GL'),
    ('Otros', 0, 'GL');
