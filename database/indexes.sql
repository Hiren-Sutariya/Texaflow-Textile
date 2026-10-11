-- DigiScale Database Performance Indexes

-- Parties & Contacts
CREATE INDEX idx_parties_type ON parties(party_type);
CREATE INDEX idx_parties_code ON parties(code);
CREATE INDEX idx_parties_name ON parties(name);

-- Job Works
CREATE INDEX idx_job_works_party ON job_works(party_id);
CREATE INDEX idx_job_works_status ON job_works(status);
CREATE INDEX idx_job_works_number ON job_works(jw_number);
CREATE INDEX idx_job_works_dates ON job_works(received_date, expected_delivery_date);

-- Inventory & Stock Ledger
CREATE INDEX idx_stock_material ON material_stock(material_id);
CREATE INDEX idx_stock_warehouse ON material_stock(warehouse_id);
CREATE INDEX idx_stock_ownership ON material_stock(ownership_type, party_id);

CREATE INDEX idx_movements_material ON stock_movements(material_id);
CREATE INDEX idx_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_movements_ref ON stock_movements(reference_type, reference_id);

-- Machines & Production
CREATE INDEX idx_production_orders_jw ON production_orders(job_work_id);
CREATE INDEX idx_production_orders_machine ON production_orders(machine_id);
CREATE INDEX idx_production_orders_status ON production_orders(status);

CREATE INDEX idx_production_entries_order ON production_entries(production_order_id);
CREATE INDEX idx_production_entries_worker ON production_entries(worker_id);
CREATE INDEX idx_production_entries_machine ON production_entries(machine_id);
CREATE INDEX idx_production_entries_date ON production_entries(entry_date);

-- Purchases
CREATE INDEX idx_purchases_vendor ON purchases(vendor_id);
CREATE INDEX idx_purchases_status ON purchases(status);

-- Finance & Ledger
CREATE INDEX idx_receivables_party ON receivables(party_id);
CREATE INDEX idx_receivables_status ON receivables(status);
CREATE INDEX idx_payables_vendor ON payables(vendor_id);
CREATE INDEX idx_payables_status ON payables(status);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- Tasks & Logs
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
