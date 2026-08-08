// ======================================================
// FINANCE — SHARED TYPES
// app/(dashboard)/payments/types.ts
// ======================================================

// ======================================================
// NAVIGATION
// ======================================================

export type FinanceTab =
  | "overview"
  | "sales"
  | "expenses"
  | "banking"
  | "tax"
  | "payroll"
  | "timesheets"
  | "reports";

export type SalesSubTab =
  | "all"
  | "invoices"
  | "quotes"
  | "recurring";

// ======================================================
// DOCUMENTS
// ======================================================

export type DocType =
  | "Invoice"
  | "Quote";

export type DocumentStatus =
  | "draft"
  | "pending"
  | "sent"
  | "paid"
  | "accepted"
  | "converted"
  | "overdue"
  | "cancelled"
  | "void"
  | "rejected"
  | "failed"
  | string;

// ======================================================
// MODALS
// ======================================================

export type FinanceModalType =
  | "dispatch"
  | "employee"
  | "expense"
  | "vat"
  | "tax"
  | "subscription"
  | null;

// ======================================================
// ORGANISATION / USER CONTEXT
// ======================================================

export type FinanceContext = {
  userId: string | null;
  organisationId: string | null;
  teamId: string | null;
  loading: boolean;
  error: string | null;
};

// ======================================================
// CUSTOMERS
// ======================================================

