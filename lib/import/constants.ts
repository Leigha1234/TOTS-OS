// ==========================================
// 2. lib/import/constants.ts
// ==========================================

export const COLUMN_ALIASES: Record<string, string[]> = {
  name: [
    'name', 'full name', 'client name', 'customer name', 'contact name',
    'employee name', 'staff name', 'entity', 'person', 'first name', 'lastname',
    'last name', 'surname', 'full_name'
  ],
  email: [
    'email', 'email address', 'mail', 'e-mail', 'electronic mail', 'email_address'
  ],
  phone: [
    'phone', 'phone number', 'mobile', 'telephone', 'mobile number', 'contact number',
    'cell', 'cell phone', 'phone_number', 'telephone number'
  ],
  company_name: [
    'company', 'business', 'organisation', 'organization', 'company name', 'employer',
    'firm', 'enterprise', 'corporation', 'company_name', 'organisation_name'
  ],
  role: [
    'role', 'job role', 'position', 'title', 'job title', 'occupation', 'designation'
  ],
  address: [
    'address', 'street', 'street address', 'location', 'address line 1', 'street_address'
  ],
  postcode: [
    'postcode', 'postal code', 'zip', 'zipcode', 'postal_code', 'pin code'
  ],
  city: [
    'city', 'town', 'municipality', 'locality'
  ],
  country: [
    'country', 'nation', 'region'
  ],
  invoice_number: [
    'invoice', 'invoice number', 'invoice #', 'inv number', 'inv_no', 'invoice_no'
  ],
  amount: [
    'amount', 'total', 'value', 'revenue', 'payment', 'price', 'cost', 'fee', 'sum'
  ],
  status: [
    'status', 'stage', 'state', 'condition', 'progress'
  ],
  due_date: [
    'due date', 'date', 'created', 'invoice date', 'duedate', 'due_date', 'date due', 'created_at'
  ],
  description: [
    'notes', 'description', 'comment', 'details', 'memo', 'remarks', 'comments'
  ],
  project_name: [
    'project', 'project name', 'project_name', 'initiative', 'campaign'
  ],
  task_name: [
    'task', 'task name', 'todo', 'action item', 'task_name'
  ],
  priority: [
    'priority', 'urgency', 'importance', 'severity'
  ],
  department: [
    'department', 'team', 'division', 'unit', 'group'
  ],
  salary: [
    'salary', 'wage', 'compensation', 'pay', 'income'
  ],
  tags: [
    'tags', 'labels', 'categories', 'keywords'
  ]
};

export const UNIQUE_KEYS: Record<string, string[]> = {
  contacts: ['email'],
  organisations: ['company_name'],
  projects: ['name', 'organisation_id'],
  tasks: ['name'],
  invoices: ['invoice_number'],
  expenses: ['description', 'amount', 'date'],
  employees: ['email']
};