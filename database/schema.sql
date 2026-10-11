-- DigiScale PostgreSQL Schema DDL
-- Business Management System for Embroidery Manufacturing & Job-Work

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles & Users
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES 
('Owner', 'Full access to all business operations, financials, and settings'),
('Production Manager', 'Access to production, job works, machines, workers, and scheduling'),
('Warehouse', 'Access to inventory, stock movements, purchase receiving, and dispatches'),
('Accountant', 'Access to purchases, payables, receivables, expenses, and financial reporting'),
('Worker', 'Restricted access to assigned tasks and production logging');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    joining_date DATE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    salary_type VARCHAR(50) NOT NULL CHECK (salary_type IN ('Fixed', 'Production_Based', 'Hourly')),
    salary_rate NUMERIC(12, 2) DEFAULT 0.00,
    shift_preference VARCHAR(50) DEFAULT 'Day Shift',
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'On_Leave', 'Resigned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_level VARCHAR(50) DEFAULT 'Operator',
    machine_specialization VARCHAR(100),
    production_rate_per_unit NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Party Management
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    party_type VARCHAR(50) NOT NULL CHECK (party_type IN ('Job Work Party', 'Customer', 'Vendor', 'Supplier', 'Broker', 'Trader', 'Other')),
    gstin VARCHAR(20),
    pan VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    credit_days INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE party_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    contact_person VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    designation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Designs Library
CREATE TABLE designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    design_number VARCHAR(100) UNIQUE NOT NULL,
    design_name VARCHAR(255) NOT NULL,
    stitch_count INT DEFAULT 0,
    machine_requirement VARCHAR(100),
    default_rate NUMERIC(10, 2) DEFAULT 0.00,
    image_url TEXT,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE design_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    color_name VARCHAR(100) NOT NULL,
    thread_code VARCHAR(50)
);

-- 4. Job Work Domain
CREATE TABLE job_works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jw_number VARCHAR(100) UNIQUE NOT NULL,
    party_id UUID NOT NULL REFERENCES parties(id),
    received_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    payment_terms VARCHAR(100) DEFAULT '30 Days',
    rate_type VARCHAR(50) DEFAULT 'Per Piece',
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Material_Pending', 'Planned', 'In_Production', 'QC', 'Ready_for_Dispatch', 'Dispatched', 'Completed', 'Closed')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_work_fabrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_work_id UUID NOT NULL REFERENCES job_works(id) ON DELETE CASCADE,
    fabric_name VARCHAR(255) NOT NULL,
    fabric_type VARCHAR(100),
    color VARCHAR(100),
    lot_number VARCHAR(100),
    quantity_meters NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    used_quantity NUMERIC(12, 2) DEFAULT 0.00,
    returned_quantity NUMERIC(12, 2) DEFAULT 0.00,
    received_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_work_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_work_id UUID NOT NULL REFERENCES job_works(id) ON DELETE CASCADE,
    design_id UUID NOT NULL REFERENCES designs(id),
    color VARCHAR(100),
    fabric VARCHAR(100),
    required_quantity INT NOT NULL DEFAULT 0,
    rate_per_piece NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expected_prod_time_mins INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory & Materials
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    location_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO warehouses (name, location_code) VALUES
('Main Godown', 'WH-MAIN'),
('Raw Material', 'WH-RAW'),
('Production Floor', 'WH-PROD'),
('Finished Goods', 'WH-FG');

CREATE TABLE material_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO material_categories (name) VALUES
('Thread'), ('Jari'), ('Special Jari'), ('Fabric'), ('Packaging'), ('Chemical'), ('Spare Part');

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES material_categories(id),
    unit VARCHAR(50) NOT NULL CHECK (unit IN ('kg', 'meter', 'piece', 'cone', 'roll', 'gm')),
    min_stock_alert NUMERIC(12, 2) DEFAULT 0.00,
    reorder_level NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_work_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_work_id UUID NOT NULL REFERENCES job_works(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    required_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL,
    provided_by VARCHAR(50) NOT NULL CHECK (provided_by IN ('Party', 'Company', 'Purchase_Required')),
    received_quantity NUMERIC(12, 2) DEFAULT 0.00,
    used_quantity NUMERIC(12, 2) DEFAULT 0.00,
    returned_quantity NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE material_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    ownership_type VARCHAR(50) NOT NULL CHECK (ownership_type IN ('Company', 'Party')),
    party_id UUID REFERENCES parties(id),
    current_stock_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_material_stock UNIQUE (material_id, warehouse_id, ownership_type, party_id)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    ownership_type VARCHAR(50) NOT NULL CHECK (ownership_type IN ('Company', 'Party')),
    party_id UUID REFERENCES parties(id),
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('Opening', 'Purchase_Receive', 'Production_Consume', 'Production_Return', 'Dispatch', 'Party_Receive', 'Party_Return', 'Adjustment')),
    quantity NUMERIC(12, 2) NOT NULL,
    reference_type VARCHAR(50) CHECK (reference_type IN ('Purchase', 'JobWork', 'ProductionEntry', 'Dispatch', 'MaterialReturn')),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Machines & Production
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_number VARCHAR(50) UNIQUE NOT NULL,
    machine_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(100) NOT NULL,
    head_count INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Idle' CHECK (status IN ('Running', 'Idle', 'Breakdown', 'Maintenance')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_work_id UUID NOT NULL REFERENCES job_works(id),
    job_work_design_id UUID NOT NULL REFERENCES job_work_designs(id),
    machine_id UUID NOT NULL REFERENCES machines(id),
    planned_quantity INT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In_Progress', 'Completed', 'Paused')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE production_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID NOT NULL REFERENCES production_orders(id),
    entry_date DATE NOT NULL,
    shift VARCHAR(50) NOT NULL CHECK (shift IN ('Day Shift', 'Night Shift', 'Custom Shift')),
    machine_id UUID NOT NULL REFERENCES machines(id),
    worker_id UUID NOT NULL REFERENCES workers(id),
    produced_quantity INT NOT NULL CHECK (produced_quantity >= 0),
    rejected_quantity INT NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
    accepted_quantity INT GENERATED ALWAYS AS (produced_quantity - rejected_quantity) STORED,
    machine_hours NUMERIC(6, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_rejection CHECK (rejected_quantity <= produced_quantity)
);

