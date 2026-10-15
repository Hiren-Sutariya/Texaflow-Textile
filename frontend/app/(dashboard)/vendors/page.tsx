"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import {
  Building2,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Copy,
  Mail,
  Phone,
  CreditCard,
  User,
  ShieldCheck,
  Landmark,
  FileSpreadsheet,
  AlertCircle,
  ChevronDown,
  ArrowLeft,
  Settings,
  Save,
  MoreHorizontal,
  ArrowUpDown,
  Upload,
  Download,
  Sliders,
  RefreshCw,
  ChevronRight
} from "lucide-react";

interface CustomSelectOption {
  value: string;
  label: string;
  shortLabel?: string;
}

const COUNTRY_CODES: CustomSelectOption[] = [
  { value: "+91", label: "+91 India", shortLabel: "+91" },
  { value: "+93", label: "+93 Afghanistan", shortLabel: "+93" },
  { value: "+358", label: "+358 Aland Islands", shortLabel: "+358" },
  { value: "+355", label: "+355 Albania", shortLabel: "+355" },
  { value: "+213", label: "+213 Algeria", shortLabel: "+213" },
  { value: "+376", label: "+376 Andorra", shortLabel: "+376" },
  { value: "+1", label: "+1 United States", shortLabel: "+1" },
  { value: "+44", label: "+44 United Kingdom", shortLabel: "+44" },
  { value: "+971", label: "+971 UAE", shortLabel: "+971" }
];

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  uppercase?: boolean;
  openUp?: boolean;
  headerAction?: {
    label: string;
    onClick: () => void;
  };
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  uppercase = false,
  openUp,
  headerAction
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      if (typeof openUp === "boolean") {
        setOpenUpward(openUp);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 260);
      }
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-xs select-none ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={`custom-select-trigger w-full h-9 px-3 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        } ${uppercase && selectedOption ? "uppercase" : ""}`}
      >
        <span className={`truncate ${selectedOption ? "font-bold text-slate-900" : "font-medium text-slate-400"}`}>
          {selectedOption ? (selectedOption.shortLabel || selectedOption.label) : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 left-0 min-w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
            openUpward ? "bottom-full mb-2" : "top-full mt-[18px]"
          }`}
        >
          {headerAction && (
            <div className="p-1 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  headerAction.onClick();
                }}
                className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>{headerAction.label}</span>
              </button>
            </div>
          )}
          <div className="p-1.5 max-h-56 overflow-y-auto no-scrollbar space-y-1 pb-2">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                      : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                  } ${uppercase ? "uppercase" : ""}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export interface ContactPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
}

export interface BankDetail {
  id: string;
  account_holder: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  upi_id: string;
  qr_setup: "Auto Generate from UPI" | "Upload Custom QR";
}

export interface Vendor {
  id: string;
  srNo: number;
  account_type: "Supplier / Vendor" | "Customer / Client" | "Trading Partner" | "Internal Firm" | "Job Work";
  salutation: string;
  first_name: string;
  last_name: string;
  company_name: string;
  display_name: string;
  email: string;
  gstin: string;
  work_phone: string;
  mobile: string;
  vendor_language: string;

  // Other Details
  pan: string;
  is_msme: boolean;
  currency: string;
  accounts_payable: string;
  opening_balance: number;
  payment_terms: string;
  tds: string;
  enable_portal: boolean;

  // Address
  billing_address: {
    attention: string;
    country: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    fax: string;
  };
  shipping_address: {
    attention: string;
    country: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    fax: string;
  };

  // Brokerage
  brokerage: {
    broker_name: string;
    work_phone: string;
    mobile: string;
    percentage: number;
    broker_email: string;
  };

  // Bank Details
  bank_details: BankDetail[];

  // Contact Persons
  contact_persons: ContactPerson[];

  // Remarks
  remarks: string;
}

const initialVendors: Vendor[] = [];

export default function VendorsPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_vendors_master");
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            if (parsed.length === 0) return [];
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_vendors_master");
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      } catch {}
    }
    return true;
  });
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  // Preview Modal State
  const [previewVendor, setPreviewVendor] = useState<Vendor | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showPreviewAccNo, setShowPreviewAccNo] = useState(false);

  // Action Menu State (Three Dots Filter & Options matching screenshots)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [activeHoverMenu, setActiveHoverMenu] = useState<"sort" | "import" | "export" | "preferences" | "refresh" | null>("sort");
  const [sortBy, setSortBy] = useState<"name" | "created" | "modified">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modal / Drawer State for Add/Edit Vendor
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    "Other Details" | "Address" | "Brokerage" | "Contact Persons" | "Bank Details" | "Custom Fields" | "Reporting Tags" | "Remarks"
  >("Other Details");

  // Show/Hide Password for Account Number
  const [showAccNo, setShowAccNo] = useState(false);
  const [showReAccNo, setShowReAccNo] = useState(false);

  // Table Filter States
  const [filterAccountType, setFilterAccountType] = useState<string>("ALL");
  const [filterMsme, setFilterMsme] = useState<string>("ALL");

  // Form State matching screenshots exactly
  const [formAccountType, setFormAccountType] = useState<Vendor["account_type"]>("Supplier / Vendor");
  const [formSalutation, setFormSalutation] = useState<string>("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formWorkPhone, setFormWorkPhone] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [workPhoneCode, setWorkPhoneCode] = useState("+91");
  const [mobileCode, setMobileCode] = useState("+91");
  const [formLanguage, setFormLanguage] = useState("ENGLISH");

  // Tab 1: Other Details
  const [formPan, setFormPan] = useState("");
  const [formIsMsme, setFormIsMsme] = useState(false);
  const [formMsmeType, setFormMsmeType] = useState("");
  const [formMsmeNumber, setFormMsmeNumber] = useState("");
  const [formCurrency, setFormCurrency] = useState("INR - INDIAN RUPEE");
  const [formAccountsPayable, setFormAccountsPayable] = useState("SELECT AN ACCOUNT");
  const [formOpeningBalance, setFormOpeningBalance] = useState<number | "">(0);
  const [formPaymentTerms, setFormPaymentTerms] = useState("Due on Receipt");
  const [formTds, setFormTds] = useState("SELECT TAX");
  const [formEnablePortal, setFormEnablePortal] = useState(false);

  // Payment Terms List & Modal State
  const [paymentTermsOptions, setPaymentTermsOptions] = useState([
    { id: "1", name: "Due end of next month", days: "N/A", discount: "0", isDefault: false },
    { id: "2", name: "Due end of the month", days: "N/A", discount: "0", isDefault: false },
    { id: "3", name: "Due on Receipt", days: "0", discount: "0", isDefault: true },
    { id: "4", name: "Net 15", days: "15", discount: "0", isDefault: false },
    { id: "5", name: "Net 30", days: "30", discount: "0", isDefault: false },
    { id: "6", name: "Net 45", days: "45", discount: "5", isDefault: false },
    { id: "7", name: "Net 60", days: "60", discount: "0", isDefault: false }
  ]);
  const [isConfigureTermsOpen, setIsConfigureTermsOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState(paymentTermsOptions);

  // Tab 2: Address
  const [billing, setBilling] = useState({
    attention: "",
    country: "INDIA",
    street1: "",
    street2: "",
    city: "Surat",
    state: "GUJARAT",
    pincode: "",
    phone: "",
    fax: ""
  });
  const [shipping, setShipping] = useState({
    attention: "",
    country: "INDIA",
    street1: "",
    street2: "",
    city: "Surat",
    state: "GUJARAT",
    pincode: "",
    phone: "",
    fax: ""
  });

  // Tab 3: Brokerage
  const [brokerage, setBrokerage] = useState({
    broker_name: "",
    work_phone: "",
    mobile: "",
    percentage: "" as number | "",
    broker_email: ""
  });

  // Tab 4: Bank Details
  const [bank, setBank] = useState({
    account_holder: "",
    bank_name: "",
    account_number: "",
    re_account_number: "",
    ifsc: "",
    upi_id: "",
    qr_setup: "Auto Generate from UPI" as "Auto Generate from UPI" | "Upload Custom QR"
  });

  // Tab 5: Contact Persons
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    designation: ""
  });

  // Tab 6: Remarks
  const [remarks, setRemarks] = useState("");

  const loadVendorsFromApi = async () => {
    try {
      const live = await fetchApi<any[]>("/vendors");
      if (Array.isArray(live)) {
        if (live.length === 0) {
          setVendors([]);
          localStorage.setItem("app_vendors_master", "[]");
          setIsLoading(false);
          return;
        }
        const defaultBill = {
          attention: "",
          country: "INDIA",
          street1: "",
          street2: "",
          city: "Surat",
          state: "GUJARAT",
          pincode: "",
          phone: "",
          fax: ""
        };
        const defaultShip = { ...defaultBill };

        const mapped: Vendor[] = live.map((v, index) => {
          let parsedBilling = { ...defaultBill, city: v.city || "Surat" };
          let parsedShipping = { ...defaultShip, city: v.city || "Surat" };
          let parsedBank: BankDetail[] = [];
          let parsedContact: ContactPerson[] = [];

          if (v.billing_address) {
            try {
              parsedBilling = typeof v.billing_address === "string" ? JSON.parse(v.billing_address) : v.billing_address;
            } catch {}
          }
          if (v.shipping_address) {
            try {
              parsedShipping = typeof v.shipping_address === "string" ? JSON.parse(v.shipping_address) : v.shipping_address;
            } catch {}
          }
          if (v.bank_details) {
            try {
              parsedBank = typeof v.bank_details === "string" ? JSON.parse(v.bank_details) : v.bank_details;
            } catch {}
          }
          if (v.contact_persons) {
            try {
              parsedContact = typeof v.contact_persons === "string" ? JSON.parse(v.contact_persons) : v.contact_persons;
            } catch {}
          }

          return {
            id: v.id || `ven-${index + 1}`,
            srNo: v.sr_no || v.srNo || index + 1,
            account_type: v.account_type || "Supplier / Vendor",
            salutation: v.salutation || "MR.",
            first_name: v.first_name || "",
            last_name: v.last_name || "",
            company_name: v.company_name,
            display_name: v.display_name || v.company_name,
            email: v.email || "",
            gstin: v.gstin || "",
            work_phone: v.work_phone || "",
            mobile: v.mobile,
            vendor_language: v.vendor_language || "ENGLISH",
            pan: v.pan || "",
            is_msme: Boolean(v.is_msme),
            currency: v.currency || "INR - INDIAN RUPEE",
            accounts_payable: v.accounts_payable || "Accounts Payable",
            opening_balance: Number(v.opening_balance) || 0,
            payment_terms: v.payment_terms || "Net 30",
            tds: v.tds || "TDS 2%",
            enable_portal: Boolean(v.enable_portal),
            billing_address: parsedBilling,
            shipping_address: parsedShipping,
            brokerage: v.brokerage || { broker_name: "", work_phone: "", mobile: "", percentage: 0, broker_email: "" },
            bank_details: Array.isArray(parsedBank) ? parsedBank : [],
            contact_persons: Array.isArray(parsedContact) ? parsedContact : [],
            remarks: v.remarks || ""
          };
        });
        setVendors(mapped);
        localStorage.setItem("app_vendors_master", JSON.stringify(mapped));
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Backend vendors fetch fallback to local storage", e);
    }

    try {
      const saved = localStorage.getItem("app_vendors_master");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVendors(parsed);
          setIsLoading(false);
          return;
        }
      }
      setVendors([]);
    } catch (e) {
      console.error("Error loading app_vendors_master", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    setHasMounted(true);
    loadVendorsFromApi();
  }, []);

  const saveVendorsList = (newList: Vendor[]) => {
    setVendors(newList);
    try {
      localStorage.setItem("app_vendors_master", JSON.stringify(newList));
      window.dispatchEvent(new Event("app_data_update"));
    } catch (e) {
      console.error("Error saving app_vendors_master", e);
    }
  };


  const openPreviewVendor = (v: Vendor) => {
    setPreviewVendor(v);
    setShowPreviewAccNo(false);
    setIsPreviewOpen(true);
  };

  const openNewVendorForm = () => {
    setEditingVendorId(null);
    setFormAccountType("Supplier / Vendor");
    setFormSalutation("");
    setFormFirstName("");
    setFormLastName("");
    setFormCompanyName("");
    setFormDisplayName("");
    setFormEmail("");
    setFormGstin("");
    setFormWorkPhone("");
    setFormMobile("");
    setWorkPhoneCode("+91");
    setMobileCode("+91");
    setFormLanguage("ENGLISH");

    setFormPan("");
    setFormIsMsme(false);
    setFormMsmeType("");
    setFormMsmeNumber("");
    setFormCurrency("INR - INDIAN RUPEE");
    setFormAccountsPayable("SELECT AN ACCOUNT");
    setFormOpeningBalance(0);
    setFormPaymentTerms("Due on Receipt");
    setFormTds("SELECT TAX");
    setFormEnablePortal(false);

    setBilling({
      attention: "",
      country: "INDIA",
      street1: "",
      street2: "",
      city: "Surat",
      state: "GUJARAT",
      pincode: "",
      phone: "",
      fax: ""
    });
    setShipping({
      attention: "",
      country: "INDIA",
      street1: "",
      street2: "",
      city: "Surat",
      state: "GUJARAT",
      pincode: "",
      phone: "",
      fax: ""
    });

    setBrokerage({
      broker_name: "",
      work_phone: "",
      mobile: "",
      percentage: "",
      broker_email: ""
    });

    setBank({
      account_holder: "",
      bank_name: "",
      account_number: "",
      re_account_number: "",
      ifsc: "",
      upi_id: "",
      qr_setup: "Auto Generate from UPI"
    });

    setContactPersons([]);
    setRemarks("");
    setActiveSubTab("Other Details");
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new" || params.get("new") === "true") {
        openNewVendorForm();
      }
    }
  }, []);

  const openEditVendorForm = (v: Vendor) => {
    setEditingVendorId(v.id);
    setFormAccountType(v.account_type);
    setFormSalutation(v.salutation);
    setFormFirstName(v.first_name);
    setFormLastName(v.last_name);
    setFormCompanyName(v.company_name);
    setFormDisplayName(v.display_name);
    setFormEmail(v.email);
    setFormGstin(v.gstin);
    setFormWorkPhone(v.work_phone);
    setFormMobile(v.mobile);
    setFormLanguage(v.vendor_language);

    setFormPan(v.pan);
    setFormIsMsme(v.is_msme);
    setFormCurrency(v.currency);
    setFormAccountsPayable(v.accounts_payable);
    setFormOpeningBalance(v.opening_balance);
    setFormPaymentTerms(v.payment_terms);
    setFormTds(v.tds);
    setFormEnablePortal(v.enable_portal);

    setBilling(v.billing_address);
    setShipping(v.shipping_address);
    setBrokerage({
      ...v.brokerage,
      percentage: v.brokerage.percentage || ""
    });

    if (v.bank_details && v.bank_details.length > 0) {
      const b = v.bank_details[0];
      setBank({
        account_holder: b.account_holder,
        bank_name: b.bank_name,
        account_number: b.account_number,
        re_account_number: b.account_number,
        ifsc: b.ifsc,
        upi_id: b.upi_id,
        qr_setup: b.qr_setup
      });
    } else {
      setBank({
        account_holder: "",
        bank_name: "",
        account_number: "",
        re_account_number: "",
        ifsc: "",
        upi_id: "",
        qr_setup: "Auto Generate from UPI"
      });
    }

    setContactPersons(v.contact_persons || []);
    setRemarks(v.remarks || "");
    setActiveSubTab("Other Details");
    setIsFormOpen(true);
  };

  const handleCopyBillingToShipping = () => {
    setShipping({ ...billing });
  };

  const handleSaveVendor = async () => {
    if (isSavingRef.current) return;

    const finalDispName = formDisplayName.trim() || formCompanyName.trim() || `${formFirstName} ${formLastName}`.trim();
    if (!finalDispName) {
      alert("⚠️ Please enter Company Name or Display Name!");
      return;
    }

    if (bank.account_number && bank.re_account_number && bank.account_number !== bank.re_account_number) {
      alert("⚠️ Bank Account Numbers do not match! Please verify.");
      setActiveSubTab("Bank Details");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const compiledBank: BankDetail[] = bank.account_number
        ? [
            {
              id: `b-${Date.now()}`,
              account_holder: bank.account_holder || finalDispName,
              bank_name: bank.bank_name || "-",
              account_number: bank.account_number,
              ifsc: bank.ifsc || "-",
              upi_id: bank.upi_id || "-",
              qr_setup: bank.qr_setup
            }
          ]
        : [];

      if (editingVendorId) {
        try {
          await fetchApi(`/vendors/${editingVendorId}`, {
            method: "PUT",
          body: JSON.stringify({
            account_type: formAccountType,
            salutation: formSalutation,
            first_name: formFirstName.trim(),
            last_name: formLastName.trim(),
            company_name: formCompanyName.trim(),
            display_name: finalDispName,
            email: formEmail.trim(),
            gstin: formGstin.trim(),
            work_phone: formWorkPhone.trim(),
            mobile: formMobile.trim(),
            pan: formPan.trim(),
            is_msme: formIsMsme,
            payment_terms: formPaymentTerms,
            opening_balance: Number(formOpeningBalance) || 0,
            city: billing.city || "Surat",
            billing_address: JSON.stringify(billing),
            shipping_address: JSON.stringify(shipping),
            bank_details: JSON.stringify(compiledBank),
            contact_persons: JSON.stringify(contactPersons),
            remarks: remarks.trim()
          })
        });
      } catch (err) {
        console.warn("Backend vendor update fallback", err);
      }

      const updated = vendors.map((v) => {
        if (v.id === editingVendorId) {
          return {
            ...v,
            account_type: formAccountType,
            salutation: formSalutation,
            first_name: formFirstName.trim(),
            last_name: formLastName.trim(),
            company_name: formCompanyName.trim(),
            display_name: finalDispName,
            email: formEmail.trim(),
            gstin: formGstin.trim(),
            work_phone: formWorkPhone.trim(),
            mobile: formMobile.trim(),
            vendor_language: formLanguage,
            pan: formPan.trim(),
            is_msme: formIsMsme,
            currency: formCurrency,
            accounts_payable: formAccountsPayable,
            opening_balance: Number(formOpeningBalance) || 0,
            payment_terms: formPaymentTerms,
            tds: formTds,
            enable_portal: formEnablePortal,
            billing_address: billing,
            shipping_address: shipping,
            brokerage: {
              broker_name: brokerage.broker_name.trim(),
              work_phone: brokerage.work_phone.trim(),
              mobile: brokerage.mobile.trim(),
              percentage: Number(brokerage.percentage) || 0,
              broker_email: brokerage.broker_email.trim()
            },
            bank_details: compiledBank,
            contact_persons: contactPersons,
            remarks: remarks.trim()
          };
        }
        return v;
      });
      saveVendorsList(updated);
    } else {
      let assignedId = `ven-${Date.now()}`;
      let nextSrNo = vendors.length > 0 ? Math.max(...vendors.map((v) => v.srNo)) + 1 : 1;
      try {
        const backendRes = await fetchApi<any>("/vendors", {
          method: "POST",
          body: JSON.stringify({
            account_type: formAccountType,
            salutation: formSalutation,
            first_name: formFirstName.trim(),
            last_name: formLastName.trim(),
            company_name: formCompanyName.trim(),
            display_name: finalDispName,
            email: formEmail.trim(),
            gstin: formGstin.trim(),
            work_phone: formWorkPhone.trim(),
            mobile: formMobile.trim(),
            pan: formPan.trim(),
            is_msme: formIsMsme,
            payment_terms: formPaymentTerms,
            opening_balance: Number(formOpeningBalance) || 0,
            city: billing.city || "Surat",
            billing_address: JSON.stringify(billing),
            shipping_address: JSON.stringify(shipping),
            bank_details: JSON.stringify(compiledBank),
            contact_persons: JSON.stringify(contactPersons),
            remarks: remarks.trim()
          })
        });
        if (backendRes?.id) {
          assignedId = backendRes.id;
          if (backendRes.sr_no) nextSrNo = backendRes.sr_no;
        }
      } catch (err) {
        console.warn("Backend vendor create fallback", err);
      }

      const created: Vendor = {
        id: assignedId,
        srNo: nextSrNo,
        account_type: formAccountType,
        salutation: formSalutation,
        first_name: formFirstName.trim(),
        last_name: formLastName.trim(),
        company_name: formCompanyName.trim(),
        display_name: finalDispName,
        email: formEmail.trim(),
        gstin: formGstin.trim(),
        work_phone: formWorkPhone.trim(),
        mobile: formMobile.trim(),
        vendor_language: formLanguage,
        pan: formPan.trim(),
        is_msme: formIsMsme,
        currency: formCurrency,
        accounts_payable: formAccountsPayable,
        opening_balance: Number(formOpeningBalance) || 0,
        payment_terms: formPaymentTerms,
        tds: formTds,
        enable_portal: formEnablePortal,
        billing_address: billing,
        shipping_address: shipping,
        brokerage: {
          broker_name: brokerage.broker_name.trim(),
          work_phone: brokerage.work_phone.trim(),
          mobile: brokerage.mobile.trim(),
          percentage: Number(brokerage.percentage) || 0,
          broker_email: brokerage.broker_email.trim()
        },
        bank_details: compiledBank,
        contact_persons: contactPersons,
        remarks: remarks.trim()
      };
      saveVendorsList([created, ...vendors]);
    }

    setIsFormOpen(false);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (confirm("Are you sure you want to delete this Vendor record?")) {
      try {
        await fetchApi(`/vendors/${id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Backend delete vendor fallback", err);
      }
      saveVendorsList(vendors.filter((v) => v.id !== id));
    }
  };

  const handleRefreshList = async () => {
    setIsRefreshing(true);
    await loadVendorsFromApi();
    setIsRefreshing(false);
    setIsActionMenuOpen(false);
  };


  const handleExportCSV = () => {
    const headers = ["SR NO", "VENDOR NAME", "ACCOUNT TYPE", "PRIMARY CONTACT", "MOBILE", "GSTIN", "PAN", "PAYMENT TERMS"];
    const rows = filteredVendors.map((v) => [
      v.srNo,
      `"${v.display_name || v.company_name}"`,
      `"${v.account_type}"`,
      `"${v.first_name} ${v.last_name}"`,
      `"${v.mobile || v.work_phone}"`,
      `"${v.gstin || ""}"`,
      `"${v.pan || ""}"`,
      `"${v.payment_terms}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vendors_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsActionMenuOpen(false);
  };

  const filteredVendors = useMemo(() => {
    let result = vendors.filter((v) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.display_name.toLowerCase().includes(q) ||
        v.company_name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.gstin.toLowerCase().includes(q) ||
        v.mobile.includes(q) ||
        v.work_phone.includes(q);

      const matchesType = filterAccountType === "ALL" || (v.account_type || "Supplier / Vendor") === filterAccountType;
      const matchesMsme = filterMsme === "ALL" || (filterMsme === "MSME" ? v.is_msme : !v.is_msme);

      return matchesSearch && matchesType && matchesMsme;
    });

    return result.sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortBy === "name") {
        valA = (a.display_name || a.company_name).toLowerCase();
        valB = (b.display_name || b.company_name).toLowerCase();
      } else if (sortBy === "created") {
        valA = a.id;
        valB = b.id;
      } else {
        valA = a.srNo.toString();
        valB = b.srNo.toString();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [vendors, search, filterAccountType, filterMsme, sortBy, sortOrder]);

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;

      if (target.tagName === "TEXTAREA" && e.shiftKey) {
        return;
      }

      const container = e.currentTarget;
      const controls = Array.from(
        container.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), button.custom-select-trigger:not([disabled]), textarea:not([disabled])'
        )
      );

      const index = controls.indexOf(target);
      if (index >= 0 && index < controls.length - 1) {
        e.preventDefault();
        controls[index + 1].focus();
      } else if (index === controls.length - 1) {
        e.preventDefault();
        handleSaveVendor();
      }
    }
  };

  if (isFormOpen) {
    return (
      <div onKeyDown={handleFormKeyDown} className="space-y-3.5 text-xs font-sans animate-in fade-in duration-150">
        {/* Action Toolbar Header for Full Page Form (Matching Vendor List Toolbar Card Design & Placement) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex items-center justify-between gap-3 text-xs">
          <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
            {editingVendorId ? "EDIT VENDOR DETAILS" : "NEW VENDOR & SUPPLIER REGISTRATION"}
          </h2>
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Vendor List</span>
          </button>
        </div>

        {/* Inline Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4 pb-6 mb-16">

            {/* PRIMARY INFORMATION */}
            <div className="space-y-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm border-b border-slate-200/60 pb-2">
                <div className="p-1 bg-blue-100 rounded text-blue-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <span>Primary Information</span>
              </div>

              {/* Account Type Radio Select */}
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center text-xs">
                <label className="font-extrabold text-rose-600">Account Type*</label>
                <div className="flex items-center gap-4 flex-wrap font-bold text-slate-700">
                  {[
                    "Supplier / Vendor",
                    "Customer / Client",
                    "Trading Partner",
                    "Internal Firm",
                    "Job Work"
                  ].map((type) => (
                    <label key={type} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="account_type"
                        checked={formAccountType === type}
                        onChange={() => setFormAccountType(type as any)}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={formAccountType === type ? "text-blue-900 font-extrabold" : ""}>
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Primary Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Primary Contact</label>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap max-w-xl">
                  <div className="w-28 sm:w-32 shrink-0">
                    <CustomSelect
                      value={formSalutation}
                      onChange={(val) => setFormSalutation(val)}
                      options={[
                        { value: "Mr.", label: "Mr." },
                        { value: "Mrs.", label: "Mrs." },
                        { value: "Ms.", label: "Ms." },
                        { value: "Dr.", label: "Dr." },
                        { value: "Prof.", label: "Prof." }
                      ]}
                      placeholder="Salutation"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs flex-1 min-w-[120px]"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs flex-1 min-w-[120px]"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Company Name</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    placeholder="e.g. Vardhman Thread Mills"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center text-xs">
                <label className="font-extrabold text-rose-600">Display Name*</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    placeholder="Select or type to add"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">If left blank, Company Name will be used.</p>
                </div>
              </div>

              {/* Email Address */}
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Email Address</label>
                <div className="max-w-md relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* GST */}
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">GST</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    placeholder="e.g. 24AABCU9603R1ZM"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs uppercase"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Phone</label>
                <div className="flex items-center gap-2 max-w-xl">
                  {/* Work Phone */}
                  <div className="flex items-center gap-1 flex-1">
                    <div className="w-20 shrink-0">
                      <CustomSelect
                        value={workPhoneCode}
                        onChange={(val) => setWorkPhoneCode(val)}
                        options={COUNTRY_CODES}
                      />
                    </div>
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Work Phone"
                        value={formWorkPhone}
                        onChange={(e) => setFormWorkPhone(e.target.value)}
                        className="w-full h-9 pl-8 pr-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs"
                      />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="flex items-center gap-1 flex-1">
                    <div className="w-20 shrink-0">
                      <CustomSelect
                        value={mobileCode}
                        onChange={(val) => setMobileCode(val)}
                        options={COUNTRY_CODES}
                      />
                    </div>
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Mobile"
                        value={formMobile}
                        onChange={(e) => setFormMobile(e.target.value)}
                        className="w-full h-9 pl-8 pr-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Language */}
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Vendor Language</label>
                <div className="max-w-md">
                  <CustomSelect
                    value={formLanguage}
                    onChange={(val) => setFormLanguage(val)}
                    options={[
                      { value: "ENGLISH", label: "ENGLISH" },
                      { value: "GUJARATI", label: "GUJARATI" },
                      { value: "HINDI", label: "HINDI" }
                    ]}
                    uppercase
                  />
                </div>
              </div>
            </div>

            {/* TABBED SUB-SECTIONS (Matching User Screenshots 1-4) */}
            <div className="space-y-4">
              {/* Tab Selector Navigation Bar */}
              <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-200 text-xs font-bold overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-0.5">
                {[
                  "Other Details",
                  "Address",
                  "Brokerage",
                  "Contact Persons",
                  "Bank Details",
                  "Remarks"
                ].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSubTab(tab as any)}
                    className={`pb-2.5 cursor-pointer transition-all border-b-2 whitespace-nowrap ${
                      activeSubTab === tab
                        ? "border-blue-600 text-blue-700 font-extrabold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT 1: OTHER DETAILS (Screenshot 1 Bottom Half) */}
              {activeSubTab === "Other Details" && (
                <div className="space-y-4 animate-in fade-in duration-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 items-start text-xs">
                    {/* Left Column Stack */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 items-center">
                        <label className="font-bold text-slate-600">PAN</label>
                        <input
                          type="text"
                          placeholder="e.g. AAACV1234F"
                          value={formPan}
                          onChange={(e) => setFormPan(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 items-center">
                        <label className="font-bold text-slate-600">Currency</label>
                        <div>
                          <CustomSelect
                            value={formCurrency}
                            onChange={(val) => setFormCurrency(val)}
                            options={[
                              { value: "INR - INDIAN RUPEE", label: "INR - INDIAN RUPEE" },
                              { value: "USD - US DOLLAR", label: "USD - US DOLLAR" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 items-center">
                        <label className="font-bold text-slate-600">Opening Balance</label>
                        <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                          <span className="px-3 text-xs font-black text-slate-500 bg-slate-50 border-r border-slate-300">INR</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={formOpeningBalance}
                            onChange={(e) => setFormOpeningBalance(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full h-9 px-3 text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 items-center">
                        <label className="font-bold text-slate-600">TDS</label>
                        <div>
                          <CustomSelect
                            value={formTds}
                            onChange={(val) => setFormTds(val)}
                            placeholder="SELECT TAX"
                            options={[
                              { value: "TDS 10%", label: "TDS 10%" },
                              { value: "TDS 5%", label: "TDS 5%" },
                              { value: "TDS 2%", label: "TDS 2%" },
                              { value: "TDS 1%", label: "TDS 1%" },
                              { value: "Not Applicable", label: "Not Applicable" }
                            ]}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column Stack */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 items-center">
                        <label className="font-bold text-slate-600">Accounts Payable</label>
                        <div>
                          <CustomSelect
                            value={formAccountsPayable}
                            onChange={(val) => setFormAccountsPayable(val)}
                            placeholder="SELECT AN ACCOUNT"
                            options={[
                              { value: "Trade Payables", label: "Trade Payables" },
                              { value: "Accounts Payable", label: "Accounts Payable" },
                              { value: "Sundry Creditors", label: "Sundry Creditors" },
                              { value: "Vendor Clearing", label: "Vendor Clearing" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 items-center">
                        <label className="font-bold text-slate-600">Payment Terms</label>
                        <div>
                          <CustomSelect
                            value={formPaymentTerms}
                            onChange={(val) => setFormPaymentTerms(val)}
                            placeholder="SELECT PAYMENT TERMS"
                            headerAction={{
                              label: "Manage",
                              onClick: () => {
                                setEditingTerms([...paymentTermsOptions]);
                                setIsConfigureTermsOpen(true);
                              }
                            }}
                            options={paymentTermsOptions.map((t) => ({
                              value: t.name,
                              label: t.name
                            }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-0.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="msme_check"
                            checked={formIsMsme}
                            onChange={(e) => setFormIsMsme(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <label htmlFor="msme_check" className="font-bold text-slate-800 cursor-pointer select-none">
                            This vendor is MSME registered
                          </label>
                        </div>

                        {formIsMsme && (
                          <div className="space-y-2.5 pt-1.5 pl-3 border-l-2 border-blue-500 animate-in fade-in duration-150">
                            <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 items-center">
                              <label className="font-bold text-slate-600 leading-tight">MSME/Udyam Type</label>
                              <div>
                                <CustomSelect
                                  value={formMsmeType}
                                  onChange={(val) => setFormMsmeType(val)}
                                  placeholder="SELECT THE REGISTRATION TYPE"
                                  options={[
                                    { value: "Micro", label: "Micro" },
                                    { value: "Small", label: "Small" },
                                    { value: "Medium", label: "Medium" }
                                  ]}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 items-center">
                              <label className="font-bold text-slate-600 leading-tight">MSME Reg Number</label>
                              <input
                                type="text"
                                placeholder="Enter the Registration Number"
                                value={formMsmeNumber}
                                onChange={(e) => setFormMsmeNumber(e.target.value)}
                                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="portal_check"
                          checked={formEnablePortal}
                          onChange={(e) => setFormEnablePortal(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="portal_check" className="font-bold text-slate-800 cursor-pointer select-none">
                          Allow portal access for this vendor
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 2: ADDRESS (Screenshot 2) */}
              {activeSubTab === "Address" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-100 text-xs">
                  {/* Billing Address Column */}
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/70">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Billing Address</h3>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Attention</label>
                      <input
                        type="text"
                        value={billing.attention}
                        onChange={(e) => setBilling({ ...billing, attention: e.target.value })}
                        className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Country/Region</label>
                      <CustomSelect
                        value={billing.country}
                        onChange={(val) => setBilling({ ...billing, country: val })}
                        options={[
                          { value: "INDIA", label: "INDIA" },
                          { value: "USA", label: "USA" },
                          { value: "UAE", label: "UAE" }
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Address</label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          placeholder="Street 1"
                          value={billing.street1}
                          onChange={(e) => setBilling({ ...billing, street1: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Street 2"
                          value={billing.street2}
                          onChange={(e) => setBilling({ ...billing, street2: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
                        <input
                          type="text"
                          value={billing.city}
                          onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
                        <input
                          type="text"
                          value={billing.state}
                          onChange={(e) => setBilling({ ...billing, state: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Pin Code</label>
                        <input
                          type="text"
                          value={billing.pincode}
                          onChange={(e) => setBilling({ ...billing, pincode: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone</label>
                        <input
                          type="text"
                          value={billing.phone}
                          onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address Column */}
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Shipping Address</h3>
                      <button
                        type="button"
                        onClick={handleCopyBillingToShipping}
                        className="text-blue-700 hover:text-blue-800 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>↓ Copy billing address</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Attention</label>
                      <input
                        type="text"
                        value={shipping.attention}
                        onChange={(e) => setShipping({ ...shipping, attention: e.target.value })}
                        className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Country/Region</label>
                      <CustomSelect
                        value={shipping.country}
                        onChange={(val) => setShipping({ ...shipping, country: val })}
                        options={[
                          { value: "INDIA", label: "INDIA" },
                          { value: "USA", label: "USA" },
                          { value: "UAE", label: "UAE" }
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Address</label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          placeholder="Street 1"
                          value={shipping.street1}
                          onChange={(e) => setShipping({ ...shipping, street1: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Street 2"
                          value={shipping.street2}
                          onChange={(e) => setShipping({ ...shipping, street2: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
                        <input
                          type="text"
                          value={shipping.city}
                          onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
                        <input
                          type="text"
                          value={shipping.state}
                          onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Pin Code</label>
                        <input
                          type="text"
                          value={shipping.pincode}
                          onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone</label>
                        <input
                          type="text"
                          value={shipping.phone}
                          onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                          className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: BROKERAGE (Screenshot 3) */}
              {activeSubTab === "Brokerage" && (
                <div className="space-y-4 animate-in fade-in duration-100 text-xs">
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2 text-[11px] font-medium">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Provide details of the broker or agent mediating this relationship. This information applies to Supplier (Purchases), Customer (Sales), or Both.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-bold text-slate-600">Broker Name</label>
                      <input
                        type="text"
                        placeholder="Enter broker name"
                        value={brokerage.broker_name}
                        onChange={(e) => setBrokerage({ ...brokerage, broker_name: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs sm:col-span-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-bold text-slate-600">Work Phone</label>
                      <div className="sm:col-span-2 relative">
                        <span className="absolute left-2.5 top-2 text-[10px] font-extrabold text-slate-400">+91</span>
                        <input
                          type="text"
                          placeholder="Enter phone number"
                          value={brokerage.work_phone}
                          onChange={(e) => setBrokerage({ ...brokerage, work_phone: e.target.value })}
                          className="w-full h-9 pl-9 pr-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-bold text-slate-600">Mobile</label>
                      <div className="sm:col-span-2 relative">
                        <span className="absolute left-2.5 top-2 text-[10px] font-extrabold text-slate-400">+91</span>
                        <input
                          type="text"
                          placeholder="Enter mobile number"
                          value={brokerage.mobile}
                          onChange={(e) => setBrokerage({ ...brokerage, mobile: e.target.value })}
                          className="w-full h-9 pl-9 pr-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-bold text-slate-600">Percentage Brokerage (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 2.5"
                        value={brokerage.percentage}
                        onChange={(e) => setBrokerage({ ...brokerage, percentage: e.target.value === "" ? "" : Number(e.target.value) })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs sm:col-span-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-bold text-slate-600">Broker Email</label>
                      <input
                        type="email"
                        placeholder="broker@example.com"
                        value={brokerage.broker_email}
                        onChange={(e) => setBrokerage({ ...brokerage, broker_email: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs sm:col-span-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 4: BANK DETAILS (Screenshot 4) */}
              {activeSubTab === "Bank Details" && (
                <div className="space-y-4 animate-in fade-in duration-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-bold text-slate-600">Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Vardhman Thread Mills"
                        value={bank.account_holder}
                        onChange={(e) => setBank({ ...bank, account_holder: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs sm:col-span-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-bold text-slate-600">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank"
                        value={bank.bank_name}
                        onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs sm:col-span-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-extrabold text-rose-600">Account Number*</label>
                      <div className="sm:col-span-2 relative">
                        <input
                          type={showAccNo ? "text" : "password"}
                          placeholder="Bank Account Number"
                          value={bank.account_number}
                          onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
                          className="w-full h-9 pl-3 pr-9 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAccNo(!showAccNo)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showAccNo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-extrabold text-rose-600">Re-enter Account Number*</label>
                      <div className="sm:col-span-2 relative">
                        <input
                          type={showReAccNo ? "text" : "password"}
                          placeholder="Re-enter Account Number"
                          value={bank.re_account_number}
                          onChange={(e) => setBank({ ...bank, re_account_number: e.target.value })}
                          className="w-full h-9 pl-3 pr-9 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowReAccNo(!showReAccNo)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showReAccNo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-extrabold text-rose-600">IFSC*</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC0000102"
                        value={bank.ifsc}
                        onChange={(e) => setBank({ ...bank, ifsc: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs sm:col-span-2 uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <label className="font-bold text-slate-600">UPI ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 1234567890@ybl"
                        value={bank.upi_id}
                        onChange={(e) => setBank({ ...bank, upi_id: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs sm:col-span-2"
                      />
                    </div>
                  </div>

                  {/* QR Code Setup Radio Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center pt-2">
                    <label className="font-bold text-slate-600 sm:col-span-1">QR Code Setup</label>
                    <div className="sm:col-span-5 flex items-center gap-4 font-bold text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="qr_setup"
                          checked={bank.qr_setup === "Auto Generate from UPI"}
                          onChange={() => setBank({ ...bank, qr_setup: "Auto Generate from UPI" })}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Auto Generate from UPI</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="qr_setup"
                          checked={bank.qr_setup === "Upload Custom QR"}
                          onChange={() => setBank({ ...bank, qr_setup: "Upload Custom QR" })}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Upload Custom QR</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 5: CONTACT PERSONS */}
              {activeSubTab === "Contact Persons" && (
                <div className="space-y-4 animate-in fade-in duration-100 text-xs">
                  <div className="space-y-2">
                    {contactPersons.map((cp) => (
                      <div key={cp.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <div className="font-bold text-slate-900">{cp.name} ({cp.designation})</div>
                          <div className="text-[11px] text-slate-500">{cp.phone} • {cp.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setContactPersons(contactPersons.filter((c) => c.id !== cp.id))}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50">
                    <h4 className="font-bold text-slate-800">Add New Contact Person</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Designation"
                        value={newContact.designation}
                        onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                        className="h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        className="h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newContact.name) return;
                          setContactPersons([
                            ...contactPersons,
                            { id: `cp-${Date.now()}`, ...newContact }
                          ]);
                          setNewContact({ name: "", email: "", phone: "", designation: "" });
                        }}
                        className="h-8 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700"
                      >
                        + Add Contact
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 6: REMARKS */}
              {activeSubTab === "Remarks" && (
                <div className="space-y-3 animate-in fade-in duration-100 text-xs">
                  <label className="block font-bold text-slate-700">Internal Remarks & Supplier Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Enter any specific notes regarding lead time, yarn quality standards, or payment agreements..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              )}
            </div>

          </div>

          {/* UNIFIED Fixed Actions Footer Bar */}
          <BottomActionBar
            showSynced={true}
            rightContent={
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsFormOpen(false)}
                  className={`px-4 py-2 font-bold rounded-xl border border-slate-300 text-xs transition-colors shadow-2xs ${
                    isSaving
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                      : "bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveVendor}
                  className={`px-5 py-2 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all ${
                    isSaving
                      ? "bg-blue-400 text-white cursor-not-allowed pointer-events-none opacity-80"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Vendor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Vendor</span>
                    </>
                  )}
                </button>
              </>
            }
          />

          {/* CONFIGURE PAYMENT TERMS MODAL (MATCHING USER SCREENSHOT 5) */}
          {isConfigureTermsOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Configure Payment Terms</h3>
                  <button
                    type="button"
                    onClick={() => setIsConfigureTermsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body / Table */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">TERM NAME</th>
                          <th className="py-2.5 px-4 text-center">NUMBER OF DAYS</th>
                          <th className="py-2.5 px-4 text-center">LESS (%)</th>
                          <th className="py-2.5 px-4 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                        {editingTerms.map((term, idx) => (
                          <tr key={term.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-bold">
                              <input
                                type="text"
                                value={term.name}
                                onChange={(e) => {
                                  const next = [...editingTerms];
                                  next[idx].name = e.target.value;
                                  setEditingTerms(next);
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs font-bold text-slate-900"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="text"
                                value={term.days}
                                onChange={(e) => {
                                  const next = [...editingTerms];
                                  next[idx].days = e.target.value;
                                  setEditingTerms(next);
                                }}
                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-700 mx-auto"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1 justify-center">
                                <input
                                  type="text"
                                  value={term.discount}
                                  onChange={(e) => {
                                    const next = [...editingTerms];
                                    next[idx].discount = e.target.value;
                                    setEditingTerms(next);
                                  }}
                                  className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center focus:outline-none focus:border-blue-500 text-xs font-bold text-slate-900"
                                />
                                <span className="text-slate-400 font-bold">%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {term.isDefault ? (
                                <span className="px-3 py-1 bg-blue-600 text-white font-extrabold rounded-lg text-[10px] inline-block shadow-2xs">
                                  Default
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = editingTerms.map((t, i) => ({
                                      ...t,
                                      isDefault: i === idx
                                    }));
                                    setEditingTerms(next);
                                  }}
                                  className="text-blue-700 hover:text-blue-800 font-bold text-xs hover:underline cursor-pointer"
                                >
                                  Mark as Default
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add New Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTerms([
                        ...editingTerms,
                        {
                          id: `term-${Date.now()}`,
                          name: "New Term",
                          days: "30",
                          discount: "0",
                          isDefault: false
                        }
                      ]);
                    }}
                    className="text-blue-700 hover:text-blue-800 font-extrabold text-xs flex items-center gap-1 transition-colors cursor-pointer py-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New</span>
                  </button>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigureTermsOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTermsOptions(editingTerms);
                      const defaultItem = editingTerms.find((t) => t.isDefault);
                      if (defaultItem) {
                        setFormPaymentTerms(defaultItem.name);
                      }
                      setIsConfigureTermsOpen(false);
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

  // DEFAULT VIEW: VENDORS TABLE LIST PAGE (MATCHING PARTIES PAGE DESIGN)
  if (!hasMounted) return null;

  return (
    <div className="space-y-4 text-xs font-sans pb-12">
      {/* SEARCH & ACTIONS TOOLBAR CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left Side: Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Name, GST, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium shadow-2xs hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Right Side: Filters & New Vendor Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Filters (2 cols on mobile) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            {/* Account Type Filter */}
            <div className="w-full sm:w-44">
              <CustomSelect
                value={filterAccountType}
                onChange={(val) => setFilterAccountType(val)}
                options={[
                  { value: "ALL", label: "All Account Types" },
                  { value: "Supplier / Vendor", label: "Supplier / Vendor" },
                  { value: "Customer / Client", label: "Customer / Client" },
                  { value: "Trading Partner", label: "Trading Partner" },
                  { value: "Internal Firm", label: "Internal Firm" },
                  { value: "Job Work", label: "Job Work" }
                ]}
              />
            </div>

            {/* MSME Status Filter */}
            <div className="w-full sm:w-40">
              <CustomSelect
                value={filterMsme}
                onChange={(val) => setFilterMsme(val)}
                options={[
                  { value: "ALL", label: "All MSME Status" },
                  { value: "MSME", label: "MSME Registered" },
                  { value: "NON_MSME", label: "Non-MSME" }
                ]}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={openNewVendorForm}
              className="flex-1 sm:flex-none h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Vendor</span>
            </button>

            {/* Action Menu (Three Dots Button matching screenshots) */}
            <div ref={actionMenuRef} className="relative inline-block shrink-0">

            <button
              type="button"
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                isActionMenuOpen
                  ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600"
              }`}
              title="More Actions & Filters"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isActionMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl p-2 sm:p-2.5 w-[260px] sm:w-[360px] max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150 font-sans"
              >
                {/* Mobile Single Column (< sm) */}
                <div className="block sm:hidden space-y-2 text-xs">
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Sort Vendors
                    </div>
                    <div className="space-y-1 mt-0.5">
                      {[
                        { id: "name", label: "Name" },
                        { id: "created", label: "Created Time" },
                        { id: "modified", label: "Last Modified" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (sortBy === item.id) {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy(item.id as any);
                              setSortOrder("asc");
                            }
                            setIsActionMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                            sortBy === item.id
                              ? "bg-blue-600 text-white font-bold shadow-2xs"
                              : "text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <span>{item.label}</span>
                          {sortBy === item.id && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleExportCSV();
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleRefreshList();
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-blue-50 text-blue-950 font-bold rounded-xl border border-blue-200/80 shadow-2xs hover:bg-blue-100 text-xs flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span>Refresh List</span>
                      </div>
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  </div>
                </div>

                {/* Desktop Split-Panel Menu (sm and above) */}
                <div
                  className="hidden sm:flex items-stretch divide-x divide-slate-100"
                  onMouseLeave={() => setActiveHoverMenu(null)}
                >
                  {/* Left Sub-Panel: Dynamic options based on hovered menu item */}
                  <div className="w-1/2 pr-2.5 flex flex-col justify-start gap-1">
                    {(!activeHoverMenu || activeHoverMenu === "sort") && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (sortBy === "name") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("name");
                              setSortOrder("asc");
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                            sortBy === "name"
                              ? "bg-blue-600 text-white font-bold shadow-md"
                              : "text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <span>Name</span>
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-90 ml-1 shrink-0" />
                        </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (sortBy === "created") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("created");
                            setSortOrder("asc");
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                          sortBy === "created"
                            ? "bg-blue-600 text-white font-bold shadow-md"
                            : "text-slate-700 hover:bg-slate-100 font-medium"
                        }`}
                      >
                        <span>Created Time</span>
                        {sortBy === "created" && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 ml-1 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (sortBy === "modified") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("modified");
                            setSortOrder("asc");
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                          sortBy === "modified"
                            ? "bg-blue-600 text-white font-bold shadow-md"
                            : "text-slate-700 hover:bg-slate-100 font-medium"
                        }`}
                      >
                        <span>Last Modified Time</span>
                        {sortBy === "modified" && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 ml-1 shrink-0" />}
                      </button>
                    </>
                  )}

                  {activeHoverMenu === "import" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionMenuOpen(false);
                          openNewVendorForm();
                        }}
                        className="w-full text-left px-3.5 py-2.5 bg-blue-50 text-blue-950 font-bold rounded-2xl border border-blue-200/80 shadow-2xs hover:bg-blue-100 text-xs transition-all cursor-pointer"
                      >
                        <span>Import CSV File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionMenuOpen(false);
                          openNewVendorForm();
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-100 font-medium rounded-2xl text-xs transition-all cursor-pointer"
                      >
                        <span>Import Excel Sheet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionMenuOpen(false);
                          alert("Sample CSV Template downloaded");
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-100 font-medium rounded-2xl text-xs transition-all cursor-pointer"
                      >
                        <span>Sample Template</span>
                      </button>
                    </>
                  )}

                  {activeHoverMenu === "export" && (
                    <>
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="w-full text-left px-3.5 py-2.5 bg-blue-50 text-blue-950 font-bold rounded-2xl border border-blue-200/80 shadow-2xs hover:bg-blue-100 text-xs transition-all cursor-pointer"
                      >
                        <span>Export CSV File</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-100 font-medium rounded-2xl text-xs transition-all cursor-pointer"
                      >
                        <span>Export Excel Sheet</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-100 font-medium rounded-2xl text-xs transition-all cursor-pointer"
                      >
                        <span>Export Filtered Data</span>
                      </button>
                    </>
                  )}

                  {activeHoverMenu === "preferences" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsActionMenuOpen(false)}
                        className="w-full text-left px-3.5 py-2.5 bg-blue-50 text-blue-950 font-bold rounded-2xl border border-blue-200/80 shadow-2xs hover:bg-blue-100 text-xs transition-all cursor-pointer"
                      >
                        <span>Column Visibility</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActionMenuOpen(false)}
                        className="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-100 font-medium rounded-2xl text-xs transition-all cursor-pointer"
                      >
                        <span>Dense Row Height</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActionMenuOpen(false)}
                        className="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-100 font-medium rounded-2xl text-xs transition-all cursor-pointer"
                      >
                        <span>Reset Grid Layout</span>
                      </button>
                    </>
                  )}

                  {activeHoverMenu === "refresh" && (
                    <>
                      <button
                        type="button"
                        onClick={handleRefreshList}
                        className="w-full text-left px-3.5 py-2.5 bg-blue-50 text-blue-950 font-bold rounded-2xl border border-blue-200/80 shadow-2xs hover:bg-blue-100 text-xs transition-all cursor-pointer"
                      >
                        <span>Refresh List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterAccountType("ALL");
                          setFilterMsme("ALL");
                          setSearch("");
                          setIsActionMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-100 font-medium rounded-2xl text-xs transition-all cursor-pointer"
                      >
                        <span>Reset All Filters</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Right Panel: Main Actions List */}
                <div className="w-1/2 pl-2.5 flex flex-col gap-1 text-xs text-slate-700 font-semibold">
                  <div
                    onMouseEnter={() => setActiveHoverMenu("sort")}
                    onClick={() => setActiveHoverMenu(activeHoverMenu === "sort" ? null : "sort")}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold transition-all cursor-pointer ${
                      activeHoverMenu === "sort" || !activeHoverMenu
                        ? "bg-blue-50 text-blue-950 font-extrabold border border-blue-200/80 shadow-2xs"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-3.5 h-3.5 text-blue-700" />
                      <span>Sort by</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
                  </div>

                  <button
                    type="button"
                    onMouseEnter={() => setActiveHoverMenu("import")}
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      openNewVendorForm();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold transition-all cursor-pointer ${
                      activeHoverMenu === "import"
                        ? "bg-blue-50 text-blue-950 font-extrabold border border-blue-200/80 shadow-2xs"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Import</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onMouseEnter={() => setActiveHoverMenu("export")}
                    onClick={handleExportCSV}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold transition-all cursor-pointer ${
                      activeHoverMenu === "export"
                        ? "bg-blue-50 text-blue-950 font-extrabold border border-blue-200/80 shadow-2xs"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onMouseEnter={() => setActiveHoverMenu("preferences")}
                    onClick={() => {
                      setIsActionMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold transition-all cursor-pointer ${
                      activeHoverMenu === "preferences"
                        ? "bg-blue-50 text-blue-950 font-extrabold border border-blue-200/80 shadow-2xs"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preferences</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onMouseEnter={() => setActiveHoverMenu("refresh")}
                    onClick={handleRefreshList}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold transition-all cursor-pointer ${
                      activeHoverMenu === "refresh"
                        ? "bg-blue-50 text-blue-950 font-extrabold border border-blue-200/80 shadow-2xs"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                      <span>Refresh List</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* VENDORS TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* 1. MOBILE RESPONSIVE CARD VIEW (NO HORIZONTAL SCROLLING REQUIRED) */}
        <div className="block md:hidden p-3 space-y-3">
          {isLoading && vendors.length === 0 ? (
            [1, 2, 3].map((n) => (
              <div key={`v-mskel-${n}`} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
            ))
          ) : filteredVendors.length === 0 ? (
            <div className="py-8 px-4 text-center text-slate-400 font-medium text-xs">
              No vendor records found matching your filters. Click &quot;+ New Vendor&quot; to add a record.
            </div>
          ) : (
            filteredVendors.map((v) => (
              <div
                key={v.id}
                onClick={() => openPreviewVendor(v)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group"
              >
                {/* Header: Name + Account Type + SR */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-800 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                      {v.srNo}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                      {v.display_name || v.company_name}
                    </h3>
                  </div>
                  <span className="font-mono font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs border border-emerald-200 shrink-0">
                    {v.account_type || "Vendor"}
                  </span>
                </div>

                {/* Primary Contact & MSME */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-slate-800 truncate">
                    {v.salutation ? `${v.salutation} ` : ""}{v.first_name} {v.last_name}
                  </span>
                  {v.is_msme && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded text-[9px] border border-emerald-200 shrink-0">
                      MSME
                    </span>
                  )}
                </div>

                {/* Meta Badges: GSTIN & Payment Terms */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">GSTIN / PAN</span>
                    <span className="font-mono font-bold text-slate-700 text-[11px] truncate block">
                      {v.gstin || v.pan || "-"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Terms</span>
                    <span className="font-mono font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px] border border-emerald-200 inline-block w-fit">
                      {v.payment_terms || "Due on Receipt"}
                    </span>
                  </div>
                </div>

                {/* Contact & Actions Row */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div>
                    {v.mobile || v.work_phone ? (
                      <a
                        href={`tel:${v.mobile || v.work_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 text-xs font-mono font-bold transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{v.mobile || v.work_phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">No Phone</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openPreviewVendor(v)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditVendorForm(v)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVendor(v.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. DESKTOP / TABLET DATA TABLE (VISIBLE ON md: AND ABOVE) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse divide-y divide-slate-100 min-w-[850px]">
            <thead className="bg-slate-50/90 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">SR NO.</th>
                <th className="py-3.5 px-5">VENDOR NAME</th>
                <th className="py-3.5 px-4 text-center">ACCOUNT TYPE</th>
                <th className="py-3.5 px-4">PRIMARY CONTACT</th>
                <th className="py-3.5 px-4 font-mono">MOBILE / PHONE</th>
                <th className="py-3.5 px-4 font-mono">GSTIN / PAN</th>
                <th className="py-3.5 px-4 text-center">PAYMENT TERMS</th>
                <th className="py-3.5 px-4 text-center w-28">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {isLoading && vendors.length === 0 ? (
                [1, 2, 3, 4].map((n) => (
                  <tr key={`v-skel-${n}`} className="animate-pulse">
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-100 rounded w-6 mx-auto" /></td>
                    <td className="py-4 px-5"><div className="h-5 bg-slate-100 rounded-lg w-40" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-100 rounded w-24 mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-100 rounded w-12 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium text-xs">
                    No vendor records found matching your filters. Click &quot;+ New Vendor&quot; to add a record.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => openPreviewVendor(v)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 text-center font-bold text-slate-500 font-mono text-xs">{v.srNo}</td>
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700 transition-colors">
                        {v.display_name || v.company_name}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs border border-emerald-200 inline-block">
                        {v.account_type || "Supplier / Vendor"}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {v.salutation ? `${v.salutation} ` : ""}{v.first_name} {v.last_name}
                    </td>
                    <td className="py-4 px-4 font-mono whitespace-nowrap">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 inline" />
                        {v.mobile || v.work_phone || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono whitespace-nowrap">
                      <span className="font-bold text-slate-700">{v.gstin || v.pan || "-"}</span>
                      {v.is_msme && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded text-[9px] border border-emerald-200 ml-1.5">
                          MSME
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs border border-emerald-200 inline-block">
                        {v.payment_terms || "Due on Receipt"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openPreviewVendor(v)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Preview Vendor Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditVendorForm(v)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Vendor Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(v.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Vendor Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VENDOR DETAILS PREVIEW MODAL */}
      {isPreviewOpen && previewVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-base border border-blue-200 shadow-2xs shrink-0 mt-0.5 sm:mt-0">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {previewVendor.display_name || previewVendor.company_name}
                      </h2>
                      <span className="font-mono font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg text-[11px] border border-emerald-200 shrink-0">
                        {previewVendor.account_type}
                      </span>
                      {previewVendor.is_msme && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md text-[9px] border border-emerald-200 shrink-0">
                          MSME REGISTERED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                      Vendor ID: <span className="font-mono font-bold text-slate-700">{previewVendor.id}</span>
                    </p>
                  </div>
                </div>

                {/* Top Actions: Edit (Desktop) and Close (All) */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openEditVendorForm(previewVendor);
                    }}
                    className="hidden sm:inline-flex px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Record</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-4 sm:space-y-6 text-xs text-slate-800">
              {/* Primary Contact & Tax Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Contact</div>
                  <div className="font-extrabold text-slate-900 mt-1 text-xs sm:text-sm">
                    {previewVendor.salutation ? `${previewVendor.salutation} ` : ""}{previewVendor.first_name} {previewVendor.last_name}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 truncate">{previewVendor.company_name}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile & Phone</div>
                  <div className="mt-1 space-y-1">
                    {previewVendor.mobile ? (
                      <a
                        href={`tel:${previewVendor.mobile.replace(/\s+/g, "")}`}
                        className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline font-mono flex items-center gap-1.5 text-xs sm:text-sm"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{previewVendor.mobile}</span>
                      </a>
                    ) : (
                      <div className="text-slate-400 font-mono text-xs sm:text-sm">-</div>
                    )}
                    {previewVendor.work_phone && previewVendor.work_phone !== "-" && (
                      <a
                        href={`tel:${previewVendor.work_phone.replace(/\s+/g, "")}`}
                        className="font-bold text-slate-800 hover:text-blue-700 hover:underline font-mono flex items-center gap-1.5 text-xs sm:text-sm"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Work: {previewVendor.work_phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GSTIN & PAN</div>
                  <div className="font-bold font-mono text-slate-900 mt-1 text-xs">
                    {previewVendor.gstin || "-"}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                    PAN: {previewVendor.pan || "-"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment & TDS</div>
                  <div className="mt-1">
                    <span className="font-mono font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px] border border-emerald-200 inline-block">
                      {previewVendor.payment_terms}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1">
                    TDS: {previewVendor.tds}
                  </div>
                </div>
              </div>

              {/* Addresses Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Billing Address Card */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                  <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Billing Address</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">GST Address</span>
                  </div>
                  <div className="space-y-1 text-slate-700 font-medium">
                    {previewVendor.billing_address.attention && (
                      <p className="font-bold text-slate-900">Attn: {previewVendor.billing_address.attention}</p>
                    )}
                    <p>{previewVendor.billing_address.street1}</p>
                    {previewVendor.billing_address.street2 && <p>{previewVendor.billing_address.street2}</p>}
                    <p>
                      {previewVendor.billing_address.city}, {previewVendor.billing_address.state} - {previewVendor.billing_address.pincode}
                    </p>
                    <p className="text-slate-500 font-bold">{previewVendor.billing_address.country}</p>
                  </div>
                </div>

                {/* Shipping Address Card */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                  <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Shipping Address</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">Dispatch Location</span>
                  </div>
                  <div className="space-y-1 text-slate-700 font-medium">
                    {previewVendor.shipping_address.attention && (
                      <p className="font-bold text-slate-900">Attn: {previewVendor.shipping_address.attention}</p>
                    )}
                    <p>{previewVendor.shipping_address.street1}</p>
                    {previewVendor.shipping_address.street2 && <p>{previewVendor.shipping_address.street2}</p>}
                    <p>
                      {previewVendor.shipping_address.city}, {previewVendor.shipping_address.state} - {previewVendor.shipping_address.pincode}
                    </p>
                    <p className="text-slate-500 font-bold">{previewVendor.shipping_address.country}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    <span>Bank Account Details</span>
                  </div>
                </div>
                {previewVendor.bank_details.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{previewVendor.bank_details[0].bank_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Account Holder</span>
                      <p className="font-bold text-slate-800 mt-0.5">{previewVendor.bank_details[0].account_holder}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Account Number</span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-mono font-bold text-slate-900">
                        <span>
                          {showPreviewAccNo
                            ? previewVendor.bank_details[0].account_number
                            : previewVendor.bank_details[0].account_number.replace(/.(?=.{4})/g, "•")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPreviewAccNo(!showPreviewAccNo)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          {showPreviewAccNo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code & UPI</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{previewVendor.bank_details[0].ifsc}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{previewVendor.bank_details[0].upi_id}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">No bank details added for this vendor.</p>
                )}
              </div>

              {/* Brokerage & Remarks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Brokerage Info */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                  <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                    Brokerage Information
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Broker Name</span>
                      <p className="font-bold text-slate-900 mt-0.5">{previewVendor.brokerage?.broker_name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Commission %</span>
                      <p className="font-extrabold text-emerald-700 mt-0.5">
                        {previewVendor.brokerage?.percentage ? `${previewVendor.brokerage.percentage}%` : "0%"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Broker Mobile</span>
                      <p className="font-mono font-bold text-slate-800 mt-0.5">{previewVendor.brokerage?.mobile || "-"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Broker Email</span>
                      <p className="font-medium text-slate-700 mt-0.5 truncate">{previewVendor.brokerage?.broker_email || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Remarks & Contact Persons */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                  <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                    Remarks & Notes
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {previewVendor.remarks || "No remarks entered."}
                  </p>
                  {previewVendor.contact_persons && previewVendor.contact_persons.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Additional Contact Person</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {previewVendor.contact_persons[0].name} ({previewVendor.contact_persons[0].designation})
                      </p>
                      <p className="font-mono text-slate-500 text-[11px]">{previewVendor.contact_persons[0].phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsPreviewOpen(false);
                  openEditVendorForm(previewVendor);
                }}
                className="sm:hidden flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Record</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
