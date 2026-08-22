"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  CircleUserRound,
  Database,
  Filter,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  createBrowserClient,
} from "@supabase/ssr";

import {
  useSettings,
} from "@/app/context/SettingsContext";

// ============================================================
// TYPES
// ============================================================

type CustomerStage =
  | "lead"
  | "client"
  | "partner"
  | "member";

type Customer = {
  id: string;

  organisation_id:
    | string
    | null;

  name:
    | string
    | null;

  email:
    | string
    | null;

  phone:
    | string
    | null;

  company:
    | string
    | null;

  notes:
    | string
    | null;

  tags:
    | string[]
    | null;

  stage:
    | string
    | null;

  address:
    | string
    | null;

  client_type:
    | string
    | null;

  status:
    | string
    | null;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;

  on_mailing_list:
    | boolean
    | null;

  mailing_list_category:
    | string
    | null;

  project_count:
    | number
    | null;

  invoice_count:
    | number
    | null;

  message_count:
    | number
    | null;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  company: string;
  notes: string;
  stage:
    CustomerStage;
  mailingList:
    boolean;
  mailingListCategory:
    string;
};

type StageFilter =
  | "all"
  | "client"
  | "lead"
  | "partner"
  | "member";

// ============================================================
// DEFAULT FORM
// ============================================================

