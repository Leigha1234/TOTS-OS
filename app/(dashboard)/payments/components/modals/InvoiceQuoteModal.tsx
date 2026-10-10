"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { Check, ChevronDown, Loader2, Plus, Send, Trash2, X } from "lucide-react";

// ============================================================
// TYPES
// ============================================================

export type InvoiceQuoteDocType =
  | "Invoice"
  | "Quote";

export type FinanceLineItem = {
  id: number;
  desc: string;
  qty: number;
  price: number;
};

export type FinanceCustomer = {
  id: string;
  name: string;
  email?: string | null;
  address?: string | null;
};

export type FinanceProject = {
  id: string;
  name: string;
  customer_id?: string | null;
  status?: string | null;
};

export type FinanceContact = {
  id: string;
  name: string;
  email?: string | null;
  customer_id?: string | null;
};

export type FinanceStaffMember = {
  id: string;
  name: string;
  email?: string | null;
};

export type RepeatFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type PaymentMethod =
  | "bank_transfer"
  | "card"
  | "cash"
  | "direct_debit"
  | "paypal"
  | "other";

export type InvoiceQuoteFormData = {
  // Existing fields
  customerId: string;
  projectId: string;
  newClientName: string;
  dueDate: string;

  // Invoice identity
  invoiceNumber?: string;
  orderNumber?: string;
  invoiceDate?: string;

  // Customer information
  customerName?: string;
  customerAddress?: string;

  // Ownership / assignment
  salesPerson?: string;
  assignedStaffId?: string;
  assignedContactId?: string;

  // Sending
  sendToContactId?: string;
  sendToEmail?: string;

  // Payment
  paymentMethod?: PaymentMethod | "";
  paymentInstructions?: string;

  // VAT
  vatEnabled?: boolean;
  vatRate?: string;

  // Recurring invoices
  repeatInvoice?: boolean;
  repeatFrequency?: RepeatFrequency;
  repeatStartDate?: string;
  repeatEndDate?: string;

  // Reminders
  remindersEnabled?: boolean;
  reminderDaysBefore?: string;
  reminderDaysAfter?: string;

  // Terms / notes
  terms?: string;
  notes?: string;
};

// ============================================================
// PROPS
// ============================================================

type InvoiceQuoteModalProps = {
  open: boolean;
  submitting?: boolean;

  docType: InvoiceQuoteDocType;

  customers: FinanceCustomer[];
  projects: FinanceProject[];

  contacts?: FinanceContact[];
  staffMembers?: FinanceStaffMember[];

  formData: InvoiceQuoteFormData;
  lineItems: FinanceLineItem[];

  netTotal: number;
  vatTotal: number;
  grandTotal: number;

  onDocTypeChange: (
    type: InvoiceQuoteDocType
  ) => void;

  onFormChange: (
    form: InvoiceQuoteFormData
  ) => void;

  onLineItemsChange: (
    items: FinanceLineItem[]
  ) => void;

  onClose: () => void;
  onSubmit: () => void;

  // Optional actions
  onDuplicate?: () => void;
  onSavePdf?: () => void;
  onPrint?: () => void;
  onSend?: () => void;
};

// ============================================================
// HELPERS
// ============================================================

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function todayInputValue() {
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .slice(0, 10);
}

// ============================================================
// COMPONENT
// ============================================================

