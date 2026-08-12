"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";

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

export type InvoiceQuoteFormData = {
  customerId: string;
  newClientName: string;
  dueDate: string;
};

type InvoiceQuoteModalProps = {
  open: boolean;
  submitting?: boolean;
  docType: InvoiceQuoteDocType;
  customers: FinanceCustomer[];
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

export default function InvoiceQuoteModal({
  open,
  submitting = false,
  docType,
  customers,
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

  const canSubmit =
    !submitting &&
    lineItems.length > 0 &&
    lineItems.every(
      (item) =>
        item.desc.trim().length > 0 &&
        item.qty > 0 &&
        item.price >= 0
    ) &&
    (formData.customerId.trim().length >
      0 ||
      (docType === "Quote" &&
        formData.newClientName.trim()
          .length > 0));

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
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[8px] font-black uppercase tracking-[0.35em] text-[#a9b897]">
                  Sales
                </p>

                <h2 className="font-serif text-3xl italic tracking-tight">
                  New Invoice / Quote
                </h2>

                <p className="mt-2 text-xs text-stone-400">
                  Build and dispatch a new
                  customer document.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close invoice or quote modal"
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

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

            <div className="space-y-5">
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
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                >
                  <option value="">
                    Select existing
                    customer...
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {docType === "Quote" &&
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
                      onChange={(event) =>
                        onFormChange({
                          ...formData,
                          newClientName:
                            event.target.value,
                        })
                      }
                      placeholder="Enter client name"
                      className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                    />
                  </div>
                )}

              {docType === "Invoice" && (
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
                    onChange={(event) =>
                      onFormChange({
                        ...formData,
                        dueDate:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                  />
                </div>
              )}
            </div>

            <div className="my-7 border-t border-stone-100" />

            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                    Line Items
                  </p>

                  <p className="mt-1 text-xs text-stone-400">
                    Add services, products
                    or billable work.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex shrink-0 items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#8fa07d] transition hover:text-stone-900"
                >
                  <Plus size={13} />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map(
                  (item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-stone-100 bg-[#faf9f6] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">
                          Item{" "}
                          {index + 1}
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
                            aria-label={`Remove item ${
                              index + 1
                            }`}
                            className="text-red-400 transition hover:text-red-600"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        )}
                      </div>

                      <input
                        value={item.desc}
                        onChange={(event) =>
                          updateDescription(
                            item.id,
                            event.target.value
                          )
                        }
                        placeholder="Description"
                        className="mb-3 w-full rounded-xl border border-stone-100 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-stone-900"
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
                            onChange={(
                              event
                            ) =>
                              updateQuantity(
                                item.id,
                                Math.max(
                                  1,
                                  Number(
                                    event.target
                                      .value
                                  ) || 1
                                )
                              )
                            }
                            className="w-full rounded-xl border border-stone-100 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-stone-900"
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
                                    ) || 0
                                  )
                                )
                              }
                              className="w-full rounded-xl border border-stone-100 bg-white py-2.5 pl-7 pr-3 text-xs outline-none transition focus:border-stone-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-stone-900 p-5 text-white">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">
                    Net
                  </span>

                  <span className="font-mono">
                    £{currency(netTotal)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">
                    VAT
                  </span>

                  <span className="font-mono">
                    £{currency(vatTotal)}
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
                <Send size={15} />
              )}

              <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                Dispatch {docType}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}