const EMPTY_FORM:
  CustomerForm = {
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    company: "",
    notes: "",
    stage: "client",
    mailingList: false,
    mailingListCategory:
      "General",
  };

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function cleanEmail(
  value: unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

function safeArray(
  value: unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value.filter(
    (
      item
    ): item is string =>
      typeof item ===
      "string" &&
      Boolean(
        item.trim()
      )
  );
}

function getInitials(
  name:
    | string
    | null
) {
  const clean =
    cleanString(
      name
    );

  if (
    !clean
  ) {
    return "C";
  }

  const parts =
    clean
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length -
        1
    ][0]
  }`.toUpperCase();
}

function formatDate(
  value:
    | string
    | null
) {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    date
  );
}

function getStageLabel(
  value:
    | string
    | null
) {
  const stage =
    cleanString(
      value
    ).toLowerCase();

  if (
    stage ===
    "lead"
  ) {
    return "Lead";
  }

  if (
    stage ===
    "partner"
  ) {
    return "Partner";
  }

  if (
    stage ===
    "member"
  ) {
    return "Team";
  }

  return "Client";
}

function getCustomerSource(
  customer:
    Customer
) {
  const tags =
    safeArray(
      customer.tags
    ).map(
      (
        tag
      ) =>
        tag.toLowerCase()
    );

  if (
    tags.includes(
      "store customer"
    )
  ) {
    return "Store";
  }

  if (
    customer.client_type ===
    "store_customer"
  ) {
    return "Store";
  }

  return "CRM";
}

// ============================================================
// PAGE
// ============================================================

export default function CRMDirectory() {
  // ==========================================================
  // SUPABASE
  // ==========================================================

  const supabase =
    useMemo(
      () =>
        createBrowserClient(
          process.env
            .NEXT_PUBLIC_SUPABASE_URL!,
          process.env
            .NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
      []
    );

  const {
    organisationId,
  } =
    useSettings();

  // ==========================================================
  // CORE
  // ==========================================================

  const [
    resolvedOrganisationId,
    setResolvedOrganisationId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    customers,
    setCustomers,
  ] =
    useState<
      Customer[]
    >(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  // ==========================================================
  // SEARCH / FILTER
  // ==========================================================

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    stageFilter,
    setStageFilter,
  ] =
    useState<StageFilter>(
      "all"
    );

  // ==========================================================
  // MODAL
  // ==========================================================

  const [
    showModal,
    setShowModal,
  ] =
    useState(
      false
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    form,
    setForm,
  ] =
    useState<CustomerForm>({
      ...EMPTY_FORM,
    });

  const [
    attachmentFile,
    setAttachmentFile,
  ] =
    useState<
      File | null
    >(
      null
    );

  // ==========================================================
  // RESOLVE ORGANISATION
  // ==========================================================

  useEffect(
    () => {
      if (
        !organisationId
      ) {
        return;
      }

      setResolvedOrganisationId(
        organisationId
      );
    },
    [
      organisationId,
    ]
  );

  // ==========================================================
  // LOAD CUSTOMERS
  // ==========================================================

  const loadData =
    useCallback(
      async (
        quiet = false
      ) => {
        if (
          !resolvedOrganisationId
        ) {
          return;
        }

        if (
          quiet
        ) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        setError(
          null
        );

        try {
          const {
            data,
            error:
              customersError,
          } =
            await supabase
              .from(
                "customers"
              )
              .select(
                `
                  id,
                  organisation_id,
                  name,
                  email,
                  phone,
                  company,
                  notes,
                  tags,
                  stage,
                  address,
                  client_type,
                  status,
                  created_at,
                  updated_at,
                  on_mailing_list,
                  mailing_list_category,
                  project_count,
                  invoice_count,
                  message_count
                `
              )
              .eq(
                "organisation_id",
                resolvedOrganisationId
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            customersError
          ) {
            throw customersError;
          }

          setCustomers(
            (
              data ||
              []
            ) as Customer[]
          );
        } catch (
          loadError: unknown
        ) {
          console.error(
            "[TOTS CRM] Customer load failed:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "We couldn't load your customers."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        resolvedOrganisationId,
        supabase,
      ]
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      if (
        !resolvedOrganisationId
      ) {
        return;
      }

      void loadData();
    },
    [
      resolvedOrganisationId,
      loadData,
    ]
  );

  // ==========================================================
  // REALTIME
  // ==========================================================

  useEffect(
    () => {
      if (
        !resolvedOrganisationId
      ) {
        return;
      }

      const channel =
        supabase
          .channel(
            `crm-customers-${resolvedOrganisationId}`
          )
          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "customers",

              filter:
                `organisation_id=eq.${resolvedOrganisationId}`,
            },
            () => {
              void loadData(
                true
              );
            }
          )
          .subscribe();

      return () => {
        void supabase.removeChannel(
          channel
        );
      };
    },
    [
      resolvedOrganisationId,
      supabase,
      loadData,
    ]
  );

  // ==========================================================
  // METRICS
  // ==========================================================

  const totalCustomers =
    customers.length;

  const activeClients =
    useMemo(
      () =>
        customers.filter(
          (
            customer
          ) =>
            getStageLabel(
              customer.stage
            ) ===
              "Client" &&
            customer.status !==
              "archived"
        ).length,
      [
        customers,
      ]
    );

  const leads =
    useMemo(
      () =>
        customers.filter(
          (
            customer
          ) =>
            cleanString(
              customer.stage
            ).toLowerCase() ===
            "lead"
        ).length,
      [
        customers,
      ]
    );

  const storeCustomers =
    useMemo(
      () =>
        customers.filter(
          (
            customer
          ) =>
            getCustomerSource(
              customer
            ) ===
            "Store"
        ).length,
      [
        customers,
      ]
    );

  // ==========================================================
  // FILTER
  // ==========================================================

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return customers.filter(
          (
            customer
          ) => {
            const stage =
              cleanString(
                customer.stage
              ).toLowerCase();

            if (
              stageFilter !==
                "all" &&
              stage !==
                stageFilter
            ) {
              return false;
            }

            if (
              !query
            ) {
              return true;
            }

            return [
              customer.name,
              customer.company,
              customer.email,
              customer.phone,
              customer.address,
              customer.client_type,
              ...(customer.tags ||
                []),
            ]
              .filter(
                Boolean
              )
              .some(
                (
                  value
                ) =>
                  String(
                    value
                  )
                    .toLowerCase()
                    .includes(
                      query
                    )
              );
          }
        );
      },
      [
        customers,
        search,
        stageFilter,
      ]
    );

  // ==========================================================
  // OPEN MODAL
  // ==========================================================

  function openNewCustomer() {
    setForm({
      ...EMPTY_FORM,
    });

    setAttachmentFile(
      null
    );

    setError(
      null
    );

    setShowModal(
      true
    );
  }

  // ==========================================================
  // UPLOAD ATTACHMENT
  // ==========================================================

  async function uploadAttachment() {
    if (
      !attachmentFile ||
      !resolvedOrganisationId
    ) {
      return null;
    }

    const safeName =
      attachmentFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    const path =
      `${resolvedOrganisationId}/${Date.now()}-${safeName}`;

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(
          "crm-attachments"
        )
        .upload(
          path,
          attachmentFile,
          {
            upsert:
              false,
          }
        );

    if (
      uploadError
    ) {
      console.warn(
        "[TOTS CRM] Attachment upload failed:",
        uploadError
      );

      return null;
    }

    const {
      data:
        publicData,
    } =
      supabase.storage
        .from(
          "crm-attachments"
        )
        .getPublicUrl(
          path
        );

    return (
      publicData
        ?.publicUrl ||
      null
    );
  }

  // ==========================================================
  // ADD CUSTOMER
  // ==========================================================

  async function addCustomer(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    if (
      !resolvedOrganisationId
    ) {
      setError(
        "Organisation is not ready. Refresh the page and try again."
      );

      return;
    }

    const name =
      cleanString(
        form.name
      );

    const email =
      cleanEmail(
        form.email
      );

    if (
      !name
    ) {
      setError(
        "Enter the customer's name."
      );

      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setError(
        "Enter a valid email address."
      );

      return;
    }

    setSaving(
      true
    );

    setError(
      null
    );

    try {
      // ======================================================
      // CHECK EXISTING CUSTOMER
      // ======================================================

      if (
        email
      ) {
        const {
          data:
            existingRows,
          error:
            existingError,
        } =
          await supabase
            .from(
              "customers"
            )
            .select(
              "id"
            )
            .eq(
              "organisation_id",
              resolvedOrganisationId
            )
            .ilike(
              "email",
              email
            )
            .limit(
              1
            );

        if (
          existingError
        ) {
          throw existingError;
        }

        if (
          existingRows &&
          existingRows.length >
            0
        ) {
          throw new Error(
            "A customer with this email address already exists."
          );
        }
      }

      // ======================================================
      // ATTACHMENT
      // ======================================================

      const attachmentUrl =
        await uploadAttachment();

      // ======================================================
      // NOTES
      // ======================================================

      const noteParts:
        string[] =
        [];

      if (
        cleanString(
          form.notes
        )
      ) {
        noteParts.push(
          cleanString(
            form.notes
          )
        );
      }

      if (
        cleanString(
          form.website
        )
      ) {
        noteParts.push(
          `Website: ${cleanString(
            form.website
          )}`
        );
      }

      if (
        attachmentUrl
      ) {
        noteParts.push(
          `Attachment: ${attachmentUrl}`
        );
      }

      // ======================================================
      // TAGS
      // ======================================================

      const tags =
        form.stage ===
        "client"
          ? [
              "CRM",
              "Client",
            ]
          : form.stage ===
              "lead"
            ? [
                "CRM",
                "Lead",
              ]
            : form.stage ===
                "partner"
              ? [
                  "CRM",
                  "Partner",
                ]
              : [
                  "CRM",
                  "Team",
                ];

      // ======================================================
      // INSERT CUSTOMER
      // ======================================================

      const {
        data:
          newCustomer,
        error:
          customerError,
      } =
        await supabase
          .from(
            "customers"
          )
          .insert({
            organisation_id:
              resolvedOrganisationId,

            name,

            email:
              email ||
              null,

            phone:
              cleanString(
                form.phone
              ) ||
              null,

            company:
              cleanString(
                form.company
              ) ||
              null,

            notes:
              noteParts.length >
              0
                ? noteParts.join(
                    "\n\n"
                  )
                : null,

            tags,

            stage:
              form.stage,

            address:
              cleanString(
                form.address
              ) ||
              null,

            client_type:
              form.stage,

            status:
              "live",

            on_mailing_list:
              form.mailingList,

            mailing_list_category:
              form.mailingList
                ? cleanString(
                    form.mailingListCategory
                  ) ||
                  "General"
                : "General",

            updated_at:
              new Date()
                .toISOString(),
          })
          .select(
            `
              id,
              organisation_id,
              name,
              email,
              phone,
              company,
              notes,
              tags,
              stage,
              address,
              client_type,
              status,
              created_at,
              updated_at,
              on_mailing_list,
              mailing_list_category,
              project_count,
              invoice_count,
              message_count
            `
          )
          .single();

      if (
        customerError
      ) {
        throw customerError;
      }

      if (
        !newCustomer
      ) {
        throw new Error(
          "The customer was not created."
        );
      }

      setCustomers(
        (
          previous
        ) => [
          newCustomer as Customer,
          ...previous,
        ]
      );

      setForm({
        ...EMPTY_FORM,
      });

      setAttachmentFile(
        null
      );

      setShowModal(
        false
      );

      await loadData(
        true
      );
    } catch (
      saveError: unknown
    ) {
      console.error(
        "[TOTS CRM] Customer creation failed:",
        saveError
      );

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "The customer could not be created."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#f7f5f2] pb-32 text-stone-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="mx-auto max-w-[1320px] px-4 pb-6 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
              <Users
                size={13}
                className="text-[#829473]"
              />

              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
                CRM
              </span>
            </div>

            <h1 className="mt-5 max-w-3xl font-serif text-5xl italic leading-[0.95] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              Everyone your business works with.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-500">
              Leads, clients, store customers and partners all live here — giving you one customer record across TOTS-OS.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openNewCustomer
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-lg transition hover:bg-[#829473]"
          >
            <Plus
              size={15}
            />

            Add customer
          </button>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error &&
        !showModal && (
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{
              opacity:
                0,
              y:
                -10,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4"
          >
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <p className="text-xs leading-5 text-red-600">
              {
                error
              }
            </p>
          </motion.div>
        </section>
      )}

      {/* =====================================================
          METRICS
      ===================================================== */}

      <section className="mx-auto mt-6 max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <MetricCard
            icon={
              Users
            }
            label="Total contacts"
            value={
              totalCustomers
            }
          />

          <MetricCard
            icon={
              Check
            }
            label="Clients"
            value={
              activeClients
            }
          />

          <MetricCard
            icon={
              Sparkles
            }
            label="Leads"
            value={
              leads
            }
          />

          <MetricCard
            icon={
              ShoppingBag
            }
            label="Store customers"
            value={
              storeCustomers
            }
          />

        </div>
      </section>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section className="mx-auto mt-8 max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, business, email or phone..."
                className="w-full rounded-xl border border-stone-100 bg-stone-50 py-3.5 pl-11 pr-4 text-xs outline-none transition focus:border-[#a9b897] focus:bg-white"
              />
            </div>

            <div className="relative">
              <Filter
                size={13}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
              />

              <select
                value={
                  stageFilter
                }
                onChange={(
                  event
                ) =>
                  setStageFilter(
                    event.target.value as StageFilter
                  )
                }
                className="w-full appearance-none rounded-xl border border-stone-100 bg-stone-50 py-3.5 pl-10 pr-10 text-xs font-semibold text-stone-600 outline-none md:w-44"
              >
                <option value="all">
                  Everyone
                </option>

                <option value="client">
                  Clients
                </option>

                <option value="lead">
                  Leads
                </option>

                <option value="partner">
                  Partners
                </option>

                <option value="member">
                  Team
                </option>
              </select>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          CUSTOMERS
      ===================================================== */}

      <section className="mx-auto mt-5 max-w-[1320px] px-4 sm:px-6 lg:px-8">

        {loading ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[2rem] border border-stone-200 bg-white">
            <Loader2
              size={25}
              className="animate-spin text-[#829473]"
            />

            <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-stone-300">
              Loading CRM
            </p>
          </div>
        ) : filtered.length >
          0 ? (
          <div className="grid gap-3">

            {filtered.map(
              (
                customer
              ) => {
                const source =
                  getCustomerSource(
                    customer
                  );

                return (
                  <Link
                    href={`/crm/${customer.id}`}
                    key={
                      customer.id
                    }
                    className="group block rounded-[1.5rem] border border-stone-200 bg-white p-4 no-underline shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#a9b897] hover:shadow-lg sm:p-5"
                  >
                    <div className="flex items-center gap-4">

                      {/* AVATAR */}

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-sm font-black text-stone-500 transition group-hover:bg-[#a9b897] group-hover:text-white">
                        {getInitials(
                          customer.name
                        )}
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-stone-800 sm:text-base">
                            {customer.name ||
                              "Unnamed customer"}
                          </h3>

                          <span className="rounded-full bg-[#a9b897]/10 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.13em] text-[#829473]">
                            {getStageLabel(
                              customer.stage
                            )}
                          </span>

                          {source ===
                            "Store" && (
                            <span className="flex items-center gap-1 rounded-full bg-stone-900 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-white">
                              <ShoppingBag
                                size={8}
                              />

                              Store customer
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-stone-400">

                          {customer.company && (
                            <span className="flex items-center gap-1.5">
                              <Building2
                                size={10}
                              />

                              {
                                customer.company
                              }
                            </span>
                          )}

                          {customer.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail
                                size={10}
                              />

                              {
                                customer.email
                              }
                            </span>
                          )}

                          {customer.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone
                                size={10}
                              />

                              {
                                customer.phone
                              }
                            </span>
                          )}

                        </div>
                      </div>

                      {/* COUNTS */}

                      <div className="hidden shrink-0 items-center gap-6 lg:flex">

                        <SmallStat
                          label="Projects"
                          value={
                            customer.project_count ||
                            0
                          }
                        />

                        <SmallStat
                          label="Invoices"
                          value={
                            customer.invoice_count ||
                            0
                          }
                        />

                        <SmallStat
                          label="Messages"
                          value={
                            customer.message_count ||
                            0
                          }
                        />

                      </div>

                      {/* ARROW */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-300 transition group-hover:bg-stone-900 group-hover:text-white">
                        <ChevronRight
                          size={16}
                        />
                      </div>

                    </div>
                  </Link>
                );
              }
            )}

          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-stone-200 bg-white px-6 py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-50 text-stone-300">
              <Database
                size={24}
              />
            </div>

            <h2 className="mt-5 font-serif text-3xl italic text-stone-700">
              No customers found.
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-stone-400">
              Add your first customer, or change your search and filters.
            </p>

            <button
              type="button"
              onClick={
                openNewCustomer
              }
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white"
            >
              <Plus
                size={12}
              />

              Add customer
            </button>

          </div>
        )}

      </section>

      {/* =====================================================
          MODAL
      ===================================================== */}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6">

            <motion.button
              type="button"
              aria-label="Close modal"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              exit={{
                opacity:
                  0,
              }}
              onClick={() => {
                if (
                  !saving
                ) {
                  setShowModal(
                    false
                  );
                }
              }}
              className="absolute inset-0 bg-stone-900/55 backdrop-blur-md"
            />

            <motion.div
              initial={{
                opacity:
                  0,
                scale:
                  0.97,
                y:
                  16,
              }}
              animate={{
                opacity:
                  1,
                scale:
                  1,
                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
                scale:
                  0.97,
                y:
                  16,
              }}
              className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-100 bg-white shadow-2xl"
            >

              {/* MODAL HEADER */}

              <div className="sticky top-0 z-20 border-b border-stone-100 bg-white/95 px-6 py-5 backdrop-blur-xl sm:px-8">

                <div className="flex items-start justify-between gap-5">

                  <div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#a9b897]/15 text-[#829473]">
                      <CircleUserRound
                        size={19}
                      />
                    </div>

                    <h2 className="mt-4 font-serif text-4xl italic leading-none text-stone-900">
                      Add a customer.
                    </h2>

                    <p className="mt-2 text-xs leading-5 text-stone-400">
                      This creates the main customer record used across TOTS-OS.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      setShowModal(
                        false
                      )
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 disabled:opacity-40"
                  >
                    <X
                      size={15}
                    />
                  </button>

                </div>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  addCustomer
                }
                className="space-y-7 p-6 sm:p-8"
              >

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <AlertCircle
                      size={15}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <p className="text-xs leading-5 text-red-600">
                      {
                        error
                      }
                    </p>
                  </div>
                )}

                {/* CONTACT */}

                <FormSection
                  title="Contact details"
                  description="The main details you use to recognise and contact them."
                >

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field
                      label="Full name"
                      icon={
                        User
                      }
                    >
                      <input
                        required
                        value={
                          form.name
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              name:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Jane Smith"
                        className="crm-field"
                      />
                    </Field>

                    <Field
                      label="Email"
                      icon={
                        Mail
                      }
                    >
                      <input
                        type="email"
                        value={
                          form.email
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              email:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="jane@example.com"
                        className="crm-field"
                      />
                    </Field>

                    <Field
                      label="Phone"
                      icon={
                        Phone
                      }
                    >
                      <input
                        value={
                          form.phone
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              phone:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="07700 000000"
                        className="crm-field"
                      />
                    </Field>

                    <Field
                      label="Relationship"
                      icon={
                        Tag
                      }
                    >
                      <select
                        value={
                          form.stage
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              stage:
                                event.target.value as CustomerStage,
                            })
                          )
                        }
                        className="crm-field appearance-none"
                      >
                        <option value="client">
                          Client
                        </option>

                        <option value="lead">
                          Lead
                        </option>

                        <option value="partner">
                          Partner
                        </option>

                        <option value="member">
                          Team member
                        </option>
                      </select>
                    </Field>

                  </div>

                </FormSection>

                {/* BUSINESS */}

                <FormSection
                  title="Business details"
                  description="Optional company information connected to this customer."
                >

                  <Field
                    label="Company"
                    icon={
                      Building2
                    }
                  >
                    <input
                      value={
                        form.company
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            company:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Company name"
                      className="crm-field"
                    />
                  </Field>

                  <Field
                    label="Address"
                    icon={
                      MapPin
                    }
                  >
                    <input
                      value={
                        form.address
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            address:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Business or customer address"
                      className="crm-field"
                    />
                  </Field>

                  <Field
                    label="Website"
                    icon={
                      Hash
                    }
                  >
                    <input
                      value={
                        form.website
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            website:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="https://example.com"
                      className="crm-field"
                    />
                  </Field>

                </FormSection>

                {/* NOTES */}

                <FormSection
                  title="Notes & files"
                  description="Useful background information for you and your team."
                >

                  <textarea
                    value={
                      form.notes
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          notes:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Anything useful to know about this customer..."
                    rows={5}
                    className="crm-field resize-none"
                  />

                  <div>
                    <p className="mb-2 text-[8px] font-black uppercase tracking-[0.16em] text-stone-400">
                      Attachment
                    </p>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-4 transition hover:bg-stone-100">

                      <div className="flex min-w-0 items-center gap-3">
                        <Paperclip
                          size={14}
                          className="shrink-0 text-stone-400"
                        />

                        <span className="truncate text-xs text-stone-500">
                          {attachmentFile
                            ? attachmentFile.name
                            : "Choose a file"}
                        </span>
                      </div>

                      <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.12em] text-stone-400">
                        Browse
                      </span>

                      <input
                        type="file"
                        className="hidden"
                        onChange={(
                          event
                        ) =>
                          setAttachmentFile(
                            event.target
                              .files?.[0] ||
                              null
                          )
                        }
                      />

                    </label>
                  </div>

                </FormSection>

                {/* MARKETING */}

                <FormSection
                  title="Marketing"
                  description="Only enable this where you have the appropriate permission to email them."
                >

                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-100 bg-stone-50 p-4">

                    <div>
                      <p className="text-xs font-semibold text-stone-700">
                        Add to mailing list
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-stone-400">
                        Mark this customer as opted-in for marketing.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        form.mailingList
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            mailingList:
                              event.target.checked,
                          })
                        )
                      }
                      className="h-4 w-4 accent-[#829473]"
                    />

                  </label>

                  {form.mailingList && (
                    <input
                      value={
                        form.mailingListCategory
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            mailingListCategory:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="General"
                      className="crm-field"
                    />
                  )}

                </FormSection>

                {/* SAVE */}

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-[#829473] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />

                      Creating customer...
                    </>
                  ) : (
                    <>
                      Add customer

                      <ArrowRight
                        size={13}
                      />
                    </>
                  )}
                </button>

              </form>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      <CRMGlobalStyles />
    </main>
  );
}

// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  icon:
    Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
            {
              label
            }
          </p>

          <p className="mt-3 font-serif text-4xl italic leading-none text-stone-900">
            {
              value
            }
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a9b897]/15 text-[#829473]">
          <Icon
            size={15}
          />
        </div>

      </div>

    </div>
  );
}

// ============================================================
// SMALL STAT
// ============================================================

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-stone-700">
        {
          value
        }
      </p>

      <p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-stone-300">
        {
          label
        }
      </p>
    </div>
  );
}

// ============================================================
// FORM SECTION
// ============================================================

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description:
    string;
  children:
    React.ReactNode;
}) {
  return (
    <section>

      <div className="mb-4">
        <p className="text-[8px] font-black uppercase tracking-[0.17em] text-[#829473]">
          {
            title
          }
        </p>

        <p className="mt-1 text-[10px] leading-5 text-stone-400">
          {
            description
          }
        </p>
      </div>

      <div className="space-y-4">
        {
          children
        }
      </div>

    </section>
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  icon:
    Icon,
  children,
}: {
  label: string;
  icon: any;
  children:
    React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
        {
          label
        }
      </label>

      <div className="relative">

        <Icon
          size={13}
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-stone-300"
        />

        <div className="[&_.crm-field]:pl-10">
          {
            children
          }
        </div>

      </div>

    </div>
  );
}

// ============================================================
// GLOBAL STYLES
// ============================================================

function CRMGlobalStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap");

      .font-serif {
        font-family:
          "Instrument Serif",
          Georgia,
          serif;
      }

      .crm-field {
        width: 100%;
        border: 1px solid #e7e5e4;
        background: #fafaf9;
        border-radius: 0.8rem;
        padding: 0.9rem 1rem;
        font-size: 0.75rem;
        color: #44403c;
        outline: none;
        transition:
          border-color 0.2s ease,
          background 0.2s ease,
          box-shadow 0.2s ease;
      }

      .crm-field::placeholder {
        color: #c4bfb9;
      }

      .crm-field:focus {
        background: #ffffff;
        border-color: #a9b897;
        box-shadow:
          0 0 0 3px
          rgba(
            169,
            184,
            151,
            0.12
          );
      }
    `}</style>
  );
}