export default function InvoiceQuoteModal({
  open,
  submitting = false,

  docType,

  customers,
  projects,

  contacts = [],
  staffMembers = [],

  formData,
  lineItems,

  netTotal,
  vatTotal,
  grandTotal,

  onDocTypeChange,
  onFormChange,
  onLineItemsChange,

  onClose,
  onSubmit,

  onDuplicate,
  onSavePdf,
  onPrint,
  onSend,
}: InvoiceQuoteModalProps) {
  // ==========================================================
  // LOCAL INPUT DRAFTS
  // ==========================================================

  /*
   * Quantity and price remain numbers in the parent state,
   * but we keep text versions locally.
   *
   * This means users can type freely:
   * 1
   * 10
   * 10.5
   * 100.00
   *
   * without the input fighting them on every keystroke.
   */

  const [
    quantityDrafts,
    setQuantityDrafts,
  ] = useState<
    Record<number, string>
  >({});

  const [
    priceDrafts,
    setPriceDrafts,
  ] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    const nextQty: Record<
      number,
      string
    > = {};

    const nextPrice: Record<
      number,
      string
    > = {};

    lineItems.forEach(
      (item) => {
        nextQty[
          item.id
        ] =
          quantityDrafts[
            item.id
          ] ??
          String(
            item.qty
          );

        nextPrice[
          item.id
        ] =
          priceDrafts[
            item.id
          ] ??
          String(
            item.price
          );
      }
    );

    setQuantityDrafts(
      nextQty
    );

    setPriceDrafts(
      nextPrice
    );
    // We intentionally only resync when the
    // line item collection itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    lineItems.length,
  ]);

  // ==========================================================
  // FORM HELPERS
  // ==========================================================

  const updateForm = (
    changes: Partial<InvoiceQuoteFormData>
  ) => {
    onFormChange({
      ...formData,
      ...changes,
    });
  };

  // ==========================================================
  // LINE ITEM HELPERS
  // ==========================================================

  const updateDescription = (
    id: number,
    value: string
  ) => {
    onLineItemsChange(
      lineItems.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                desc: value,
              }
            : item
      )
    );
  };

  const updateQuantity = (
    id: number,
    value: string
  ) => {
    /*
     * Allow digits + decimal point while typing.
     */
    if (
      !/^\d*\.?\d*$/.test(
        value
      )
    ) {
      return;
    }

    setQuantityDrafts(
      (previous) => ({
        ...previous,
        [id]: value,
      })
    );

    const parsed =
      Number(value);

    if (
      Number.isFinite(
        parsed
      )
    ) {
      onLineItemsChange(
        lineItems.map(
          (item) =>
            item.id ===
            id
              ? {
                  ...item,
                  qty:
                    parsed,
                }
              : item
        )
      );
    }
  };

  const updatePrice = (
    id: number,
    value: string
  ) => {
    if (
      !/^\d*\.?\d{0,2}$/.test(
        value
      )
    ) {
      return;
    }

    setPriceDrafts(
      (previous) => ({
        ...previous,
        [id]: value,
      })
    );

    const parsed =
      Number(value);

    if (
      Number.isFinite(
        parsed
      )
    ) {
      onLineItemsChange(
        lineItems.map(
          (item) =>
            item.id ===
            id
              ? {
                  ...item,
                  price:
                    parsed,
                }
              : item
        )
      );
    }
  };

  const normaliseQuantity = (
    id: number
  ) => {
    const raw =
      quantityDrafts[
        id
      ];

    const parsed =
      Number(raw);

    const safe =
      Number.isFinite(
        parsed
      ) &&
      parsed > 0
        ? parsed
        : 1;

    setQuantityDrafts(
      (previous) => ({
        ...previous,
        [id]:
          String(safe),
      })
    );

    onLineItemsChange(
      lineItems.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                qty: safe,
              }
            : item
      )
    );
  };

  const normalisePrice = (
    id: number
  ) => {
    const raw =
      priceDrafts[
        id
      ];

    const parsed =
      Number(raw);

    const safe =
      Number.isFinite(
        parsed
      ) &&
      parsed >= 0
        ? parsed
        : 0;

    setPriceDrafts(
      (previous) => ({
        ...previous,
        [id]:
          safe.toFixed(
            2
          ),
      })
    );

    onLineItemsChange(
      lineItems.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                price: safe,
              }
            : item
      )
    );
  };

  const addLineItem =
    () => {
      const id =
        Date.now();

      setQuantityDrafts(
        (previous) => ({
          ...previous,
          [id]: "1",
        })
      );

      setPriceDrafts(
        (previous) => ({
          ...previous,
          [id]: "",
        })
      );

      onLineItemsChange([
        ...lineItems,
        {
          id,
          desc: "",
          qty: 1,
          price: 0,
        },
      ]);
    };

  const removeLineItem =
    (id: number) => {
      if (
        lineItems.length <=
        1
      ) {
        return;
      }

      setQuantityDrafts(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            id
          ];

          return next;
        }
      );

      setPriceDrafts(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            id
          ];

          return next;
        }
      );

      onLineItemsChange(
        lineItems.filter(
          (item) =>
            item.id !==
            id
        )
      );
    };

  // ==========================================================
  // FORMAT
  // ==========================================================

  const currency = (
    value: number
  ) =>
    Number(
      value || 0
    ).toLocaleString(
      "en-GB",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    );

  // ==========================================================
  // FILTERED DATA
  // ==========================================================

  const availableProjects =
    useMemo(
      () =>
        formData.customerId
          ? projects.filter(
              (
                project
              ) =>
                project.customer_id ===
                formData.customerId
            )
          : [],
      [
        formData.customerId,
        projects,
      ]
    );

  const availableContacts =
    useMemo(
      () =>
        formData.customerId
          ? contacts.filter(
              (
                contact
              ) =>
                !contact.customer_id ||
                contact.customer_id ===
                  formData.customerId
            )
          : contacts,
      [
        contacts,
        formData.customerId,
      ]
    );

  // ==========================================================
  // CUSTOMER SELECTION
  // ==========================================================

  const handleCustomerChange =
    (
      customerId: string
    ) => {
      const customer =
        customers.find(
          (item) =>
            item.id ===
            customerId
        );

      updateForm({
        customerId,

        projectId:
          "",

        customerName:
          customer?.name ||
          "",

        customerAddress:
          customer?.address ||
          "",

        sendToEmail:
          customer?.email ||
          formData.sendToEmail ||
          "",

        sendToContactId:
          "",

        assignedContactId:
          "",
      });
    };

  // ==========================================================
  // VAT
  // ==========================================================

  const vatEnabled =
    formData.vatEnabled ??
    true;

  const displayedVat =
    vatEnabled
      ? vatTotal
      : 0;

  /*
   * We derive the visible total ourselves so VAT switching
   * immediately updates the modal.
   *
   * Your parent finance logic should also use vatEnabled
   * before persisting the invoice.
   */

  const displayedGrandTotal =
    vatEnabled
      ? grandTotal
      : netTotal;

  // ==========================================================
  // SUBMISSION VALIDATION
  // ==========================================================

  const hasRecipient =
    Boolean(
      formData.sendToContactId?.trim()
    ) ||
    Boolean(
      formData.sendToEmail?.trim()
    );

  const recipientEmailValid =
    !formData.sendToEmail?.trim() ||
    isValidEmail(
      formData.sendToEmail
    );

  const recurringValid =
    !formData.repeatInvoice ||
    Boolean(
      formData.repeatFrequency
    ) &&
      Boolean(
        formData.repeatStartDate
      );

  const canSubmit =
    !submitting &&
    lineItems.length > 0 &&
    lineItems.every(
      (item) =>
        item.desc
          .trim()
          .length >
          0 &&
        item.qty > 0 &&
        item.price >= 0
    ) &&
    (formData.customerId
      .trim()
      .length >
      0 ||
      (docType ===
        "Quote" &&
        formData.newClientName
          .trim()
          .length >
          0)) &&
    (docType !==
      "Invoice" ||
      Boolean(
        formData.dueDate
      )) &&
    recipientEmailValid &&
    recurringValid;


  const [advancedOpen, setAdvancedOpen] = useState(false);

  const selectedCustomer = customers.find(
    (customer) => customer.id === formData.customerId
  );

  const selectedProject = projects.find(
    (project) => project.id === formData.projectId
  );

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-stone-900 disabled:cursor-not-allowed disabled:opacity-50";

  const labelClass =
    "mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-stone-400";

  const sectionTitleClass =
    "text-[10px] font-black uppercase tracking-[0.22em] text-stone-900";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-stone-900/60 p-3 backdrop-blur-sm sm:p-5"
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-[#faf9f6] shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-5 py-4 sm:px-7">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8fa07d]">
                    Sales
                  </p>
                  <h2 className="mt-1 font-serif text-2xl italic tracking-tight text-stone-900 sm:text-3xl">
                    New {docType}
                  </h2>
                </div>

                <div className="hidden rounded-full bg-[#faf9f6] p-1 sm:flex">
                  {(["Invoice", "Quote"] as InvoiceQuoteDocType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onDocTypeChange(type)}
                      disabled={submitting}
                      className={`rounded-full px-4 py-2 text-[8px] font-black uppercase tracking-widest transition ${
                        docType === type
                          ? "bg-stone-900 text-white"
                          : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close"
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {/* Mobile document type */}
              <div className="mb-5 flex rounded-full bg-white p-1 sm:hidden">
                {(["Invoice", "Quote"] as InvoiceQuoteDocType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onDocTypeChange(type)}
                    className={`flex-1 rounded-full px-4 py-2 text-[8px] font-black uppercase tracking-widest ${
                      docType === type ? "bg-stone-900 text-white" : "text-stone-400"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* 1. Customer */}
              <section className="mb-5 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2e9] text-[10px] font-black text-[#7f916d]">
                    1
                  </div>
                  <div>
                    <h3 className={sectionTitleClass}>Customer</h3>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      Who is this {docType.toLowerCase()} for?
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Customer</label>
                    <select
                      value={formData.customerId}
                      onChange={(event) => handleCustomerChange(event.target.value)}
                      disabled={submitting}
                      className={inputClass}
                    >
                      <option value="">Select a customer...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                          {customer.email ? ` — ${customer.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {docType === "Quote" && !formData.customerId && (
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Or enter a new client</label>
                      <input
                        value={formData.newClientName}
                        onChange={(event) =>
                          updateForm({ newClientName: event.target.value })
                        }
                        placeholder="Client or business name"
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>
                      {docType === "Invoice" ? "Invoice date" : "Quote date"}
                    </label>
                    <input
                      type="date"
                      value={formData.invoiceDate || todayInputValue()}
                      onChange={(event) =>
                        updateForm({ invoiceDate: event.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {docType === "Invoice" ? "Due date" : "Valid until"}
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(event) => updateForm({ dueDate: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                {(selectedCustomer || formData.customerName) && (
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-stone-400">
                    <span className="font-semibold text-stone-600">
                      {selectedCustomer?.name || formData.customerName}
                    </span>
                    {(selectedCustomer?.email || formData.sendToEmail) && (
                      <span>{selectedCustomer?.email || formData.sendToEmail}</span>
                    )}
                    {selectedProject && <span>Project: {selectedProject.name}</span>}
                  </div>
                )}
              </section>

              {/* 2. Line items */}
              <section className="mb-5 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2e9] text-[10px] font-black text-[#7f916d]">
                      2
                    </div>
                    <div>
                      <h3 className={sectionTitleClass}>What are you charging for?</h3>
                      <p className="mt-0.5 text-[11px] text-stone-400">
                        Add products, services or billable work.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addLineItem}
                    disabled={submitting}
                    className="flex shrink-0 items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#7f916d]"
                  >
                    <Plus size={13} />
                    Add item
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => {
                    const lineTotal = Number(item.qty || 0) * Number(item.price || 0);

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-stone-100 bg-[#faf9f6] p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">
                            Item {index + 1}
                          </span>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              className="text-stone-300 transition hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[1fr_80px_120px_100px] sm:items-end">
                          <div>
                            <label className={labelClass}>Description</label>
                            <input
                              value={item.desc}
                              onChange={(event) =>
                                updateDescription(item.id, event.target.value)
                              }
                              placeholder="e.g. Website design"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Qty</label>
                            <input
                              inputMode="decimal"
                              value={quantityDrafts[item.id] ?? String(item.qty)}
                              onChange={(event) =>
                                updateQuantity(item.id, event.target.value)
                              }
                              onBlur={() => normaliseQuantity(item.id)}
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Price</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                                £
                              </span>
                              <input
                                inputMode="decimal"
                                value={priceDrafts[item.id] ?? String(item.price)}
                                onChange={(event) =>
                                  updatePrice(item.id, event.target.value)
                                }
                                onBlur={() => normalisePrice(item.id)}
                                className={`${inputClass} pl-8`}
                              />
                            </div>
                          </div>

                          <div className="rounded-xl bg-white px-3 py-3 text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">
                              Total
                            </p>
                            <p className="mt-1 font-mono text-sm font-semibold text-stone-800">
                              £{currency(lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={vatEnabled}
                      onClick={() => updateForm({ vatEnabled: !vatEnabled })}
                      className={`relative h-6 w-11 rounded-full transition ${
                        vatEnabled ? "bg-[#a9b897]" : "bg-stone-200"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          vatEnabled ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-bold text-stone-600">Add VAT</span>
                  </label>

                  {vatEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.vatRate ?? "20"}
                        onChange={(event) => {
                          if (/^\d*\.?\d*$/.test(event.target.value)) {
                            updateForm({ vatRate: event.target.value });
                          }
                        }}
                        className="w-16 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-right text-xs outline-none focus:border-stone-900"
                      />
                      <span className="text-xs text-stone-400">%</span>
                    </div>
                  )}
                </div>
              </section>

              {/* 3. Review */}
              <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2e9] text-[10px] font-black text-[#7f916d]">
                    3
                  </div>
                  <div>
                    <h3 className={sectionTitleClass}>Review & send</h3>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      Check the total, then save or send.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-stone-900 p-5 text-white">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-500">
                        {docType}
                      </p>
                      <p className="mt-1 font-mono text-sm text-stone-300">
                        {formData.invoiceNumber || "Number generated automatically"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-500">
                        {docType === "Invoice" ? "Balance due" : "Total"}
                      </p>
                      <p className="mt-1 font-mono text-2xl text-[#b8c7a7]">
                        £{currency(displayedGrandTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500">Net</span>
                      <span className="font-mono">£{currency(netTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500">VAT</span>
                      <span className="font-mono">
                        {vatEnabled ? `£${currency(displayedVat)}` : "Not applied"}
                      </span>
                    </div>
                    {formData.dueDate && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-500">
                          {docType === "Invoice" ? "Due" : "Valid until"}
                        </span>
                        <span>{new Date(`${formData.dueDate}T12:00:00`).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* More options */}
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((value) => !value)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-stone-200 bg-[#faf9f6] px-4 py-3 text-left transition hover:bg-stone-50"
                >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-700">
                      More options
                    </p>
                    <p className="mt-0.5 text-[10px] text-stone-400">
                      Project, recipient, payment terms, reminders, recurring & notes
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-stone-400 transition ${advancedOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {advancedOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid gap-4 rounded-2xl border border-stone-100 bg-[#faf9f6] p-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Project</label>
                          <select
                            value={formData.projectId}
                            onChange={(event) => updateForm({ projectId: event.target.value })}
                            disabled={!formData.customerId}
                            className={inputClass}
                          >
                            <option value="">No project</option>
                            {availableProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={labelClass}>Invoice / quote number</label>
                          <input
                            value={formData.invoiceNumber ?? ""}
                            onChange={(event) =>
                              updateForm({ invoiceNumber: event.target.value })
                            }
                            placeholder="Generated automatically"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Send to contact</label>
                          <select
                            value={formData.sendToContactId ?? ""}
                            onChange={(event) => {
                              const id = event.target.value;
                              const contact = availableContacts.find((item) => item.id === id);
                              updateForm({
                                sendToContactId: id,
                                sendToEmail: contact?.email || formData.sendToEmail || "",
                              });
                            }}
                            className={inputClass}
                          >
                            <option value="">Customer / email below</option>
                            {availableContacts.map((contact) => (
                              <option key={contact.id} value={contact.id}>
                                {contact.name}{contact.email ? ` — ${contact.email}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={labelClass}>Recipient email</label>
                          <input
                            type="email"
                            value={formData.sendToEmail ?? ""}
                            onChange={(event) => updateForm({ sendToEmail: event.target.value })}
                            placeholder="client@example.com"
                            className={inputClass}
                          />
                          {formData.sendToEmail && !recipientEmailValid && (
                            <p className="mt-1 text-[10px] text-red-500">
                              Enter a valid email address.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>Assigned staff</label>
                          <select
                            value={formData.assignedStaffId ?? ""}
                            onChange={(event) =>
                              updateForm({ assignedStaffId: event.target.value })
                            }
                            className={inputClass}
                          >
                            <option value="">Unassigned</option>
                            {staffMembers.map((staff) => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={labelClass}>Payment method</label>
                          <select
                            value={formData.paymentMethod ?? ""}
                            onChange={(event) =>
                              updateForm({
                                paymentMethod: event.target.value as PaymentMethod | "",
                              })
                            }
                            className={inputClass}
                          >
                            <option value="">No preference</option>
                            <option value="card">Card / online payment</option>
                            <option value="bank_transfer">Bank transfer</option>
                            <option value="direct_debit">Direct debit</option>
                            <option value="cash">Cash</option>
                            <option value="paypal">PayPal</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>Payment instructions</label>
                          <textarea
                            rows={2}
                            value={formData.paymentInstructions ?? ""}
                            onChange={(event) =>
                              updateForm({ paymentInstructions: event.target.value })
                            }
                            placeholder="Optional payment instructions..."
                            className={inputClass}
                          />
                        </div>

                        {docType === "Invoice" && (
                          <>
                            <div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-white p-4">
                              <div>
                                <p className="text-[10px] font-bold text-stone-700">
                                  Repeat this invoice
                                </p>
                                <p className="mt-0.5 text-[10px] text-stone-400">
                                  For retainers, subscriptions and recurring services.
                                </p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={Boolean(formData.repeatInvoice)}
                                onClick={() =>
                                  updateForm({ repeatInvoice: !formData.repeatInvoice })
                                }
                                className={`relative h-6 w-11 rounded-full transition ${
                                  formData.repeatInvoice ? "bg-[#a9b897]" : "bg-stone-200"
                                }`}
                              >
                                <span
                                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                    formData.repeatInvoice ? "left-6" : "left-1"
                                  }`}
                                />
                              </button>
                            </div>

                            {formData.repeatInvoice && (
                              <>
                                <div>
                                  <label className={labelClass}>Frequency</label>
                                  <select
                                    value={formData.repeatFrequency ?? ""}
                                    onChange={(event) =>
                                      updateForm({
                                        repeatFrequency: event.target.value as RepeatFrequency,
                                      })
                                    }
                                    className={inputClass}
                                  >
                                    <option value="">Choose...</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="fortnightly">Fortnightly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={labelClass}>Start date</label>
                                  <input
                                    type="date"
                                    value={formData.repeatStartDate ?? ""}
                                    onChange={(event) =>
                                      updateForm({ repeatStartDate: event.target.value })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className={labelClass}>End date (optional)</label>
                                  <input
                                    type="date"
                                    value={formData.repeatEndDate ?? ""}
                                    onChange={(event) =>
                                      updateForm({ repeatEndDate: event.target.value })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              </>
                            )}

                            <div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-white p-4">
                              <div>
                                <p className="text-[10px] font-bold text-stone-700">
                                  Payment reminders
                                </p>
                                <p className="mt-0.5 text-[10px] text-stone-400">
                                  Keep reminder settings with this invoice.
                                </p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={Boolean(formData.remindersEnabled)}
                                onClick={() =>
                                  updateForm({ remindersEnabled: !formData.remindersEnabled })
                                }
                                className={`relative h-6 w-11 rounded-full transition ${
                                  formData.remindersEnabled ? "bg-[#a9b897]" : "bg-stone-200"
                                }`}
                              >
                                <span
                                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                    formData.remindersEnabled ? "left-6" : "left-1"
                                  }`}
                                />
                              </button>
                            </div>

                            {formData.remindersEnabled && (
                              <>
                                <div>
                                  <label className={labelClass}>Days before due</label>
                                  <input
                                    inputMode="numeric"
                                    value={formData.reminderDaysBefore ?? "3"}
                                    onChange={(event) => {
                                      if (/^\d*$/.test(event.target.value)) {
                                        updateForm({ reminderDaysBefore: event.target.value });
                                      }
                                    }}
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>Days after due</label>
                                  <input
                                    inputMode="numeric"
                                    value={formData.reminderDaysAfter ?? "1"}
                                    onChange={(event) => {
                                      if (/^\d*$/.test(event.target.value)) {
                                        updateForm({ reminderDaysAfter: event.target.value });
                                      }
                                    }}
                                    className={inputClass}
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}

                        <div>
                          <label className={labelClass}>Terms</label>
                          <textarea
                            rows={3}
                            value={formData.terms ?? ""}
                            onChange={(event) => updateForm({ terms: event.target.value })}
                            placeholder="Payment terms shown to the customer..."
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Notes</label>
                          <textarea
                            rows={3}
                            value={formData.notes ?? ""}
                            onChange={(event) => updateForm({ notes: event.target.value })}
                            placeholder="Additional notes..."
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!hasRecipient && (
                  <p className="mt-3 text-[10px] text-amber-600">
                    You can save this {docType.toLowerCase()} now. Add an email under
                    More options before sending it.
                  </p>
                )}
              </section>
            </div>

            {/* Sticky actions */}
            <div className="shrink-0 border-t border-stone-200 bg-white px-5 py-4 sm:px-7">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#a9b897] py-3.5 text-stone-900 transition hover:bg-[#9aaa87] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-[0.22em]">
                    {submitting ? "Saving..." : `Save ${docType}`}
                  </span>
                </button>

                {onSend && (
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={
                      submitting ||
                      !canSubmit ||
                      !hasRecipient ||
                      !recipientEmailValid
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3.5 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={15} />
                    <span className="text-[9px] font-black uppercase tracking-[0.22em]">
                      Create & Send
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