export type Customer = {
  id: string;
  name: string;
  email: string | null;

  organisation_id?: string | null;
  team_id?: string | null;

  phone?: string | null;
  company?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

// ======================================================
// LINE ITEMS
// ======================================================

export type LineItem = {
  id: number;
  desc: string;
  qty: number;
  price: number;
};

export type StoredLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

// ======================================================
// INVOICE
// ======================================================

export type Invoice = {
  id: string;

  customer_id: string | null;

  amount: number | null;
  tax: number | null;

  items?: StoredLineItem[] | null;

  status: string | null;

  type?: string | null;
  doc_type?: string | null;

  due_date?: string | null;

  organisation_id: string;
  team_id?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

// ======================================================
// QUOTE
// ======================================================

export type Quote = {
  id: string;

  client_name: string | null;

  description?: string | null;

  amount: number | null;

  status: string | null;

  date?: string | null;

  organisation_id: string;
  team_id?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

// ======================================================
// NORMALISED SALES LEDGER
// ======================================================

export type LedgerEntry = {
  id: string;

  type: DocType;

  client: string;

  amount: number;

  status: string;

  date: string;

  createdAt?: string | null;

  dueDate?: string | null;

  tax?: number;

  customerId?: string | null;

  organisationId?: string | null;

  teamId?: string | null;
};

// ======================================================
// INVOICE / QUOTE FORM
// ======================================================

export type DocumentFormData = {
  customerId: string;
  newClientName: string;
  dueDate: string;
};

// ======================================================
// EXPENSES
// ======================================================

export type Expense = {
  id: string;

  amount: number;

  description: string | null;

  date: string | null;

  status: string | null;

  category?: string | null;

  organisation_id?: string | null;

  team_id?: string | null;

  created_at?: string | null;
};

export type ExpenseFormData = {
  description: string;

  amount: string;

  date: string;

  status: string;

  category: string;
};

// ======================================================
// GENERIC FINANCE RECORD
// Used for VAT / tax-style records
// ======================================================

export type SimpleRecord = {
  id: string;

  amount: number;

  description: string | null;

  date: string | null;

  status: string | null;

  category?: string | null;

  organisation_id?: string | null;

  team_id?: string | null;

  created_at?: string | null;
};

// ======================================================
// RECURRING INVOICES / SUBSCRIPTIONS
// ======================================================

export type SubscriptionInterval =
  | "weekly"
  | "monthly"
  | "yearly"
  | string;

export type Subscription = {
  id: string;

  client_name: string | null;

  amount: number | null;

  interval: SubscriptionInterval | null;

  next_run: string | null;

  active: boolean | null;

  organisation_id?: string | null;

  team_id?: string | null;

  created_at?: string | null;
};

export type SubscriptionFormData = {
  client_name: string;

  amount: string;

  interval: SubscriptionInterval;

  next_run: string;
};

// ======================================================
// PAYROLL EMPLOYEES
// ======================================================

export type PayrollEmployee = {
  id: string;

  name: string;

  role: string | null;

  salary_gross: number | null;

  organisation_id?: string | null;

  team_id?: string | null;

  created_at?: string | null;
};

export type EmployeeFormData = {
  name: string;

  role: string;

  salary_gross: string;
};

// ======================================================
// PAYSLIPS
// ======================================================

export type Payslip = {
  id: string;

  employee_id: string;

  gross: number | null;

  net: number | null;

  tax: number | null;

  ni: number | null;

  period_start: string | null;

  period_end: string | null;

  status?: string | null;

  organisation_id?: string | null;

  team_id?: string | null;

  created_at?: string | null;
};

// ======================================================
// TIMESHEETS
// ======================================================

export type Timesheet = {
  id: string;

  user_id?: string | null;

  employee_id?: string | null;

  project_id?: string | null;

  organisation_id?: string | null;

  team_id?: string | null;

  week_start?: string | null;

  mon?: number | null;

  tue?: number | null;

  wed?: number | null;

  thu?: number | null;

  fri?: number | null;

  sat?: number | null;

  sun?: number | null;

  hourly_rate?: number | null;

  status?: string | null;

  created_at?: string | null;

  updated_at?: string | null;
};

// ======================================================
// VAT
// ======================================================

export type VATReturn = {
  id: string;

  amount: number;

  description: string | null;

  date: string | null;

  status: string | null;

  organisation_id?: string | null;

  team_id?: string | null;

  created_at?: string | null;
};

export type VATFormData = {
  amount: string;
  description: string;
};

// ======================================================
// TAX
// ======================================================

export type TaxRecord = {
  id: string;

  amount: number;

  description: string | null;

  date: string | null;

  status: string | null;

  organisation_id?: string | null;

  team_id?: string | null;

  created_at?: string | null;
};

export type TaxFormData = {
  amount: string;
  description: string;
};

// ======================================================
// BANKING
// ======================================================

export type BankingDirection =
  | "in"
  | "out";

export type BankingSource =
  | "invoice"
  | "expense";

export type BankingRow = {
  id: string;

  date: string;

  label: string;

  amount: number;

  direction: BankingDirection;

  source: BankingSource;

  status: string;

  suggestion: string;
};

// ======================================================
// ACTION CENTRE
// ======================================================

export type ActionSeverity =
  | "critical"
  | "warning"
  | "info";

export type ActionItem = {
  id: string;

  title: string;

  detail: string;

  severity: ActionSeverity;

  targetTab: FinanceTab;
};

// ======================================================
// FINANCE HEALTH
// ======================================================

export type FinanceHealthLabel =
  | "Strong"
  | "Stable"
  | "Watch"
  | "At Risk";

export type FinanceHealth = {
  score: number;

  label: FinanceHealthLabel;
};

// ======================================================
// EXPENSE CATEGORY REPORTING
// ======================================================

export type ExpenseCategoryTotal = {
  category: string;

  total: number;
};

// ======================================================
// FINANCE METRICS
// ======================================================

export type FinanceMetrics = {
  // Revenue
  paidRevenue: number;

  outstandingRevenue: number;

  overdueValue: number;

  upcomingInvoiceValue: number;

  activeRecurringRevenue: number;

  // Expenses
  expenseTotal: number;

  approvedExpenseTotal: number;

  pendingExpenseValue: number;

  // Profit
  operatingProfit: number;

  profitMargin: number;

  // Tax
  vatCollected: number;

  filedVAT: number;

  vatEstimate: number;

  simplifiedTaxEstimate: number;

  reserveRequirement: number;

  // Cash
  netCashPosition: number;

  usableCash: number;

  // Costs
  monthlyBurn: number;

  monthlyPayroll: number;

  labourCost: number;

  // Workforce
  totalHours: number;

  revenuePerHour: number;

  // Runway
  runwayMonths: number;

  // Health
  financeHealth: FinanceHealth;
};

// ======================================================
// NOTIFICATIONS
// ======================================================

export type FinanceNotificationType =
  | "success"
  | "error";

export type FinanceNotification = {
  visible: boolean;

  msg: string;

  type: FinanceNotificationType;
};

// ======================================================
// FINANCE DATA COLLECTION
// ======================================================

export type FinanceData = {
  customers: Customer[];

  ledger: LedgerEntry[];

  invoices: LedgerEntry[];

  quotes: LedgerEntry[];

  expenses: Expense[];

  timesheets: Timesheet[];

  vatReturns: VATReturn[];

  selfAssessments: TaxRecord[];

  subscriptions: Subscription[];

  payrollEmployees: PayrollEmployee[];

  payslips: Payslip[];

  bankingRows: BankingRow[];

  actionItems: ActionItem[];

  expenseCategories: ExpenseCategoryTotal[];

  metrics: FinanceMetrics;
};

// ======================================================
// FINANCE ACTIONS
// ======================================================

export type FinanceActions = {
  refresh: () => void | Promise<void>;

  createInvoice?: () => Promise<void>;

  createQuote?: () => Promise<void>;

  markPaid: (
    entry: LedgerEntry
  ) => Promise<void>;

  deleteEntry: (
    entry: LedgerEntry
  ) => Promise<void>;

  convertToInvoice: (
    entry: LedgerEntry
  ) => Promise<void>;

  addExpense?: () => Promise<void>;

  approveExpense: (
    id: string
  ) => Promise<void>;

  addSubscription?: () => Promise<void>;

  toggleSubscription: (
    subscription: Subscription
  ) => Promise<void>;

  addEmployee?: () => Promise<void>;

  fileVatReturn?: () => Promise<void>;

  fileTaxReturn?: () => Promise<void>;
};

// ======================================================
// MAIN HOOK RETURN TYPE
// ======================================================

export type FinanceModule = FinanceData & {
  loading: boolean;

  submitting: boolean;

  error: string | null;

  organisationId: string | null;

  teamId: string | null;

  actions: FinanceActions;
};

// ======================================================
// COMPONENT PROPS
// ======================================================

export type FinanceSectionProps = {
  finance: FinanceModule;
};

export type FinanceHeaderProps = {
  activeTab: FinanceTab;

  onTabChange: (
    tab: FinanceTab
  ) => void;
};

// ======================================================
// NAVIGATION ITEM
// ======================================================

export type FinanceNavItem = {
  key: FinanceTab;

  label: string;

  icon: React.ReactElement;
};