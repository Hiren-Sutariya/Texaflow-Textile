-- DigiScale Initial Seed Data

-- 1. Parties (Job Work Parties & Vendors)
INSERT INTO parties (id, code, name, party_type, gstin, pan, address, city, state, credit_days) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'P-101', 'ABC Tex Fabrics', 'Job Work Party', '24AAAFA1234A1Z5', 'AAAFA1234A', 'Plot 42, Ring Road', 'Surat', 'Gujarat', 30),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'P-102', 'Royal Fashion House', 'Job Work Party', '24BBBFR5678B1Z2', 'BBBFR5678B', 'Shop 105, Textile Market', 'Surat', 'Gujarat', 15),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'V-201', 'Surat Jari & Threads Pvt Ltd', 'Vendor', '24CCCJS9012C1Z8', 'CCCJS9012C', 'Industrial Area, Katargam', 'Surat', 'Gujarat', 30),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'V-202', 'Vardhman Yarns', 'Supplier', '24DDDVY3456D1Z1', 'DDDVY3456D', 'GIDC Pandesara', 'Surat', 'Gujarat', 45);

-- 2. Materials
INSERT INTO materials (id, code, name, category_id, unit, min_stock_alert, reorder_level) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'MAT-101', 'Red Viscose Thread', (SELECT id FROM material_categories WHERE name='Thread'), 'kg', 5.00, 10.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'MAT-102', 'Black Viscose Thread', (SELECT id FROM material_categories WHERE name='Thread'), 'kg', 5.00, 10.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'MAT-103', 'Gold Metallic Jari 250D', (SELECT id FROM material_categories WHERE name='Jari'), 'kg', 10.00, 20.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'MAT-104', 'Silver Special Jari', (SELECT id FROM material_categories WHERE name='Special Jari'), 'kg', 2.00, 5.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15', 'MAT-105', 'High Density Bobbin Thread', (SELECT id FROM material_categories WHERE name='Thread'), 'cone', 20.00, 50.00);

-- 3. Initial Stock
INSERT INTO material_stock (material_id, warehouse_id, ownership_type, current_stock_quantity) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', (SELECT id FROM warehouses WHERE name='Raw Material'), 'Company', 15.50),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', (SELECT id FROM warehouses WHERE name='Raw Material'), 'Company', 8.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', (SELECT id FROM warehouses WHERE name='Raw Material'), 'Company', 4.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', (SELECT id FROM warehouses WHERE name='Raw Material'), 'Company', 1.20);

-- 4. Designs
INSERT INTO designs (id, design_number, design_name, stitch_count, machine_requirement, default_rate) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'DES-A101', 'Peacock Multi Floral Heavy Saree Border', 45000, 'Multi-head Embroidery', 12.50),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'DES-A102', 'Royal Sequin Neck Pattern', 32000, 'Sequin Embroidery', 18.00),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'DES-A103', 'Geometric Cord Lace Border', 28000, 'Cord Embroidery', 9.50);

-- 5. Machines
INSERT INTO machines (id, machine_number, machine_name, machine_type, head_count, status) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'M-101', 'SURAJ 400 Multi-Head', 'Multi-head Embroidery', 20, 'Running'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'M-102', 'TAJIMA High Speed Sequin', 'Sequin Embroidery', 16, 'Running'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'M-103', 'BAUYU Cording Specialist', 'Cord Embroidery', 12, 'Idle'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'M-104', 'SURAJ 500 Heavy Duty', 'Multi-head Embroidery', 24, 'Maintenance');

-- 6. Employees & Workers
INSERT INTO employees (id, name, mobile, joining_date, role_name, salary_type, salary_rate, shift_preference) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'Ramesh Karigar', '9876543210', '2024-01-15', 'Machine Operator', 'Production_Based', 0.15, 'Day Shift'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e12', 'Suresh Operator', '9876543211', '2024-03-01', 'Machine Operator', 'Production_Based', 0.15, 'Night Shift'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', 'Mahesh Production Head', '9876543212', '2023-06-10', 'Production Manager', 'Fixed', 35000.00, 'Day Shift');

INSERT INTO workers (id, employee_id, skill_level, machine_specialization, production_rate_per_unit) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'Senior Master', 'Multi-head Embroidery', 0.1500),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e12', 'Master', 'Sequin Embroidery', 0.1500);

-- 7. Partners
INSERT INTO partners (name, mobile, profit_share_percent, loss_share_percent) VALUES
('Partner A (Managing Director)', '9900011122', 50.00, 50.00),
('Partner B (Production Director)', '9900011123', 25.00, 25.00),
('Partner C (Finance Partner)', '9900011124', 25.00, 25.00);