CREATE TABLE production_material_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_entry_id UUID NOT NULL REFERENCES production_entries(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    used_quantity NUMERIC(12, 2) NOT NULL CHECK (used_quantity >= 0),
    ownership_type VARCHAR(50) NOT NULL CHECK (ownership_type IN ('Company', 'Party')),
    party_id UUID REFERENCES parties(id)
);

CREATE TABLE production_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_entry_id UUID NOT NULL REFERENCES production_entries(id) ON DELETE CASCADE,
    rejected_quantity INT NOT NULL,
    rejection_reason VARCHAR(100) NOT NULL CHECK (rejection_reason IN ('Design Issue', 'Thread Issue', 'Fabric Issue', 'Machine Issue', 'Worker Error', 'Other')),
    inspected_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Purchases & Supply Chain
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES parties(id),
    po_number VARCHAR(100) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'PO_Issued', 'Material_Received', 'Billed', 'Closed')),
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    gst_amount NUMERIC(12, 2) DEFAULT 0.00,
    transport_charges NUMERIC(12, 2) DEFAULT 0.00,
    other_charges NUMERIC(12, 2) DEFAULT 0.00,
    net_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    ordered_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    received_quantity NUMERIC(12, 2) DEFAULT 0.00,
    rejected_quantity NUMERIC(12, 2) DEFAULT 0.00,
    rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gst_percent NUMERIC(5, 2) DEFAULT 0.00,
    total_item_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Dispatches & Material Returns
CREATE TABLE dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_number VARCHAR(100) UNIQUE NOT NULL,
    job_work_id UUID NOT NULL REFERENCES job_works(id),
    party_id UUID NOT NULL REFERENCES parties(id),
    dispatch_date DATE NOT NULL,
    transport_name VARCHAR(100),
    vehicle_number VARCHAR(50),
    challan_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dispatch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
    job_work_design_id UUID NOT NULL REFERENCES job_work_designs(id),
    dispatched_quantity INT NOT NULL CHECK (dispatched_quantity > 0)
);

CREATE TABLE material_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number VARCHAR(100) UNIQUE NOT NULL,
    job_work_id UUID NOT NULL REFERENCES job_works(id),
    party_id UUID NOT NULL REFERENCES parties(id),
    material_id UUID NOT NULL REFERENCES materials(id),
    returned_quantity NUMERIC(12, 2) NOT NULL CHECK (returned_quantity > 0),
    return_date DATE NOT NULL,
    challan_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Receivables, Payables, Payments & Expenses
CREATE TABLE receivables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES parties(id),
    job_work_id UUID REFERENCES job_works(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    received_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) GENERATED ALWAYS AS (amount - received_amount) STORED,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid', 'Overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES parties(id),
    purchase_id UUID REFERENCES purchases(id),
    bill_number VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid', 'Overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('Receive', 'Pay')),
    party_id UUID REFERENCES parties(id),
    vendor_id UUID REFERENCES parties(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('Bank', 'Cash', 'UPI', 'Cheque')),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL CHECK (category IN ('Electricity', 'Salary', 'Worker Payment', 'Machine Maintenance', 'Transport', 'Rent', 'Packaging', 'Office', 'Other')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Bank',
    description TEXT,
    receipt_document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Partner Management
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    profit_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 33.33,
    loss_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 33.33,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE partner_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('Investment', 'Profit_Distribution', 'Loss_Allocation', 'Drawing', 'Withdrawal', 'Settlement')),
    amount NUMERIC(12, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tasks, Documents & Activity Log
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Seen', 'In_Progress', 'Completed')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    seen_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
