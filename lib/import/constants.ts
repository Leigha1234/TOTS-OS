// ==========================================
// lib/import/constants.ts
// ==========================================

import { TargetTableType } from "./types";

/**
 * Enterprise Column Aliases Dictionary
 * Maps diverse incoming header variations to canonical database attributes
 * to support intelligent fuzzy mapping.
 */
export const COLUMN_ALIASES: Record<string, string[]> = {
  name: [
    'name', 
    'full name', 
    'client name', 
    'customer name', 
    'contact name', 
    'employee name', 
    'staff name', 
    'entity', 
    'person', 
    'first name', 
    'lastname', 
    'last name', 
    'surname', 
    'full_name',
    'company name', 
    'company', 
    'organisation name', 
    'organization name', 
    'org name',
    'organisation',
    'organization'
  ],
  email: [
    'email', 
    'email address', 
    'mail', 
    'contact email', 
    'e-mail'
  ],
  phone: [
    'phone', 
    'telephone', 
    'mobile', 
    'cell', 
    'contact number', 
    'phone number', 
    'tel'
  ],
  domain: [
    'domain', 
    'website', 
    'url', 
    'web', 
    'company domain', 
    'site'
  ],
  address: [
    'address', 
    'street', 
    'street address', 
    'location', 
    'address line 1'
  ],
  city: [
    'city', 
    'town', 
    'municipality'
  ],
  postcode: [
    'postcode', 
    'postal code', 
    'zip', 
    'zipcode'
  ],
  country: [
    'country', 
    'nation'
  ],
  amount: [
    'amount', 
    'price', 
    'total', 
    'cost', 
    'value', 
    'sum', 
    'fee'
  ],
  description: [
    'description', 
    'notes', 
    'details', 
    'memo', 
    'comment', 
    'summary'
  ],
  date: [
    'date', 
    'created at', 
    'timestamp', 
    'due date', 
    'transaction date', 
    'invoice date'
  ]
};

/**
 * System Target Tables Configuration
 */
/**
 * System Target Tables Configuration
 */
export const TARGET_TABLE_MAPPINGS: Record<Exclude<TargetTableType, 'auto'>, string> = {
  contacts: 'contacts',
  organisations: 'organisations',
  invoices: 'invoices',
  expenses: 'expenses',
  projects: 'projects'
};

/**
 * Batch Processing Configuration Defaults
 */
export const BATCH_CONFIG = {
  DEFAULT_BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000
};

/**
 * Unique Keys for Duplicate Checking by Table
 */
export const UNIQUE_KEYS: Record<string, string> = {
  contacts: 'email',
  organisations: 'name',
  invoices: 'invoice_number',
  expenses: 'id',
  projects: 'name'
};