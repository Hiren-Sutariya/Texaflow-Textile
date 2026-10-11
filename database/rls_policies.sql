-- DigiScale Supabase Row Level Security (RLS) Policies

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_work_fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_work_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_work_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current authenticated user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR AS $$
  SELECT r.name 
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Owner & Admin Policies (Full Access)
CREATE POLICY owner_all_access ON parties FOR ALL USING (current_user_role() IN ('Owner', 'Accountant', 'Production Manager', 'Warehouse'));
CREATE POLICY owner_job_works_access ON job_works FOR ALL USING (current_user_role() IN ('Owner', 'Production Manager', 'Warehouse', 'Accountant'));
CREATE POLICY owner_inventory_access ON material_stock FOR ALL USING (current_user_role() IN ('Owner', 'Warehouse', 'Production Manager'));
CREATE POLICY owner_stock_movements_access ON stock_movements FOR ALL USING (current_user_role() IN ('Owner', 'Warehouse', 'Production Manager'));
CREATE POLICY owner_production_access ON production_entries FOR ALL USING (current_user_role() IN ('Owner', 'Production Manager', 'Worker'));
CREATE POLICY owner_finance_access ON receivables FOR ALL USING (current_user_role() IN ('Owner', 'Accountant'));
CREATE POLICY owner_payables_access ON payables FOR ALL USING (current_user_role() IN ('Owner', 'Accountant'));
CREATE POLICY owner_expenses_access ON expenses FOR ALL USING (current_user_role() IN ('Owner', 'Accountant'));
CREATE POLICY owner_partners_access ON partners FOR ALL USING (current_user_role() = 'Owner');
CREATE POLICY owner_partner_tx_access ON partner_transactions FOR ALL USING (current_user_role() = 'Owner');

-- 2. Worker Task & Entry Policies
CREATE POLICY worker_assigned_tasks ON tasks FOR SELECT USING (assigned_to = auth.uid() OR current_user_role() = 'Owner');
CREATE POLICY worker_update_tasks ON tasks FOR UPDATE USING (assigned_to = auth.uid()) WITH CHECK (assigned_to = auth.uid());
