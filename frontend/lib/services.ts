import { fetchApi } from "./api";
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
// 1. PARTIES SERVICE
// -------------------------------------------------------------
export const PartiesService = {
  async getParties(): Promise<Party[]> {
    try {
      const data = await fetchApi<Party[]>("/parties");
      return data;
    } catch {
      const saved = localStorage.getItem("app_parties");
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveParties(parties: Party[]): Promise<void> {
    localStorage.setItem("app_parties", JSON.stringify(parties));
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
