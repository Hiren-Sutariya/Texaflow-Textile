import { fetchApi } from "./api";
import { getTenantItem, setTenantItem } from "./tenantStorage";
import {
  Party,
  JobOrder,
  EmbroideryMachine,
  FinishedDesignItem,
  ExpenseItem,
  PaymentVoucher,
  InventoryStockItem,
  Employee
} from "@/types";

// Export re-usable types for convenience
export type {
  Party,
  JobOrder,
  EmbroideryMachine,
  FinishedDesignItem,
  ExpenseItem,
  PaymentVoucher,
  InventoryStockItem,
  Employee
};

// -------------------------------------------------------------
// 1. VENDORS SERVICE
// -------------------------------------------------------------
export const VendorsService = {
  async getVendors(): Promise<any[]> {
    try {
      const data = await fetchApi<any[]>("/vendors");
      return data;
    } catch {
      const saved = getTenantItem<any[]>("texaflow_vendors");
      return saved || [];
    }
  },

  async saveVendors(vendors: any[]): Promise<void> {
    setTenantItem("texaflow_vendors", vendors);
    window.dispatchEvent(new Event("app_data_update"));
  }
};

// -------------------------------------------------------------
// 2. DESIGNS SERVICE
// -------------------------------------------------------------
export const DesignsService = {
  async getDesigns(): Promise<any[]> {
    try {
      const data = await fetchApi<any[]>("/designs");
      return data;
    } catch {
      const saved = localStorage.getItem("app_design_folders");
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveDesigns(designs: any[]): Promise<void> {
    localStorage.setItem("app_design_folders", JSON.stringify(designs));
    window.dispatchEvent(new Event("app_data_update"));
  }
};


// -------------------------------------------------------------
// 2. JOB ORDERS SERVICE
// -------------------------------------------------------------
export const JobOrdersService = {
  async getOrders(): Promise<JobOrder[]> {
    try {
      const data = await fetchApi<JobOrder[]>("/job-works/orders");
      return data;
    } catch {
      const saved = localStorage.getItem("app_job_orders");
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveOrders(orders: JobOrder[]): Promise<void> {
    localStorage.setItem("app_job_orders", JSON.stringify(orders));
    window.dispatchEvent(new Event("app_data_update"));
  }
};

// -------------------------------------------------------------
// 3. PRODUCTION MACHINES SERVICE
// -------------------------------------------------------------
export const ProductionService = {
  async getMachines(): Promise<EmbroideryMachine[]> {
    try {
      const data = await fetchApi<EmbroideryMachine[]>("/production/machines");
      return data;
    } catch {
      const saved = localStorage.getItem("app_machines");
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveMachines(machines: EmbroideryMachine[]): Promise<void> {
    localStorage.setItem("app_machines", JSON.stringify(machines));
    window.dispatchEvent(new Event("app_data_update"));
  }
};

// -------------------------------------------------------------
// 4. DISPATCHES & FINISHED DESIGNS SERVICE
// -------------------------------------------------------------
export const DispatchesService = {
  async getFinishedDesigns(): Promise<FinishedDesignItem[]> {
    try {
      const data = await fetchApi<FinishedDesignItem[]>("/dispatches/stock");
      return data;
    } catch {
      const saved = localStorage.getItem("app_finished_designs");
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveFinishedDesigns(items: FinishedDesignItem[]): Promise<void> {
    localStorage.setItem("app_finished_designs", JSON.stringify(items));
    window.dispatchEvent(new Event("app_data_update"));
  }
};

// -------------------------------------------------------------
// 5. EXPENSES SERVICE
// -------------------------------------------------------------
export const ExpensesService = {
  async getExpenses(): Promise<ExpenseItem[]> {
    try {
      const data = await fetchApi<ExpenseItem[]>("/expenses");
      return data;
    } catch {
      const saved = localStorage.getItem("app_expenses");
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveExpenses(expenses: ExpenseItem[]): Promise<void> {
    localStorage.setItem("app_expenses", JSON.stringify(expenses));
    window.dispatchEvent(new Event("app_data_update"));
  }
};

// -------------------------------------------------------------
// 6. PAYMENTS SERVICE
// -------------------------------------------------------------
export const PaymentsService = {
  async getPayments(): Promise<PaymentVoucher[]> {
    try {
      const data = await fetchApi<PaymentVoucher[]>("/payments");
      return data;
    } catch {
      const saved = localStorage.getItem("app_payments");
      return saved ? JSON.parse(saved) : [];
    }
  },

  async savePayments(payments: PaymentVoucher[]): Promise<void> {
    localStorage.setItem("app_payments", JSON.stringify(payments));
    window.dispatchEvent(new Event("app_data_update"));
  }
};
