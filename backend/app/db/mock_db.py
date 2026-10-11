# DigiScale Mock Data Store for Local API Execution & Testing

MOCK_DB = {
    "parties": [
        {
            "id": "p-101",
            "code": "P-101",
            "name": "ABC Tex Fabrics",
            "party_type": "Job Work Party",
            "gstin": "24AAAFA1234A1Z5",
            "pan": "AAAFA1234A",
            "address": "Plot 42, Ring Road",
            "city": "Surat",
            "state": "Gujarat",
            "credit_days": 30,
            "created_at": "2026-09-01T10:00:00Z"
        },
        {
            "id": "p-102",
            "code": "P-102",
            "name": "Royal Fashion House",
            "party_type": "Job Work Party",
            "gstin": "24BBBFR5678B1Z2",
            "pan": "BBBFR5678B",
            "address": "Shop 105, Textile Market",
            "city": "Surat",
            "state": "Gujarat",
            "credit_days": 15,
            "created_at": "2026-09-02T11:00:00Z"
        },
        {
            "id": "v-201",
            "code": "V-201",
            "name": "Surat Jari & Threads Pvt Ltd",
            "party_type": "Vendor",
            "gstin": "24CCCJS9012C1Z8",
            "pan": "CCCJS9012C",
            "address": "Katargam GIDC",
            "city": "Surat",
            "state": "Gujarat",
            "credit_days": 30,
            "created_at": "2026-09-03T12:00:00Z"
        }
    ],
    "materials": [
        {
            "id": "m-101",
            "code": "MAT-101",
            "name": "Red Viscose Thread",
            "category_name": "Thread",
            "unit": "kg",
            "min_stock_alert": 5.0,
            "reorder_level": 10.0,
            "created_at": "2026-09-01T10:00:00Z"
        },
        {
            "id": "m-102",
            "code": "MAT-102",
            "name": "Black Viscose Thread",
            "category_name": "Thread",
            "unit": "kg",
            "min_stock_alert": 5.0,
            "reorder_level": 10.0,
            "created_at": "2026-09-01T10:00:00Z"
        },
        {
            "id": "m-103",
            "code": "MAT-103",
            "name": "Gold Metallic Jari 250D",
            "category_name": "Jari",
            "unit": "kg",
            "min_stock_alert": 10.0,
            "reorder_level": 20.0,
            "created_at": "2026-09-01T10:00:00Z"
        }
    ],
    "stock": [
        {
            "id": "s-101",
            "material_id": "m-101",
            "material_code": "MAT-101",
            "material_name": "Red Viscose Thread",
            "unit": "kg",
            "warehouse_name": "Raw Material",
            "ownership_type": "Company",
            "party_id": None,
            "party_name": None,
            "current_stock_quantity": 15.5,
            "updated_at": "2026-09-20T10:00:00Z"
        },
        {
            "id": "s-102",
            "material_id": "m-102",
            "material_code": "MAT-102",
            "material_name": "Black Viscose Thread",
            "unit": "kg",
            "warehouse_name": "Raw Material",
            "ownership_type": "Company",
            "party_id": None,
            "party_name": None,
            "current_stock_quantity": 8.0,
            "updated_at": "2026-09-20T10:00:00Z"
        },
        {
            "id": "s-103",
            "material_id": "m-103",
            "material_code": "MAT-103",
            "material_name": "Gold Metallic Jari 250D",
            "unit": "kg",
            "warehouse_name": "Raw Material",
            "ownership_type": "Company",
            "party_id": None,
            "party_name": None,
            "current_stock_quantity": 4.0,
            "updated_at": "2026-09-20T10:00:00Z"
        }
    ],
    "designs": [
        {
            "id": "d-101",
            "design_number": "DES-A101",
            "design_name": "Peacock Multi Floral Heavy Saree Border",
            "stitch_count": 45000,
            "machine_requirement": "Multi-head Embroidery",
            "default_rate": 12.50,
            "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
            "file_url": None,
            "notes": "Premium saree border pattern",
            "created_at": "2026-09-01T10:00:00Z"
        },
        {
            "id": "d-102",
            "design_number": "DES-A102",
            "design_name": "Royal Sequin Neck Pattern",
            "stitch_count": 32000,
            "machine_requirement": "Sequin Embroidery",
            "default_rate": 18.00,
            "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
            "file_url": None,
            "notes": "Designer kurti neck",
            "created_at": "2026-09-02T10:00:00Z"
        }
    ],
    "job_works": [
        {
            "id": "jw-101",
            "jw_number": "JW-2026-001",
            "party_id": "p-101",
            "party_name": "ABC Tex Fabrics",
            "received_date": "2026-09-15",
            "expected_delivery_date": "2026-09-25",
            "payment_terms": "30 Days",
            "rate_type": "Per Piece",
            "status": "In_Production",
            "notes": "500m Blue Cotton fabric received",
            "fabrics": [
                {
                    "fabric_name": "Blue Cotton",
                    "fabric_type": "Cotton 60s",
                    "color": "Royal Blue",
                    "lot_number": "LOT-5501",
                    "quantity_meters": 500.0,
                    "used_quantity": 380.0,
                    "returned_quantity": 0.0,
                    "received_date": "2026-09-15"
                }
            ],
            "designs": [
                {
                    "design_id": "d-101",
                    "design_number": "DES-A101",
                    "design_name": "Peacock Multi Floral Heavy Saree Border",
                    "color": "Multicolor",
                    "fabric": "Royal Blue Cotton",
                    "required_quantity": 2000,
                    "rate_per_piece": 12.50,
                    "expected_prod_time_mins": 15
                }
            ],
            "required_materials": [
                {
                    "material_id": "m-101",
                    "material_code": "MAT-101",
                    "material_name": "Red Viscose Thread",
                    "required_quantity": 5.0,
                    "unit": "kg",
                    "provided_by": "Company"
                },
                {
                    "material_id": "m-103",
                    "material_code": "MAT-103",
                    "material_name": "Gold Metallic Jari 250D",
                    "required_quantity": 10.0,
                    "unit": "kg",
                    "provided_by": "Purchase_Required"
                }
            ],
            "created_at": "2026-09-15T09:00:00Z"
        }
    ],
    "machines": [
        {
            "id": "mac-101",
            "machine_number": "M-101",
            "machine_name": "SURAJ 400 Multi-Head",
            "machine_type": "Multi-head Embroidery",
            "head_count": 20,
            "status": "Running",
            "current_worker_name": "Ramesh Karigar",
            "current_design_name": "DES-A101 Peacock Border"
        },
        {
            "id": "mac-102",
            "machine_number": "M-102",
            "machine_name": "TAJIMA High Speed Sequin",
            "machine_type": "Sequin Embroidery",
            "head_count": 16,
            "status": "Running",
            "current_worker_name": "Suresh Operator",
            "current_design_name": "DES-A102 Sequin Neck"
        },
        {
            "id": "mac-103",
            "machine_number": "M-103",
            "machine_name": "BAUYU Cording Specialist",
            "machine_type": "Cord Embroidery",
            "head_count": 12,
            "status": "Idle",
            "current_worker_name": None,
            "current_design_name": None
        },
        {
            "id": "mac-104",
            "machine_number": "M-104",
            "machine_name": "SURAJ 500 Heavy Duty",
            "machine_type": "Multi-head Embroidery",
            "head_count": 24,
            "status": "Maintenance",
            "current_worker_name": None,
            "current_design_name": None
        }
    ],
    "workers": [
        {
            "id": "w-101",
            "employee_name": "Ramesh Karigar",
            "mobile": "9876543210",
            "skill_level": "Senior Master",
            "machine_specialization": "Multi-head Embroidery",
            "production_rate_per_unit": 0.15,
            "shift": "Day Shift"
        },
        {
            "id": "w-102",
            "employee_name": "Suresh Operator",
            "mobile": "9876543211",
            "skill_level": "Master",
            "machine_specialization": "Sequin Embroidery",
            "production_rate_per_unit": 0.15,
            "shift": "Night Shift"
        }
    ],
    "production_entries": [
        {
            "id": "pe-101",
            "production_order_id": "po-101",
            "entry_date": "2026-09-21",
            "shift": "Day Shift",
            "machine_number": "M-101",
            "worker_name": "Ramesh Karigar",
            "produced_quantity": 1200,
            "rejected_quantity": 20,
            "accepted_quantity": 1180,
            "machine_hours": 8.0,
            "rejection_reason": "Thread Issue"
        }
    ],
    "purchases": [
        {
            "id": "pur-101",
            "vendor_id": "v-201",
            "vendor_name": "Surat Jari & Threads Pvt Ltd",
            "po_number": "PO-2026-089",
            "order_date": "2026-09-18",
            "expected_date": "2026-09-23",
            "status": "PO_Issued",
            "total_amount": 12500.0,
            "gst_amount": 2250.0,
            "transport_charges": 300.0,
            "other_charges": 0.0,
            "net_amount": 15050.0,
            "created_at": "2026-09-18T10:00:00Z"
        }
    ],
    "dispatches": [
        {
            "id": "disp-101",
            "dispatch_number": "DISP-2026-042",
            "job_work_id": "jw-101",
            "party_name": "ABC Tex Fabrics",
            "dispatch_date": "2026-09-20",
            "transport_name": "Surat City Logistics",
            "vehicle_number": "GJ-05-BT-9911",
            "challan_number": "CH-8821",
            "dispatched_quantity": 1000
        }
    ],
    "receivables": [
        {
            "id": "rec-101",
            "party_name": "ABC Tex Fabrics",
            "invoice_number": "INV-2026-012",
            "amount": 25000.0,
            "received_amount": 10000.0,
            "balance_amount": 15000.0,
            "due_date": "2026-10-05",
            "status": "Partial"
        }
    ],
    "payables": [
        {
            "id": "pay-101",
            "vendor_name": "Surat Jari & Threads Pvt Ltd",
            "bill_number": "BILL-991",
            "amount": 15050.0,
            "paid_amount": 0.0,
            "balance_amount": 15050.0,
            "due_date": "2026-10-18",
            "status": "Pending"
        }
    ],
    "expenses": [
        {
            "id": "exp-101",
            "category": "Electricity",
            "amount": 18500.0,
            "expense_date": "2026-09-10",
            "payment_method": "Bank",
            "description": "Monthly Factory Torrent Power Bill"
        },
        {
            "id": "exp-102",
            "category": "Machine Maintenance",
            "amount": 4200.0,
            "expense_date": "2026-09-14",
            "payment_method": "Cash",
            "description": "M-104 Head Servicing & Oil replacement"
        }
    ],
    "partners": [
        {
            "id": "part-101",
            "name": "Partner A (Managing Director)",
            "mobile": "9900011122",
            "profit_share_percent": 50.0,
            "loss_share_percent": 50.0,
            "is_active": True
        },
        {
            "id": "part-102",
            "name": "Partner B (Production Director)",
            "mobile": "9900011123",
            "profit_share_percent": 25.0,
            "loss_share_percent": 25.0,
            "is_active": True
        },
        {
            "id": "part-103",
            "name": "Partner C (Finance Partner)",
            "mobile": "9900011124",
            "profit_share_percent": 25.0,
            "loss_share_percent": 25.0,
            "is_active": True
        }
    ],
    "tasks": [
        {
            "id": "t-101",
            "title": "Inspect ABC Tex Blue Cotton Fabric Lot",
            "description": "Check fabric quality and lot count before machine allocation",
            "assigned_to": "Ramesh Karigar",
            "assigned_by": "Owner",
            "priority": "High",
            "due_date": "2026-09-21",
            "status": "In_Progress",
            "assigned_at": "2026-09-21T08:00:00Z",
            "seen_at": "2026-09-21T08:15:00Z",
            "started_at": "2026-09-21T08:30:00Z",
            "completed_at": None
        }
    ]
}
