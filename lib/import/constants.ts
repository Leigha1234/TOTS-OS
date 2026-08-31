// ==========================================
// lib/import/constants.ts
// ==========================================

import {
  TargetTableType,
} from "./types";

// ============================================================
// COLUMN ALIASES
// ============================================================

export const COLUMN_ALIASES:
  Record<
    string,
    string[]
  > = {
  // ==========================================================
  // PERSON / CONTACT
  // ==========================================================

  name: [
    "name",
    "full name",
    "full_name",
    "contact name",
    "contact_name",
    "client name",
    "client_name",
    "customer name",
    "customer_name",
    "person",
    "person name",
    "member name",
    "member_name",
    "subscriber name",
    "subscriber_name",
  ],

  first_name: [
    "first name",
    "first_name",
    "firstname",
    "forename",
    "given name",
    "given_name",
  ],

  last_name: [
    "last name",
    "last_name",
    "lastname",
    "surname",
    "family name",
    "family_name",
  ],

  email: [
    "email",
    "email address",
    "email_address",
    "e-mail",
    "mail",
    "contact email",
    "contact_email",
    "customer email",
    "customer_email",
    "client email",
    "client_email",
    "subscriber",
    "subscriber email",
    "subscriber_email",
  ],

  phone: [
    "phone",
    "phone number",
    "phone_number",
    "telephone",
    "telephone number",
    "telephone_number",
    "mobile",
    "mobile number",
    "mobile_number",
    "cell",
    "cell phone",
    "contact number",
    "contact_number",
    "tel",
  ],

  position: [
    "position",
    "role",
    "job title",
    "job_title",
    "job role",
    "job_role",
    "title",
    "occupation",
  ],

  // ==========================================================
  // COMPANY / ORGANISATION
  // ==========================================================

  company_name: [
    "company",
    "company name",
    "company_name",
    "business",
    "business name",
    "business_name",
    "organisation",
    "organisation name",
    "organisation_name",
    "organization",
    "organization name",
    "organization_name",
    "org",
    "org name",
    "org_name",
    "employer",
    "employer name",
    "employer_name",
  ],

  website: [
    "website",
    "website url",
    "website_url",
    "url",
    "web",
    "site",
    "web address",
    "web_address",
    "company website",
    "company_website",
    "business website",
    "business_website",
  ],

  domain: [
    "domain",
    "company domain",
    "company_domain",
    "business domain",
    "business_domain",
    "email domain",
    "email_domain",
  ],

  address: [
    "address",
    "street",
    "street address",
    "street_address",
    "address line 1",
    "address_line_1",
    "address1",
    "business address",
    "business_address",
    "company address",
    "company_address",
  ],

  address_line_2: [
    "address line 2",
    "address_line_2",
    "address2",
  ],

  city: [
    "city",
    "town",
    "municipality",
  ],

  county: [
    "county",
    "region",
    "state",
    "province",
  ],

  postcode: [
    "postcode",
    "post code",
    "postal code",
    "postal_code",
    "zip",
    "zipcode",
    "zip code",
    "zip_code",
  ],

  country: [
    "country",
    "nation",
  ],

  // ==========================================================
  // FINANCE
  // ==========================================================

  amount: [
    "amount",
    "price",
    "total",
    "total amount",
    "total_amount",
    "cost",
    "value",
    "sum",
    "fee",
    "gross",
    "gross amount",
    "gross_amount",
  ],

  invoice_number: [
    "invoice number",
    "invoice_number",
    "invoice no",
    "invoice_no",
    "invoice #",
    "invoice id",
    "invoice_id",
    "reference",
    "invoice reference",
    "invoice_reference",
  ],

  expense_number: [
    "expense number",
    "expense_number",
    "expense id",
    "expense_id",
    "receipt number",
    "receipt_number",
    "receipt id",
    "receipt_id",
  ],

  category: [
    "category",
    "expense category",
    "expense_category",
    "type",
  ],

  currency: [
    "currency",
    "currency code",
    "currency_code",
  ],

  tax: [
    "tax",
    "vat",
    "tax amount",
    "tax_amount",
    "vat amount",
    "vat_amount",
  ],

  // ==========================================================
  // PROJECTS
  // ==========================================================

  project_name: [
    "project",
    "project name",
    "project_name",
    "job",
    "job name",
    "job_name",
  ],

  task_name: [
    "task",
    "task name",
    "task_name",
    "action",
    "action item",
    "action_item",
  ],

  // ==========================================================
  // DESCRIPTIONS / NOTES
  // ==========================================================

  description: [
    "description",
    "details",
    "memo",
    "summary",
    "comment",
    "comments",
    "note",
    "notes",
  ],

  notes: [
    "notes",
    "note",
    "internal notes",
    "internal_notes",
    "comments",
    "comment",
    "memo",
  ],

  // ==========================================================
  // DATES
  // ==========================================================

  date: [
    "date",
    "transaction date",
    "transaction_date",
    "invoice date",
    "invoice_date",
    "expense date",
    "expense_date",
    "payment date",
    "payment_date",
  ],

  created_at: [
    "created at",
    "created_at",
    "date created",
    "date_created",
    "created",
    "creation date",
    "creation_date",
    "added",
    "date added",
    "date_added",
  ],

  due_date: [
    "due date",
    "due_date",
    "payment due",
    "payment_due",
    "deadline",
  ],

  subscribed_at: [
    "subscribed",
    "subscribed at",
    "subscribed_at",
    "subscription date",
    "subscription_date",
    "date subscribed",
    "date_subscribed",
  ],

  // ==========================================================
  // STATUS
  // ==========================================================

  status: [
    "status",
    "state",
    "record status",
    "record_status",
    "customer status",
    "customer_status",
    "member status",
    "member_status",
  ],

  // ==========================================================
  // MAILING / MARKETING
  // ==========================================================

  sent: [
    "sent",
    "emails sent",
    "emails_sent",
    "messages sent",
    "messages_sent",
  ],

  opens: [
    "opens",
    "open",
    "email opens",
    "email_opens",
    "opened",
  ],

  clicks: [
    "clicks",
    "click",
    "email clicks",
    "email_clicks",
    "clicked",
  ],

  location: [
    "location",
    "subscriber location",
    "subscriber_location",
  ],

  source: [
    "source",
    "lead source",
    "lead_source",
    "customer source",
    "customer_source",
    "import source",
    "import_source",
  ],

  // ==========================================================
  // EXTERNAL SYSTEM IDS
  // ==========================================================

  external_id: [
    "external id",
    "external_id",
    "customer id",
    "customer_id",
    "client id",
    "client_id",
    "member id",
    "member_id",
    "subscriber id",
    "subscriber_id",
    "contact id",
    "contact_id",
    "teamup id",
    "teamup_id",
  ],
};

// ============================================================
// TARGET TABLE MAPPINGS
// ============================================================

export const TARGET_TABLE_MAPPINGS:
  Record<
    Exclude<
      TargetTableType,
      "auto"
    >,
    string
  > = {
  contacts:
    "contacts",

  organisations:
    "organisations",

  invoices:
    "invoices",

  expenses:
    "expenses",

  projects:
    "projects",
};

// ============================================================
// BATCH CONFIGURATION
// ============================================================

export const BATCH_CONFIG = {
  DEFAULT_BATCH_SIZE:
    50,

  MAX_RETRIES:
    3,

  RETRY_DELAY_MS:
    1000,
} as const;

// ============================================================
// UNIQUE / DUPLICATE KEYS
// ============================================================

export const UNIQUE_KEYS:
  Record<
    string,
    string | string[]
  > = {
  contacts:
    "email",

  organisations:
    "name",

  invoices:
    "invoice_number",

  projects:
    "name",
};