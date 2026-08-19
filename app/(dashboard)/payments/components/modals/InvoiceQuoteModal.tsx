"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Loader2,
  Plus,
  Send,
  Trash2,
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
};

export type FinanceProject = {
  id: string;
  name: string;
  customer_id?: string | null;
  status?: string | null;
};

export type InvoiceQuoteFormData = {
  customerId: string;
  projectId: string;
  newClientName: string;
  dueDate: string;
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
};

// ============================================================
// COMPONENT
// ============================================================

export default function InvoiceQuoteModal({
  open,
  submitting = false,
  docType,
  customers,
  projects,
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
}: InvoiceQuoteModalProps) {
  // ==========================================================
  // LINE ITEM HELPERS
  // ==========================================================

  const updateDescription = (
    id: number,
    value: string
  ) => {
    onLineItemsChange(
      lineItems.map((item) =>
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
    value: number
  ) => {
    onLineItemsChange(
      lineItems.map((item) =>
        item.id === id
          ? {
              ...item,
              qty: value,
            }
          : item
      )
    );
  };

  const updatePrice = (
    id: number,
    value: number
  ) => {
    onLineItemsChange(
      lineItems.map((item) =>
        item.id === id
          ? {
              ...item,
              price: value,
            }
          : item
      )
    );
  };

  const addLineItem = () => {
    onLineItemsChange([
      ...lineItems,
      {
        id: Date.now(),
        desc: "",
        qty: 1,
        price: 0,
      },
    ]);
  };

  const removeLineItem = (
    id: number
  ) => {
    if (lineItems.length <= 1) {
      return;
    }

    onLineItemsChange(
      lineItems.filter(
        (item) => item.id !== id
      )
    );
  };

  // ==========================================================
  // FORMAT
  // ==========================================================

  const currency = (
    value: number
  ) =>
    Number(value || 0).toLocaleString(
      "en-GB",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  // ==========================================================
  // PROJECT FILTER
  // ==========================================================

  const availableProjects =
    formData.customerId
      ? projects.filter(
          (project) =>
            project.customer_id ===
            formData.customerId
        )
      : [];

  // ==========================================================
  // SUBMISSION
  // ==========================================================

  const canSubmit =
    !submitting &&
    lineItems.length > 0 &&
    lineItems.every(
      (item) =>
        item.desc.trim().length >
          0 &&
        item.qty > 0 &&
        item.price >= 0
    ) &&
    (formData.customerId
      .trim()
      .length > 0 ||
      (docType === "Quote" &&
        formData.newClientName
          .trim()
          .length > 0)) &&
    (docType !== "Invoice" ||
      formData.dueDate.length >
        0);

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
          onClick={onClose}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{
              scale: 0.97,
              opacity: 0,
              y: 12,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.97,
              opacity: 0,
              y: 12,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[8px] font-black uppercase tracking-[0.35em] text-[#a9b897]">
                  Sales
                </p>

                <h2 className="font-serif text-3xl italic tracking-tight text-stone-900">
                  New Invoice / Quote
                </h2>

                <p className="mt-2 text-xs leading-5 text-stone-400">
                  Create a financial
                  document and connect it
                  to the client and
                  project it belongs to.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close invoice or quote modal"
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* =================================================
                DOCUMENT TYPE
            ================================================= */}

            <div className="mb-6 flex w-fit gap-1 rounded-full bg-[#faf9f6] p-1">
              {(
                [
                  "Invoice",
                  "Quote",
                ] as InvoiceQuoteDocType[]
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    onDocTypeChange(type)
                  }
                  disabled={submitting}
                  className={`rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-widest transition ${
                    docType === type
                      ? "bg-stone-900 text-white"
                      : "text-stone-400 hover:text-stone-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* =================================================
                CLIENT / PROJECT
            ================================================= */}

            <div className="space-y-5">
              {/* CLIENT */}

              <div>
                <label
                  htmlFor="invoice-customer"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Client
                </label>

                <select
                  id="invoice-customer"
                  value={
                    formData.customerId
                  }
                  onChange={(event) =>
                    onFormChange({
                      ...formData,

                      customerId:
                        event.target
                          .value,

                      // Reset project if
                      // client changes
                      projectId: "",
                    })
                  }
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                >
                  <option value="">
                    Select existing
                    client...
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {customer.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* NEW CLIENT FOR QUOTE */}

              {docType ===
                "Quote" &&
                !formData.customerId && (
                  <div>
                    <label
                      htmlFor="new-client-name"
                      className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                    >
                      New Client Name
                    </label>

                    <input
                      id="new-client-name"
                      value={
                        formData.newClientName
                      }
                      onChange={(
                        event
                      ) =>
                        onFormChange({
                          ...formData,

                          newClientName:
                            event.target
                              .value,

                          projectId:
                            "",
                        })
                      }
                      placeholder="Enter client name"
                      className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                    />
                  </div>
                )}

              {/* PROJECT */}

              {formData.customerId && (
                <div>
                  <label
                    htmlFor="invoice-project"
                    className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                  >
                    Project
                  </label>

                  <div className="relative">
                    <Briefcase
                      size={14}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />

                    <select
                      id="invoice-project"
                      value={
                        formData.projectId
                      }
                      onChange={(
                        event
                      ) =>
                        onFormChange({
                          ...formData,

                          projectId:
                            event.target
                              .value,
                        })
                      }
                      className="w-full appearance-none rounded-xl border border-stone-100 bg-[#faf9f6] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                    >
                      <option value="">
                        No project /
                        general client
                        finance
                      </option>

                      {availableProjects.map(
                        (project) => (
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
                  </div>

                  {availableProjects.length ===
                    0 && (
                    <p className="mt-2 text-[10px] leading-4 text-stone-400">
                      This client has no
                      linked projects yet.
                      You can still create
                      the {docType.toLowerCase()}{" "}
                      without attaching it
                      to a project.
                    </p>
                  )}

                  {formData.projectId && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#a9b897]/10 p-3">
                      <Briefcase
                        size={13}
                        className="mt-0.5 shrink-0 text-[#829473]"
                      />

                      <p className="text-[10px] leading-4 text-stone-600">
                        This{" "}
                        {docType.toLowerCase()}{" "}
                        will appear inside
                        the selected
                        project's{" "}
                        <strong>
                          Money
                        </strong>{" "}
                        workspace.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* DUE DATE */}

              {docType ===
                "Invoice" && (
                <div>
                  <label
                    htmlFor="invoice-due-date"
                    className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                  >
                    Due Date
                  </label>

                  <input
                    id="invoice-due-date"
                    type="date"
                    value={
                      formData.dueDate
                    }
                    onChange={(
                      event
                    ) =>
                      onFormChange({
                        ...formData,

                        dueDate:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                  />
                </div>
              )}
            </div>

            <div className="my-7 border-t border-stone-100" />

            {/* =================================================
                LINE ITEMS
            ================================================= */}

            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                    Line Items
                  </p>

                  <p className="mt-1 text-xs text-stone-400">
                    Add services,
                    products or billable
                    work.
                  </p>
                </div>

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
                  <Plus size={13} />

                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map(
                  (
                    item,
                    index
                  ) => (
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
                            aria-label={`Remove item ${
                              index +
                              1
                            }`}
                            className="text-red-400 transition hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2
                              size={
                                14
                              }
                            />
                          </button>
                        )}
                      </div>

                      <input
                        value={
                          item.desc
                        }
                        onChange={(
                          event
                        ) =>
                          updateDescription(
                            item.id,
                            event.target
                              .value
                          )
                        }
                        disabled={
                          submitting
                        }
                        placeholder="Description"
                        className="mb-3 w-full rounded-xl border border-stone-100 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-stone-900 disabled:opacity-60"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[7px] font-black uppercase tracking-widest text-stone-400">
                            Quantity
                          </label>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              item.qty
                            }
                            disabled={
                              submitting
                            }
                            onChange={(
                              event
                            ) =>
                              updateQuantity(
                                item.id,

                                Math.max(
                                  1,

                                  Number(
                                    event
                                      .target
                                      .value
                                  ) ||
                                    1
                                )
                              )
                            }
                            className="w-full rounded-xl border border-stone-100 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-stone-900 disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[7px] font-black uppercase tracking-widest text-stone-400">
                            Unit Price
                          </label>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                              £
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.price
                              }
                              disabled={
                                submitting
                              }
                              onChange={(
                                event
                              ) =>
                                updatePrice(
                                  item.id,

                                  Math.max(
                                    0,

                                    Number(
                                      event
                                        .target
                                        .value
                                    ) ||
                                      0
                                  )
                                )
                              }
                              className="w-full rounded-xl border border-stone-100 bg-white py-2.5 pl-7 pr-3 text-xs outline-none transition focus:border-stone-900 disabled:opacity-60"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* =================================================
                TOTALS
            ================================================= */}

            <div className="mt-7 rounded-2xl bg-stone-900 p-5 text-white">
              <div className="space-y-2">
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

                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">
                    VAT
                  </span>

                  <span className="font-mono">
                    £
                    {currency(
                      vatTotal
                    )}
                  </span>
                </div>

                <div className="my-3 border-t border-white/10" />

                <div className="flex items-end justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                    Total
                  </span>

                  <span className="font-mono text-2xl text-[#a9b897]">
                    £
                    {currency(
                      grandTotal
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#a9b897] py-4 text-stone-900 transition hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={15}
                />
              )}

              <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                {submitting
                  ? "Creating..."
                  : `Create ${docType}`}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}