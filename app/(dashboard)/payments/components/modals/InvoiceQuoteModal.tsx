"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Bell,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Contact,
  Copy,
  CreditCard,
  FileDown,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Printer,
  RefreshCw,
  Send,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

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

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          onClick={
            onClose
          }
          className="fixed inset-0 z-[999] flex items-center justify-center bg-stone-900/60 p-3 backdrop-blur-sm sm:p-4"
        >
          <motion.div
            initial={{
              scale:
                0.97,
              opacity: 0,
              y: 12,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale:
                0.97,
              opacity: 0,
              y: 12,
            }}
            transition={{
              duration:
                0.2,
              ease:
                "easeOut",
            }}
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8"
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[8px] font-black uppercase tracking-[0.35em] text-[#a9b897]">
                  Sales
                </p>

                <h2 className="font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">
                  New{" "}
                  {docType}
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-5 text-stone-400">
                  Create,
                  assign, send
                  and manage
                  your financial
                  document from
                  one place.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  submitting
                }
                aria-label="Close invoice or quote modal"
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            {/* =================================================
                DOCUMENT TYPE
            ================================================= */}

            <div className="mb-7 flex w-fit gap-1 rounded-full bg-[#faf9f6] p-1">
              {(
                [
                  "Invoice",
                  "Quote",
                ] as InvoiceQuoteDocType[]
              ).map(
                (
                  type
                ) => (
                  <button
                    key={
                      type
                    }
                    type="button"
                    onClick={() =>
                      onDocTypeChange(
                        type
                      )
                    }
                    disabled={
                      submitting
                    }
                    className={`rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-widest transition ${
                      docType ===
                      type
                        ? "bg-stone-900 text-white"
                        : "text-stone-400 hover:text-stone-700"
                    }`}
                  >
                    {
                      type
                    }
                  </button>
                )
              )}
            </div>

            {/* =================================================
                TOP ACTION BAR
            ================================================= */}

            <div className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-stone-100 bg-[#faf9f6] p-3">
              {onDuplicate && (
                <button
                  type="button"
                  onClick={
                    onDuplicate
                  }
                  disabled={
                    submitting
                  }
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[8px] font-black uppercase tracking-widest text-stone-600 transition hover:bg-stone-900 hover:text-white"
                >
                  <Copy
                    size={
                      12
                    }
                  />

                  Duplicate
                </button>
              )}

              {onSavePdf && (
                <button
                  type="button"
                  onClick={
                    onSavePdf
                  }
                  disabled={
                    submitting
                  }
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[8px] font-black uppercase tracking-widest text-stone-600 transition hover:bg-stone-900 hover:text-white"
                >
                  <FileDown
                    size={
                      12
                    }
                  />

                  Save PDF
                </button>
              )}

              {onPrint && (
                <button
                  type="button"
                  onClick={
                    onPrint
                  }
                  disabled={
                    submitting
                  }
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[8px] font-black uppercase tracking-widest text-stone-600 transition hover:bg-stone-900 hover:text-white"
                >
                  <Printer
                    size={
                      12
                    }
                  />

                  Print
                </button>
              )}
            </div>

            {/* =================================================
                DOCUMENT DETAILS
            ================================================= */}

            <section className="mb-8">
              <SectionHeading
                icon={
                  <Hash
                    size={
                      14
                    }
                  />
                }
                title="Document Details"
                description="Reference numbers and important dates."
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* INVOICE NUMBER */}

                <Field>
                  <FieldLabel>
                    {docType}{" "}
                    Number
                  </FieldLabel>

                  <input
                    value={
                      formData.invoiceNumber ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          invoiceNumber:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder={
                      docType ===
                      "Invoice"
                        ? "INV-001"
                        : "QUO-001"
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* ORDER NUMBER */}

                <Field>
                  <FieldLabel>
                    Order /
                    Purchase
                    Number
                  </FieldLabel>

                  <input
                    value={
                      formData.orderNumber ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          orderNumber:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="PO-001"
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* INVOICE DATE */}

                <Field>
                  <FieldLabel>
                    {docType}{" "}
                    Date
                  </FieldLabel>

                  <input
                    type="date"
                    value={
                      formData.invoiceDate ??
                      todayInputValue()
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          invoiceDate:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* DUE DATE */}

                {docType ===
                  "Invoice" && (
                  <Field>
                    <FieldLabel>
                      Due Date
                    </FieldLabel>

                    <input
                      type="date"
                      value={
                        formData.dueDate
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          {
                            dueDate:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>
                )}

                {/* SALES PERSON */}

                <Field>
                  <FieldLabel>
                    Sales Person
                  </FieldLabel>

                  <input
                    value={
                      formData.salesPerson ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          salesPerson:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="Sales person"
                    className={
                      inputClass
                    }
                  />
                </Field>
              </div>
            </section>

            {/* =================================================
                CUSTOMER
            ================================================= */}

            <section className="mb-8">
              <SectionHeading
                icon={
                  <Users
                    size={
                      14
                    }
                  />
                }
                title="Customer"
                description="Who this document belongs to."
              />

              <div className="grid gap-4 md:grid-cols-2">
                {/* EXISTING CUSTOMER */}

                <Field>
                  <FieldLabel>
                    Existing
                    Customer
                  </FieldLabel>

                  <select
                    value={
                      formData.customerId
                    }
                    onChange={(
                      event
                    ) =>
                      handleCustomerChange(
                        event
                          .target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Select
                      customer...
                    </option>

                    {customers.map(
                      (
                        customer
                      ) => (
                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {
                            customer.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                {/* NEW CUSTOMER */}

                {docType ===
                  "Quote" &&
                  !formData.customerId && (
                    <Field>
                      <FieldLabel>
                        New Client
                        Name
                      </FieldLabel>

                      <input
                        value={
                          formData.newClientName
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            {
                              newClientName:
                                event
                                  .target
                                  .value,

                              customerName:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="Enter client name"
                        className={
                          inputClass
                        }
                      />
                    </Field>
                  )}

                {/* CUSTOMER NAME */}

                <Field>
                  <FieldLabel>
                    Customer
                    Name
                  </FieldLabel>

                  <input
                    value={
                      formData.customerName ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          customerName:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="Customer name"
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* CUSTOMER ADDRESS */}

                <Field className="md:col-span-2">
                  <FieldLabel>
                    Customer
                    Address
                  </FieldLabel>

                  <div className="relative">
                    <MapPin
                      size={
                        14
                      }
                      className="absolute left-4 top-4 text-stone-400"
                    />

                    <textarea
                      value={
                        formData.customerAddress ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          {
                            customerAddress:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="Street, town/city, postcode"
                      rows={3}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>
              </div>
            </section>

            {/* =================================================
                ASSIGNMENT
            ================================================= */}

            <section className="mb-8">
              <SectionHeading
                icon={
                  <Briefcase
                    size={
                      14
                    }
                  />
                }
                title="Assignment"
                description="Connect this document to the relevant work and people."
              />

              <div className="grid gap-4 md:grid-cols-3">
                {/* PROJECT */}

                <Field>
                  <FieldLabel>
                    Project
                  </FieldLabel>

                  <select
                    value={
                      formData.projectId
                    }
                    disabled={
                      !formData.customerId
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          projectId:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      No project
                    </option>

                    {availableProjects.map(
                      (
                        project
                      ) => (
                        <option
                          key={
                            project.id
                          }
                          value={
                            project.id
                          }
                        >
                          {
                            project.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                {/* CONTACT */}

                <Field>
                  <FieldLabel>
                    Customer
                    Contact
                  </FieldLabel>

                  <select
                    value={
                      formData.assignedContactId ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          assignedContactId:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      No contact
                    </option>

                    {availableContacts.map(
                      (
                        contact
                      ) => (
                        <option
                          key={
                            contact.id
                          }
                          value={
                            contact.id
                          }
                        >
                          {
                            contact.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                {/* STAFF */}

                <Field>
                  <FieldLabel>
                    Staff Member
                  </FieldLabel>

                  <select
                    value={
                      formData.assignedStaffId ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          assignedStaffId:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {staffMembers.map(
                      (
                        member
                      ) => (
                        <option
                          key={
                            member.id
                          }
                          value={
                            member.id
                          }
                        >
                          {
                            member.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>
              </div>

              {formData.projectId && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#a9b897]/10 p-3">
                  <Briefcase
                    size={
                      13
                    }
                    className="mt-0.5 shrink-0 text-[#829473]"
                  />

                  <p className="text-[10px] leading-4 text-stone-600">
                    This{" "}
                    {docType.toLowerCase()}{" "}
                    will be
                    connected to
                    the selected
                    project and can
                    appear inside
                    the project's{" "}
                    <strong>
                      Money
                    </strong>{" "}
                    workspace.
                  </p>
                </div>
              )}
            </section>

            {/* =================================================
                SEND TO
            ================================================= */}

            <section className="mb-8">
              <SectionHeading
                icon={
                  <Mail
                    size={
                      14
                    }
                  />
                }
                title="Send To"
                description="Choose a saved contact or enter an email address."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>
                    Contact
                  </FieldLabel>

                  <select
                    value={
                      formData.sendToContactId ??
                      ""
                    }
                    onChange={(
                      event
                    ) => {
                      const id =
                        event
                          .target
                          .value;

                      const contact =
                        contacts.find(
                          (
                            item
                          ) =>
                            item.id ===
                            id
                        );

                      updateForm(
                        {
                          sendToContactId:
                            id,

                          sendToEmail:
                            contact?.email ||
                            formData.sendToEmail ||
                            "",
                        }
                      );
                    }}
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Choose
                      contact...
                    </option>

                    {availableContacts.map(
                      (
                        contact
                      ) => (
                        <option
                          key={
                            contact.id
                          }
                          value={
                            contact.id
                          }
                        >
                          {
                            contact.name
                          }
                          {contact.email
                            ? ` — ${contact.email}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field>
                  <FieldLabel>
                    Email Address
                  </FieldLabel>

                  <div className="relative">
                    <Mail
                      size={
                        14
                      }
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />

                    <input
                      type="email"
                      value={
                        formData.sendToEmail ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          {
                            sendToEmail:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="client@example.com"
                      className={`${inputClass} pl-10`}
                    />
                  </div>

                  {formData.sendToEmail &&
                    !recipientEmailValid && (
                      <p className="mt-2 text-[10px] text-red-500">
                        Enter a
                        valid email
                        address.
                      </p>
                    )}
                </Field>
              </div>
            </section>

            {/* =================================================
                LINE ITEMS
            ================================================= */}

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <SectionHeading
                  compact
                  icon={
                    <CircleDollarSign
                      size={
                        14
                      }
                    />
                  }
                  title="Line Items"
                  description="Products, services or billable work."
                />

                <button
                  type="button"
                  onClick={
                    addLineItem
                  }
                  disabled={
                    submitting
                  }
                  className="flex shrink-0 items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#8fa07d] transition hover:text-stone-900 disabled:opacity-50"
                >
                  <Plus
                    size={
                      13
                    }
                  />

                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map(
                  (
                    item,
                    index
                  ) => {
                    const lineTotal =
                      Number(
                        item.qty ||
                          0
                      ) *
                      Number(
                        item.price ||
                          0
                      );

                    return (
                      <div
                        key={
                          item.id
                        }
                        className="rounded-2xl border border-stone-100 bg-[#faf9f6] p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">
                            Item{" "}
                            {index +
                              1}
                          </span>

                          {lineItems.length >
                            1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeLineItem(
                                  item.id
                                )
                              }
                              disabled={
                                submitting
                              }
                              className="text-red-400 transition hover:text-red-600"
                            >
                              <Trash2
                                size={
                                  14
                                }
                              />
                            </button>
                          )}
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[1fr_110px_150px_120px]">
                          {/* DESCRIPTION */}

                          <div>
                            <FieldLabel>
                              Description
                            </FieldLabel>

                            <input
                              value={
                                item.desc
                              }
                              onChange={(
                                event
                              ) =>
                                updateDescription(
                                  item.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Description"
                              className="w-full rounded-xl border border-stone-100 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-stone-900"
                            />
                          </div>

                          {/* QUANTITY */}

                          <div>
                            <FieldLabel>
                              Quantity
                            </FieldLabel>

                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                quantityDrafts[
                                  item.id
                                ] ??
                                String(
                                  item.qty
                                )
                              }
                              onChange={(
                                event
                              ) =>
                                updateQuantity(
                                  item.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              onBlur={() =>
                                normaliseQuantity(
                                  item.id
                                )
                              }
                              placeholder="1"
                              className="w-full rounded-xl border border-stone-100 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-stone-900"
                            />
                          </div>

                          {/* UNIT PRICE */}

                          <div>
                            <FieldLabel>
                              Unit
                              Price
                            </FieldLabel>

                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                                £
                              </span>

                              <input
                                type="text"
                                inputMode="decimal"
                                value={
                                  priceDrafts[
                                    item.id
                                  ] ??
                                  String(
                                    item.price
                                  )
                                }
                                onChange={(
                                  event
                                ) =>
                                  updatePrice(
                                    item.id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                onBlur={() =>
                                  normalisePrice(
                                    item.id
                                  )
                                }
                                placeholder="0.00"
                                className="w-full rounded-xl border border-stone-100 bg-white py-2.5 pl-7 pr-3 text-xs outline-none transition focus:border-stone-900"
                              />
                            </div>
                          </div>

                          {/* LINE TOTAL */}

                          <div>
                            <FieldLabel>
                              Total
                            </FieldLabel>

                            <div className="flex h-[38px] items-center rounded-xl bg-stone-900 px-3 font-mono text-xs text-white">
                              £
                              {currency(
                                lineTotal
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* =================================================
                VAT
            ================================================= */}

            <section className="mb-8">
              <SectionHeading
                icon={
                  <CircleDollarSign
                    size={
                      14
                    }
                  />
                }
                title="VAT"
                description="VAT can be enabled or disabled per document."
              />

              <div className="rounded-2xl border border-stone-100 bg-[#faf9f6] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-stone-800">
                      Add VAT
                    </p>

                    <p className="mt-1 text-[10px] text-stone-400">
                      Turn this
                      off for
                      non-VAT
                      invoices.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateForm(
                        {
                          vatEnabled:
                            !vatEnabled,
                        }
                      )
                    }
                    className={`relative h-7 w-12 rounded-full transition ${
                      vatEnabled
                        ? "bg-[#a9b897]"
                        : "bg-stone-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        vatEnabled
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {vatEnabled && (
                  <div className="mt-4 max-w-[180px]">
                    <FieldLabel>
                      VAT Rate
                    </FieldLabel>

                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={
                          formData.vatRate ??
                          "20"
                        }
                        onChange={(
                          event
                        ) => {
                          const value =
                            event
                              .target
                              .value;

                          if (
                            /^\d*\.?\d*$/.test(
                              value
                            )
                          ) {
                            updateForm(
                              {
                                vatRate:
                                  value,
                              }
                            );
                          }
                        }}
                        className={`${inputClass} pr-9`}
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                PAYMENT METHOD
            ================================================= */}

            {docType ===
              "Invoice" && (
              <section className="mb-8">
                <SectionHeading
                  icon={
                    <CreditCard
                      size={
                        14
                      }
                    />
                  }
                  title="Payment"
                  description="Tell the customer how they can pay."
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>
                      Payment
                      Method
                    </FieldLabel>

                    <select
                      value={
                        formData.paymentMethod ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          {
                            paymentMethod:
                              event
                                .target
                                .value as PaymentMethod,
                          }
                        )
                      }
                      className={
                        inputClass
                      }
                    >
                      <option value="">
                        Select
                        payment
                        method...
                      </option>

                      <option value="bank_transfer">
                        Bank
                        Transfer
                      </option>

                      <option value="card">
                        Card
                      </option>

                      <option value="cash">
                        Cash
                      </option>

                      <option value="direct_debit">
                        Direct
                        Debit
                      </option>

                      <option value="paypal">
                        PayPal
                      </option>

                      <option value="other">
                        Other
                      </option>
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel>
                      Payment
                      Instructions
                    </FieldLabel>

                    <textarea
                      rows={3}
                      value={
                        formData.paymentInstructions ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          {
                            paymentInstructions:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="Bank details, payment link, reference instructions..."
                      className={
                        inputClass
                      }
                    />
                  </Field>
                </div>
              </section>
            )}

            {/* =================================================
                RECURRING INVOICE
            ================================================= */}

            {docType ===
              "Invoice" && (
              <section className="mb-8">
                <SectionHeading
                  icon={
                    <RefreshCw
                      size={
                        14
                      }
                    />
                  }
                  title="Repeat Invoice"
                  description="Automatically create this invoice again on a schedule."
                />

                <div className="rounded-2xl border border-stone-100 bg-[#faf9f6] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-stone-800">
                        Repeat this
                        invoice
                      </p>

                      <p className="mt-1 text-[10px] text-stone-400">
                        Useful for
                        retainers,
                        subscriptions
                        and recurring
                        services.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          {
                            repeatInvoice:
                              !formData.repeatInvoice,
                          }
                        )
                      }
                      className={`relative h-7 w-12 rounded-full transition ${
                        formData.repeatInvoice
                          ? "bg-[#a9b897]"
                          : "bg-stone-200"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          formData.repeatInvoice
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {formData.repeatInvoice && (
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <Field>
                        <FieldLabel>
                          Frequency
                        </FieldLabel>

                        <select
                          value={
                            formData.repeatFrequency ??
                            "monthly"
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              {
                                repeatFrequency:
                                  event
                                    .target
                                    .value as RepeatFrequency,
                              }
                            )
                          }
                          className={
                            inputClass
                          }
                        >
                          <option value="weekly">
                            Weekly
                          </option>

                          <option value="fortnightly">
                            Fortnightly
                          </option>

                          <option value="monthly">
                            Monthly
                          </option>

                          <option value="quarterly">
                            Quarterly
                          </option>

                          <option value="yearly">
                            Yearly
                          </option>
                        </select>
                      </Field>

                      <Field>
                        <FieldLabel>
                          Start Date
                        </FieldLabel>

                        <input
                          type="date"
                          value={
                            formData.repeatStartDate ??
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              {
                                repeatStartDate:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className={
                            inputClass
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel>
                          End Date
                        </FieldLabel>

                        <input
                          type="date"
                          value={
                            formData.repeatEndDate ??
                            ""
                          }
                          min={
                            formData.repeatStartDate ??
                            undefined
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              {
                                repeatEndDate:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className={
                            inputClass
                          }
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* =================================================
                REMINDERS
            ================================================= */}

            {docType ===
              "Invoice" && (
              <section className="mb-8">
                <SectionHeading
                  icon={
                    <Bell
                      size={
                        14
                      }
                    />
                  }
                  title="Payment Reminders"
                  description="Set automatic reminders around the due date."
                />

                <div className="rounded-2xl border border-stone-100 bg-[#faf9f6] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-stone-800">
                        Enable
                        reminders
                      </p>

                      <p className="mt-1 text-[10px] text-stone-400">
                        Remind
                        customers
                        before and
                        after an
                        invoice is
                        due.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          {
                            remindersEnabled:
                              !formData.remindersEnabled,
                          }
                        )
                      }
                      className={`relative h-7 w-12 rounded-full transition ${
                        formData.remindersEnabled
                          ? "bg-[#a9b897]"
                          : "bg-stone-200"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          formData.remindersEnabled
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {formData.remindersEnabled && (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel>
                          Days Before
                          Due
                        </FieldLabel>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            formData.reminderDaysBefore ??
                            "3"
                          }
                          onChange={(
                            event
                          ) => {
                            const value =
                              event
                                .target
                                .value;

                            if (
                              /^\d*$/.test(
                                value
                              )
                            ) {
                              updateForm(
                                {
                                  reminderDaysBefore:
                                    value,
                                }
                              );
                            }
                          }}
                          className={
                            inputClass
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel>
                          Days After
                          Due
                        </FieldLabel>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            formData.reminderDaysAfter ??
                            "1"
                          }
                          onChange={(
                            event
                          ) => {
                            const value =
                              event
                                .target
                                .value;

                            if (
                              /^\d*$/.test(
                                value
                              )
                            ) {
                              updateForm(
                                {
                                  reminderDaysAfter:
                                    value,
                                }
                              );
                            }
                          }}
                          className={
                            inputClass
                          }
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* =================================================
                TERMS
            ================================================= */}

            <section className="mb-8">
              <SectionHeading
                icon={
                  <Check
                    size={
                      14
                    }
                  />
                }
                title="Terms & Notes"
                description="These can be shown on the invoice, quote or receipt."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>
                    Terms
                  </FieldLabel>

                  <textarea
                    rows={5}
                    value={
                      formData.terms ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          terms:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="Payment due within 14 days. Please use your invoice number as the payment reference."
                    className={
                      inputClass
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Internal /
                    Customer
                    Notes
                  </FieldLabel>

                  <textarea
                    rows={5}
                    value={
                      formData.notes ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        {
                          notes:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="Additional notes..."
                    className={
                      inputClass
                    }
                  />
                </Field>
              </div>
            </section>

            {/* =================================================
                TOTALS
            ================================================= */}

            <div className="rounded-[1.5rem] bg-stone-900 p-5 text-white sm:p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">
                    Net
                  </span>

                  <span className="font-mono">
                    £
                    {currency(
                      netTotal
                    )}
                  </span>
                </div>

                {vatEnabled && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">
                      VAT{" "}
                      {formData.vatRate
                        ? `(${formData.vatRate}%)`
                        : ""}
                    </span>

                    <span className="font-mono">
                      £
                      {currency(
                        displayedVat
                      )}
                    </span>
                  </div>
                )}

                {!vatEnabled && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">
                      VAT
                    </span>

                    <span className="font-mono text-stone-500">
                      Not
                      applied
                    </span>
                  </div>
                )}

                <div className="my-3 border-t border-white/10" />

                <div className="flex items-end justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                    Total
                  </span>

                  <span className="font-mono text-2xl text-[#a9b897] sm:text-3xl">
                    £
                    {currency(
                      displayedGrandTotal
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                RECIPIENT WARNING
            ================================================= */}

            {!hasRecipient && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] leading-4 text-amber-700">
                  No recipient
                  has been
                  selected yet.
                  You can still
                  create the{" "}
                  {docType.toLowerCase()},
                  but choose a
                  contact or email
                  before sending
                  it.
                </p>
              </div>
            )}

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  onSubmit
                }
                disabled={
                  !canSubmit
                }
                className="flex w-full items-center justify-center gap-3 rounded-full bg-[#a9b897] py-4 text-stone-900 transition hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2
                    size={
                      15
                    }
                    className="animate-spin"
                  />
                ) : (
                  <Check
                    size={
                      15
                    }
                  />
                )}

                <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                  {submitting
                    ? "Creating..."
                    : `Create ${docType}`}
                </span>
              </button>

              {onSend && (
                <button
                  type="button"
                  onClick={
                    onSend
                  }
                  disabled={
                    submitting ||
                    !hasRecipient ||
                    !recipientEmailValid
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-stone-900 py-4 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send
                    size={
                      15
                    }
                  />

                  <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                    Create &
                    Send
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

const inputClass =
  "w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-stone-900 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50";

function Field({
  children,
  className = "",
}: {
  children:
    React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        className
      }
    >
      {children}
    </div>
  );
}

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.22em] text-stone-400">
      {children}
    </label>
  );
}

function SectionHeading({
  icon,
  title,
  description,
  compact = false,
}: {
  icon:
    React.ReactNode;
  title: string;
  description:
    string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? ""
          : "mb-4"
      }
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#a9b897]/15 text-[#829473]">
          {icon}
        </span>

        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-700">
          {title}
        </p>
      </div>

      <p className="ml-9 mt-1 text-[10px] leading-4 text-stone-400">
        {description}
      </p>
    </div>
  );
}