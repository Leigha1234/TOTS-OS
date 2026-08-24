"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "../../../lib/supabase";

import {
  AlertTriangle,
  AlignLeft,
  ArrowUpRight,
  Banknote,
  Briefcase,
  Calendar,
  Check,
  ChevronRight,
  CircleDollarSign,
  ContactRound,
  Database,
  Folder,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import Link from "next/link";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  toast,
} from "sonner";

// =========================================================
// TYPES
// =========================================================

type Project = {
  id: string;
  user_id: string;
  organisation_id: string;
  name: string;
  description?: string | null;
  objective_summary?: string | null;
  category?: string | null;
  status?: string | null;
  priority?: string | null;
  health?: string | null;
  budget?: number | string | null;
  start_date?: string | null;
  due_date?: string | null;
  members?: string[] | null;
  customer_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

type Customer = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  organisation_id?: string | null;
  status?: string | null;
};

type Contact = {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  organisation_id?: string | null;
  customer_id?: string | null;
  status?: string | null;
};

type ClientOption = {
  key: string;

  source:
    | "customer"
    | "contact";

  customer_id?: string | null;

  contact_id?: string | null;

  name: string;

  email?: string | null;

  phone?: string | null;

  company?: string | null;
};

type ProjectWithCustomer =
  Project & {
    customer?: Customer | null;
  };

type ProjectForm = {
  name: string;
  client_key: string;
  objective_summary: string;
  description: string;
  category: string;
  start_date: string;
  due_date: string;
  budget: string;
};

// =========================================================
// HELPERS
// =========================================================

function isProjectComplete(
  status?: string | null
) {
  return [
    "completed",
    "complete",
    "done",
  ].includes(
    String(
      status || ""
    )
      .trim()
      .toLowerCase()
  );
}

function isProjectArchived(
  status?: string | null
) {
  return (
    String(
      status || ""
    )
      .trim()
      .toLowerCase() ===
    "archived"
  );
}

function getContactDisplayName(
  contact:
    | Contact
    | null
    | undefined
) {
  if (!contact) {
    return "Unnamed contact";
  }

  const fullName =
    [
      contact.first_name,
      contact.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  return (
    contact.company?.trim() ||
    contact.name?.trim() ||
    fullName ||
    contact.email?.trim() ||
    "Unnamed contact"
  );
}

function getCustomerDisplayName(
  customer:
    | Customer
    | null
    | undefined
) {
  if (!customer) {
    return "Internal project";
  }

  return (
    customer.company?.trim() ||
    customer.name?.trim() ||
    customer.email?.trim() ||
    "Unnamed client"
  );
}

// =========================================================
// PAGE
// =========================================================

export default function ProjectDirectory() {
  // =======================================================
  // PROJECTS
  // =======================================================

  const [
    projects,
    setProjects,
  ] =
    useState<
      ProjectWithCustomer[]
    >([]);

  // =======================================================
  // CUSTOMERS
  // =======================================================

  const [
    customers,
    setCustomers,
  ] =
    useState<
      Customer[]
    >([]);

  // =======================================================
  // CRM CONTACTS
  // =======================================================

  const [
    contacts,
    setContacts,
  ] =
    useState<
      Contact[]
    >([]);

  // =======================================================
  // PAGE STATE
  // =======================================================

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

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
    organisationId,
    setOrganisationId,
  ] =
    useState<
      string | null
    >(null);

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState<
      string | null
    >(null);

  // =======================================================
  // FORM
  // =======================================================

  const [
    form,
    setForm,
  ] =
    useState<ProjectForm>({
      name:
        "",

      client_key:
        "",

      objective_summary:
        "",

      description:
        "",

      category:
        "Client Work",

      start_date:
        "",

      due_date:
        "",

      budget:
        "",
    });

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm =
    useCallback(
      () => {
        setForm({
          name:
            "",

          client_key:
            "",

          objective_summary:
            "",

          description:
            "",

          category:
            "Client Work",

          start_date:
            "",

          due_date:
            "",

          budget:
            "",
        });
      },
      []
    );

  // =========================================================
  // LOCK BACKGROUND WHILE MODAL OPEN
  // =========================================================

  useEffect(
    () => {
      if (
        !showModal ||
        typeof document ===
          "undefined"
      ) {
        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      const previousOverscroll =
        document.body.style
          .overscrollBehavior;

      document.body.style.overflow =
        "hidden";

      document.body.style.overscrollBehavior =
        "none";

      return () => {
        document.body.style.overflow =
          previousOverflow;

        document.body.style.overscrollBehavior =
          previousOverscroll;
      };
    },
    [
      showModal,
    ]
  );

  // =========================================================
  // ESC CLOSE
  // =========================================================

  useEffect(
    () => {
      if (!showModal) {
        return;
      }

      const handleKeyDown =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
              "Escape" &&
            !saving
          ) {
            setShowModal(
              false
            );
          }
        };

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      showModal,
      saving,
    ]
  );

  // =========================================================
  // LOAD ORGANISATION
  // =========================================================

  useEffect(
    () => {
      const loadOrganisation =
        async () => {
          try {
            const {
              data: {
                user,
              },

              error:
                authError,
            } =
              await supabase.auth.getUser();

            if (
              authError ||
              !user?.id
            ) {
              console.error(
                "Project directory auth error:",
                authError
              );

              toast.error(
                "Please log in again"
              );

              setLoading(
                false
              );

              return;
            }

            setCurrentUserId(
              user.id
            );

            const {
              data:
                profile,

              error:
                profileError,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(
                  "organisation_id"
                )
                .eq(
                  "id",
                  user.id
                )
                .maybeSingle();

            if (
              profileError
            ) {
              console.error(
                "Organisation profile load error:",
                profileError
              );

              toast.error(
                "Unable to load your organisation"
              );

              setLoading(
                false
              );

              return;
            }

            if (
              !profile
                ?.organisation_id
            ) {
              toast.error(
                "No organisation is linked to this account"
              );

              setLoading(
                false
              );

              return;
            }

            setOrganisationId(
              profile.organisation_id
            );
          } catch (
            error
          ) {
            console.error(
              "Unexpected organisation load error:",
              error
            );

            toast.error(
              "Unable to load workspace"
            );

            setLoading(
              false
            );
          }
        };

      void loadOrganisation();
    },
    []
  );

  // =========================================================
  // LOAD WORKSPACE DATA
  // =========================================================

  const loadWorkspace =
    useCallback(
      async () => {
        if (
          !organisationId
        ) {
          return;
        }

        setLoading(
          true
        );

        try {
          const [
            projectsResult,
            customersResult,
            contactsResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "projects"
                )
                .select(
                  "*"
                )
                .eq(
                  "organisation_id",
                  organisationId
                )
                .is(
                  "deleted_at",
                  null
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                ),

              supabase
                .from(
                  "customers"
                )
                .select(
                  `
                    id,
                    name,
                    email,
                    phone,
                    company,
                    organisation_id,
                    status
                  `
                )
                .eq(
                  "organisation_id",
                  organisationId
                )
                .order(
                  "name",
                  {
                    ascending:
                      true,
                  }
                ),

              supabase
                .from(
                  "contacts"
                )
                .select(
                  `
                    id,
                    name,
                    first_name,
                    last_name,
                    email,
                    phone,
                    company,
                    organisation_id,
                    customer_id,
                    status
                  `
                )
                .eq(
                  "organisation_id",
                  organisationId
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                ),
            ]);

          if (
            projectsResult.error
          ) {
            console.error(
              "Load projects error:",
              projectsResult.error
            );

            throw projectsResult.error;
          }

          if (
            customersResult.error
          ) {
            console.warn(
              "Load customers error:",
              customersResult.error
            );
          }

          if (
            contactsResult.error
          ) {
            console.warn(
              "Load contacts error:",
              contactsResult.error
            );
          }

          const projectRows =
            (
              projectsResult.data as
                Project[]
            ) ||
            [];

          const customerRows =
            (
              customersResult.data as
                Customer[]
            ) ||
            [];

          const contactRows =
            (
              contactsResult.data as
                Contact[]
            ) ||
            [];

          setCustomers(
            customerRows
          );

          setContacts(
            contactRows
          );

          const customerMap =
            new Map<
              string,
              Customer
            >(
              customerRows.map(
                (
                  customer
                ) => [
                  customer.id,
                  customer,
                ]
              )
            );

          const enrichedProjects:
            ProjectWithCustomer[] =
            projectRows.map(
              (
                project
              ) => ({
                ...project,

                customer:
                  project.customer_id
                    ? customerMap.get(
                        project.customer_id
                      ) ||
                      null
                    : null,
              })
            );

          setProjects(
            enrichedProjects
          );
        } catch (
          error
        ) {
          console.error(
            "Project workspace load error:",
            error
          );

          toast.error(
            "Failed to load clients and projects"
          );

          setProjects(
            []
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        organisationId,
      ]
    );

  // =========================================================
  // LOAD WORKSPACE
  // =========================================================

  useEffect(
    () => {
      if (
        !organisationId
      ) {
        return;
      }

      void loadWorkspace();
    },
    [
      organisationId,
      loadWorkspace,
    ]
  );

  // =========================================================
  // COMBINED CLIENT OPTIONS
  // =========================================================

  const clientOptions =
    useMemo<
      ClientOption[]
    >(
      () => {
        const options =
          new Map<
            string,
            ClientOption
          >();

        customers.forEach(
          (
            customer
          ) => {
            options.set(
              `customer-${customer.id}`,
              {
                key:
                  `customer-${customer.id}`,

                source:
                  "customer",

                customer_id:
                  customer.id,

                contact_id:
                  null,

                name:
                  getCustomerDisplayName(
                    customer
                  ),

                email:
                  customer.email ||
                  null,

                phone:
                  customer.phone ||
                  null,

                company:
                  customer.company ||
                  null,
              }
            );
          }
        );

        contacts.forEach(
          (
            contact
          ) => {
            if (
              contact.customer_id &&
              customers.some(
                (
                  customer
                ) =>
                  customer.id ===
                  contact.customer_id
              )
            ) {
              return;
            }

            options.set(
              `contact-${contact.id}`,
              {
                key:
                  `contact-${contact.id}`,

                source:
                  "contact",

                customer_id:
                  contact.customer_id ||
                  null,

                contact_id:
                  contact.id,

                name:
                  getContactDisplayName(
                    contact
                  ),

                email:
                  contact.email ||
                  null,

                phone:
                  contact.phone ||
                  null,

                company:
                  contact.company ||
                  null,
              }
            );
          }
        );

        return Array.from(
          options.values()
        ).sort(
          (
            first,
            second
          ) =>
            first.name.localeCompare(
              second.name
            )
        );
      },
      [
        customers,
        contacts,
      ]
    );

  // =========================================================
  // CREATE CUSTOMER FROM CONTACT
  // =========================================================

  const resolveSelectedCustomer =
    async () => {
      if (
        !form.client_key
      ) {
        return null;
      }

      if (
        !organisationId
      ) {
        throw new Error(
          "Missing organisation context"
        );
      }

      const selectedClient =
        clientOptions.find(
          (
            client
          ) =>
            client.key ===
            form.client_key
        );

      if (
        !selectedClient
      ) {
        throw new Error(
          "The selected client could not be found."
        );
      }

      if (
        selectedClient.customer_id
      ) {
        return selectedClient.customer_id;
      }

      if (
        selectedClient.source ===
        "customer"
      ) {
        throw new Error(
          "Selected customer does not contain a valid customer ID."
        );
      }

      if (
        !selectedClient.contact_id
      ) {
        throw new Error(
          "Selected CRM contact could not be resolved."
        );
      }

      const contact =
        contacts.find(
          (
            item
          ) =>
            item.id ===
            selectedClient.contact_id
        );

      if (
        !contact
      ) {
        throw new Error(
          "CRM contact no longer exists."
        );
      }

      const {
        data:
          latestContact,

        error:
          latestContactError,
      } =
        await supabase
          .from(
            "contacts"
          )
          .select(
            "id, customer_id"
          )
          .eq(
            "id",
            contact.id
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .maybeSingle();

      if (
        latestContactError
      ) {
        console.warn(
          "Latest contact lookup failed:",
          latestContactError
        );
      }

      if (
        latestContact?.customer_id
      ) {
        return latestContact.customer_id;
      }

      const {
        data:
          newCustomer,

        error:
          customerCreateError,
      } =
        await supabase
          .from(
            "customers"
          )
          .insert({
            organisation_id:
              organisationId,

            name:
              contact.name ||
              [
                contact.first_name,
                contact.last_name,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .trim() ||
              selectedClient.name,

            email:
              contact.email ||
              null,

            phone:
              contact.phone ||
              null,

            company:
              contact.company ||
              null,

            status:
              "active",
          })
          .select(
            `
              id,
              name,
              email,
              phone,
              company,
              organisation_id,
              status
            `
          )
          .single();

      if (
        customerCreateError
      ) {
        console.error(
          "Customer creation from contact failed:",
          customerCreateError
        );

        throw customerCreateError;
      }

      if (
        !newCustomer?.id
      ) {
        throw new Error(
          "Customer was created but no customer ID was returned."
        );
      }

      const {
        error:
          contactUpdateError,
      } =
        await supabase
          .from(
            "contacts"
          )
          .update({
            customer_id:
              newCustomer.id,
          })
          .eq(
            "id",
            contact.id
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        contactUpdateError
      ) {
        console.error(
          "Contact/customer linking error:",
          contactUpdateError
        );

        throw contactUpdateError;
      }

      setCustomers(
        (
          previous
        ) => {
          const exists =
            previous.some(
              (
                customer
              ) =>
                customer.id ===
                newCustomer.id
            );

          return exists
            ? previous
            : [
                ...previous,
                newCustomer,
              ];
        }
      );

      setContacts(
        (
          previous
        ) =>
          previous.map(
            (
              item
            ) =>
              item.id ===
              contact.id
                ? {
                    ...item,

                    customer_id:
                      newCustomer.id,
                  }
                : item
          )
      );

      return newCustomer.id;
    };

  // =========================================================
  // CREATE PROJECT
  // =========================================================

  async function establishProject(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    if (
      !organisationId ||
      !currentUserId
    ) {
      toast.error(
        "Workspace is not ready"
      );

      return;
    }

    if (
      !form.name.trim()
    ) {
      toast.error(
        "Project name required"
      );

      return;
    }

    setSaving(
      true
    );

    try {
      const resolvedCustomerId =
        await resolveSelectedCustomer();

      const payload = {
        name:
          form.name.trim(),

        objective_summary:
          form.objective_summary.trim() ||
          null,

        description:
          form.description.trim() ||
          null,

        category:
          form.category,

        status:
          "live",

        priority:
          "Medium",

        health:
          "good",

        members:
          [],

        start_date:
          form.start_date ||
          null,

        due_date:
          form.due_date ||
          null,

        budget:
          form.budget !==
            "" &&
          !Number.isNaN(
            Number(
              form.budget
            )
          )
            ? Number(
                form.budget
              )
            : 0,

        customer_id:
          resolvedCustomerId,

        organisation_id:
          organisationId,

        user_id:
          currentUserId,
      };

      const {
        data:
          inserted,

        error:
          insertError,
      } =
        await supabase
          .from(
            "projects"
          )
          .insert(
            payload
          )
          .select(
            "*"
          )
          .single();

      if (
        insertError
      ) {
        console.error(
          "Project insert error:",
          insertError
        );

        throw insertError;
      }

      let selectedCustomer:
        Customer | null =
        null;

      if (
        inserted.customer_id
      ) {
        selectedCustomer =
          customers.find(
            (
              customer
            ) =>
              customer.id ===
              inserted.customer_id
          ) ||
          null;

        if (
          !selectedCustomer
        ) {
          const {
            data:
              freshCustomer,
          } =
            await supabase
              .from(
                "customers"
              )
              .select(
                `
                  id,
                  name,
                  email,
                  phone,
                  company,
                  organisation_id,
                  status
                `
              )
              .eq(
                "id",
                inserted.customer_id
              )
              .eq(
                "organisation_id",
                organisationId
              )
              .maybeSingle();

          selectedCustomer =
            freshCustomer ||
            null;

          if (
            freshCustomer
          ) {
            setCustomers(
              (
                previous
              ) => {
                const exists =
                  previous.some(
                    (
                      customer
                    ) =>
                      customer.id ===
                      freshCustomer.id
                  );

                return exists
                  ? previous
                  : [
                      ...previous,
                      freshCustomer,
                    ];
              }
            );
          }
        }
      }

      const newProject:
        ProjectWithCustomer =
        {
          ...inserted,

          customer:
            selectedCustomer,
        };

      setProjects(
        (
          previous
        ) => [
          newProject,
          ...previous,
        ]
      );

      resetForm();

      setShowModal(
        false
      );

      toast.success(
        resolvedCustomerId
          ? "Project created and linked to client"
          : "Project created"
      );
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Unexpected project create error:",
        error
      );

      toast.error(
        error instanceof
          Error
          ? error.message
          : "Unable to create project"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  // =========================================================
  // FORMAT HELPERS
  // =========================================================

  function formatCurrency(
    amount:
      | number
      | string
      | null
      | undefined
  ) {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style:
          "currency",

        currency:
          "GBP",

        maximumFractionDigits:
          0,
      }
    ).format(
      Number(
        amount ||
          0
      )
    );
  }

  function formatDate(
    value?:
      | string
      | null
  ) {
    if (
      !value
    ) {
      return "No deadline";
    }

    const safeValue =
      value.includes(
        "T"
      )
        ? value
        : `${value}T12:00:00`;

    const date =
      new Date(
        safeValue
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day:
          "numeric",

        month:
          "short",
      }
    ).format(
      date
    );
  }

  function daysUntil(
    value?:
      | string
      | null
  ) {
    if (
      !value
    ) {
      return null;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const safeValue =
      value.includes(
        "T"
      )
        ? value
        : `${value}T00:00:00`;

    const target =
      new Date(
        safeValue
      );

    if (
      Number.isNaN(
        target.getTime()
      )
    ) {
      return null;
    }

    return Math.ceil(
      (
        target.getTime() -
        today.getTime()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        )
    );
  }

  function getCustomerName(
    customer?:
      | Customer
      | null
  ) {
    return getCustomerDisplayName(
      customer
    );
  }

  // =========================================================
  // PROJECT GROUPS
  // =========================================================

  const clientProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project
          ) =>
            Boolean(
              project.customer_id
            )
        ),
      [
        projects,
      ]
    );

  const internalProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project
          ) =>
            !project.customer_id
        ),
      [
        projects,
      ]
    );

  const completedProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project
          ) =>
            isProjectComplete(
              project.status
            )
        ),
      [
        projects,
      ]
    );

  const archivedProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project
          ) =>
            isProjectArchived(
              project.status
            )
        ),
      [
        projects,
      ]
    );

  const activeProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project
          ) =>
            !isProjectComplete(
              project.status
            ) &&
            !isProjectArchived(
              project.status
            )
        ),
      [
        projects,
      ]
    );

  // =========================================================
  // FILTERED PROJECTS
  // =========================================================

  const filtered =
    useMemo(
      () => {
        const value =
          search
            .trim()
            .toLowerCase();

        if (!value) {
          return projects;
        }

        return projects.filter(
          (
            project
          ) => {
            const customerName =
              getCustomerName(
                project.customer
              ).toLowerCase();

            const status =
              String(
                project.status ||
                  ""
              ).toLowerCase();

            return (
              (
                project.name ||
                ""
              )
                .toLowerCase()
                .includes(
                  value
                ) ||
              (
                project.category ||
                ""
              )
                .toLowerCase()
                .includes(
                  value
                ) ||
              (
                project.objective_summary ||
                ""
              )
                .toLowerCase()
                .includes(
                  value
                ) ||
              customerName.includes(
                value
              ) ||
              status.includes(
                value
              ) ||
              (
                isProjectComplete(
                  project.status
                ) &&
                "completed".includes(
                  value
                )
              )
            );
          }
        );
      },
      [
        projects,
        search,
      ]
    );

  // =========================================================
  // DASHBOARD METRICS
  // =========================================================

  const projectsDueSoon =
    useMemo(
      () => {
        return activeProjects.filter(
          (
            project
          ) => {
            const remaining =
              daysUntil(
                project.due_date
              );

            return (
              remaining !==
                null &&
              remaining >=
                0 &&
              remaining <=
                7
            );
          }
        );
      },
      [
        activeProjects,
      ]
    );

  const overdueProjects =
    useMemo(
      () => {
        return activeProjects.filter(
          (
            project
          ) => {
            const remaining =
              daysUntil(
                project.due_date
              );

            return (
              remaining !==
                null &&
              remaining <
                0
            );
          }
        );
      },
      [
        activeProjects,
      ]
    );

  const totalBudget =
    useMemo(
      () =>
        activeProjects.reduce(
          (
            total,
            project
          ) =>
            total +
            Number(
              project.budget ||
                0
            ),
          0
        ),
      [
        activeProjects,
      ]
    );

  const activeClients =
    useMemo(
      () => {
        const ids =
          activeProjects
            .map(
              (
                project
              ) =>
                project.customer_id
            )
            .filter(
              (
                id
              ):
                id is string =>
                  Boolean(
                    id
                  )
            );

        return new Set(
          ids
        ).size;
      },
      [
        activeProjects,
      ]
    );

  // =========================================================
  // ATTENTION PROJECTS
  // =========================================================

  const attentionProjects =
    useMemo(
      () => {
        return activeProjects
          .filter(
            (
              project
            ) => {
              const remaining =
                daysUntil(
                  project.due_date
                );

              const health =
                String(
                  project.health ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              return (
                [
                  "bad",
                  "warning",
                  "at-risk",
                  "atrisk",
                ].includes(
                  health
                ) ||
                (
                  remaining !==
                    null &&
                  remaining <=
                    7
                )
              );
            }
          )
          .sort(
            (
              first,
              second
            ) => {
              const firstDays =
                daysUntil(
                  first.due_date
                ) ??
                999999;

              const secondDays =
                daysUntil(
                  second.due_date
                ) ??
                999999;

              return (
                firstDays -
                secondDays
              );
            }
          )
          .slice(
            0,
            5
          );
      },
      [
        activeProjects,
      ]
    );

  // =========================================================
  // WORKSPACE SUMMARY
  // =========================================================

  const workspaceSummary =
    useMemo(
      () => {
        if (
          activeProjects.length ===
            0 &&
          completedProjects.length ===
            0
        ) {
          return "Your commercial workspace is ready. Add a client project or internal project to begin tracking delivery.";
        }

        let summary =
          "";

        if (
          activeProjects.length >
          0
        ) {
          summary =
            `You currently have ${activeProjects.length} ${
              activeProjects.length ===
              1
                ? "active project"
                : "active projects"
            }`;

          if (
            activeClients >
            0
          ) {
            summary +=
              ` across ${activeClients} ${
                activeClients ===
                1
                  ? "client"
                  : "clients"
              }`;
          }

          if (
            projectsDueSoon.length >
            0
          ) {
            summary +=
              `, with ${projectsDueSoon.length} ${
                projectsDueSoon.length ===
                1
                  ? "project"
                  : "projects"
              } due in the next 7 days`;
          }

          if (
            overdueProjects.length >
            0
          ) {
            summary +=
              `. ${overdueProjects.length} ${
                overdueProjects.length ===
                1
                  ? "project is"
                  : "projects are"
              } overdue`;
          }

          if (
            totalBudget >
            0
          ) {
            summary +=
              `. Active project value is ${formatCurrency(
                totalBudget
              )}`;
          }
        } else {
          summary =
            "You currently have no active projects.";
        }

        if (
          completedProjects.length >
          0
        ) {
          summary +=
            ` ${completedProjects.length} ${
              completedProjects.length ===
              1
                ? "project has"
                : "projects have"
            } been completed.`;
        } else {
          summary +=
            ".";
        }

        return summary;
      },
      [
        activeProjects.length,
        completedProjects.length,
        activeClients,
        projectsDueSoon.length,
        overdueProjects.length,
        totalBudget,
      ]
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-stone-50 p-4 pb-32 selection:bg-[#a9b897] selection:text-white md:p-10 lg:p-12">
      <div className="mx-auto max-w-6xl">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#a9b897]">
              <Briefcase
                size={
                  13
                }
              />

              Commercial Workspace
            </div>

            <h1 className="font-serif text-5xl italic tracking-tight text-stone-800 md:text-7xl">
              Clients & Projects
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-stone-500">
              Manage the people you work
              with and everything you are
              delivering for them.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/crm"
              className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-stone-600 transition hover:border-[#a9b897] hover:text-stone-900"
            >
              <ContactRound
                size={
                  16
                }
              />

              Clients
            </Link>

            <button
              type="button"
              onClick={() => {
                resetForm();

                setShowModal(
                  true
                );
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-[#a9b897] active:scale-[0.98]"
            >
              <Plus
                size={
                  16
                }
              />

              New Project
            </button>
          </div>
        </header>

        {/* ===================================================
            TOTS SUMMARY
        =================================================== */}

        {!loading && (
          <section className="mb-8 rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/10 text-[#7f9270]">
                <Sparkles
                  size={
                    19
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.26em] text-[#829473]">
                  TOTS Summary
                </p>

                <p className="max-w-4xl text-lg leading-7 text-stone-700">
                  {
                    workspaceSummary
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================
            METRICS
        =================================================== */}

        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <WorkspaceMetric
            icon={
              Folder
            }
            value={String(
              activeProjects.length
            )}
            label="Active Projects"
          />

          <WorkspaceMetric
            icon={
              Check
            }
            value={String(
              completedProjects.length
            )}
            label="Completed"
            completed
          />

          <WorkspaceMetric
            icon={
              Users
            }
            value={String(
              activeClients
            )}
            label="Active Clients"
          />

          <WorkspaceMetric
            icon={
              AlertTriangle
            }
            value={String(
              overdueProjects.length
            )}
            label="Overdue"
          />

          <WorkspaceMetric
            icon={
              CircleDollarSign
            }
            value={formatCurrency(
              totalBudget
            )}
            label="Active Value"
          />
        </section>

        {/* ===================================================
            WORKSPACE ENTRY POINTS
        =================================================== */}

        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/crm"
            className="group rounded-[2rem] border border-stone-200 bg-white p-6 transition hover:border-[#a9b897] hover:shadow-xl hover:shadow-stone-200/40"
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50 text-stone-600 transition group-hover:bg-[#a9b897] group-hover:text-white">
                <Users
                  size={
                    20
                  }
                />
              </div>

              <ArrowUpRight
                size={
                  18
                }
                className="text-stone-300 transition group-hover:text-[#a9b897]"
              />
            </div>

            <h2 className="font-serif text-2xl italic text-stone-800">
              Clients
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
              Open a client workspace to
              see their projects, money,
              tasks, emails and history.
            </p>

            <div className="mt-6 flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#829473]">
              Open Clients

              <ChevronRight
                size={
                  13
                }
              />
            </div>
          </Link>

          <div className="rounded-[2rem] border border-[#a9b897]/50 bg-[#a9b897]/5 p-6">
            <div className="mb-8 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a9b897] text-white">
                <Briefcase
                  size={
                    20
                  }
                />
              </div>

              <span className="rounded-full bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-[#829473]">
                You are here
              </span>
            </div>

            <h2 className="font-serif text-2xl italic text-stone-800">
              Projects
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
              Track delivery, tasks,
              deadlines, team members,
              budgets and commercial
              activity.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-[0.18em]">
              <span className="text-[#829473]">
                {
                  activeProjects.length
                }{" "}
                Active
              </span>

              {completedProjects.length >
                0 && (
                <>
                  <span className="text-stone-300">
                    •
                  </span>

                  <span className="text-stone-400">
                    {
                      completedProjects.length
                    }{" "}
                    Completed
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            NEEDS ATTENTION
        =================================================== */}

        {attentionProjects.length >
          0 && (
          <section className="mb-10">
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#829473]">
                Needs Attention
              </p>

              <h2 className="mt-1 font-serif text-2xl italic text-stone-800">
                What needs you next
              </h2>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
              {attentionProjects.map(
                (
                  project,
                  index
                ) => {
                  const remaining =
                    daysUntil(
                      project.due_date
                    );

                  return (
                    <Link
                      href={`/projects/${project.id}`}
                      key={
                        project.id
                      }
                      className={`group flex items-center justify-between gap-4 p-5 transition hover:bg-stone-50 ${
                        index !==
                        attentionProjects.length -
                          1
                          ? "border-b border-stone-100"
                          : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <AlertTriangle
                            size={
                              16
                            }
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-800">
                            {
                              project.name
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-stone-400">
                            {project.customer
                              ? `${getCustomerName(
                                  project.customer
                                )} · `
                              : ""}

                            {remaining ===
                            null
                              ? "No deadline set"
                              : remaining <
                                  0
                                ? `${Math.abs(
                                    remaining
                                  )} ${
                                    Math.abs(
                                      remaining
                                    ) ===
                                    1
                                      ? "day"
                                      : "days"
                                  } overdue`
                                : remaining ===
                                    0
                                  ? "Due today"
                                  : `Due in ${remaining} ${
                                      remaining ===
                                      1
                                        ? "day"
                                        : "days"
                                    }`}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={
                          17
                        }
                        className="shrink-0 text-stone-300 transition group-hover:translate-x-1 group-hover:text-[#a9b897]"
                      />
                    </Link>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* ===================================================
            PROJECT DIRECTORY
        =================================================== */}

        <section>
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#829473]">
                Your Work
              </p>

              <h2 className="mt-1 font-serif text-3xl italic text-stone-800">
                Projects
              </h2>

              {!loading && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                  <span>
                    {
                      clientProjects.length
                    }{" "}
                    client{" "}
                    {clientProjects.length ===
                    1
                      ? "project"
                      : "projects"}
                  </span>

                  <span>
                    ·
                  </span>

                  <span>
                    {
                      internalProjects.length
                    }{" "}
                    internal
                  </span>

                  <span>
                    ·
                  </span>

                  <span>
                    {
                      completedProjects.length
                    }{" "}
                    completed
                  </span>

                  {archivedProjects.length >
                    0 && (
                    <>
                      <span>
                        ·
                      </span>

                      <span>
                        {
                          archivedProjects.length
                        }{" "}
                        archived
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <Search
                size={
                  14
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                placeholder="Search project, client or status..."
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
                className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-10 pr-4 text-xs outline-none transition focus:border-[#a9b897] focus:ring-2 focus:ring-[#a9b897]/10 md:w-80"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-stone-100 bg-white p-20">
                <Loader2 className="animate-spin text-[#a9b897]" />

                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-stone-300">
                  Loading Workspace
                </p>
              </div>
            ) : filtered.length >
              0 ? (
              filtered.map(
                (
                  project
                ) => {
                  const remaining =
                    daysUntil(
                      project.due_date
                    );

                  const completed =
                    isProjectComplete(
                      project.status
                    );

                  const archived =
                    isProjectArchived(
                      project.status
                    );

                  const paused =
                    String(
                      project.status ||
                        ""
                    )
                      .trim()
                      .toLowerCase() ===
                    "paused";

                  return (
                    <Link
                      href={`/projects/${project.id}`}
                      key={
                        project.id
                      }
                      className={`group relative rounded-[1.8rem] border bg-white p-5 transition-all duration-300 hover:shadow-xl hover:shadow-stone-200/40 md:p-6 ${
                        completed
                          ? "border-[#a9b897]/60"
                          : archived
                            ? "border-stone-200 opacity-70"
                            : "border-stone-200 hover:border-[#a9b897]"
                      }`}
                    >
                      {completed && (
                        <div className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-[#a9b897]" />
                      )}

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4 md:gap-6">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition ${
                              completed
                                ? "border-[#a9b897]/20 bg-[#a9b897]/10 text-[#829473]"
                                : archived
                                  ? "border-stone-100 bg-stone-50 text-stone-300"
                                  : "border-stone-100 bg-stone-50 text-stone-400 group-hover:bg-stone-900 group-hover:text-[#a9b897]"
                            }`}
                          >
                            {completed ? (
                              <Check
                                size={
                                  21
                                }
                              />
                            ) : (
                              <Folder
                                size={
                                  21
                                }
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h3
                                className={`truncate font-serif text-xl italic md:text-2xl ${
                                  completed
                                    ? "text-stone-700"
                                    : "text-stone-800"
                                }`}
                              >
                                {
                                  project.name
                                }
                              </h3>

                              {project.category && (
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-stone-500">
                                  {
                                    project.category
                                  }
                                </span>
                              )}

                              {completed && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#a9b897]/15 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-[#6f8064]">
                                  <Check
                                    size={
                                      9
                                    }
                                  />

                                  Completed
                                </span>
                              )}

                              {paused && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-amber-600">
                                  Paused
                                </span>
                              )}

                              {archived && (
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-stone-400">
                                  Archived
                                </span>
                              )}
                            </div>

                            <div className="mb-2 flex items-center gap-2">
                              <UserRound
                                size={
                                  11
                                }
                                className="text-[#829473]"
                              />

                              <span className="truncate text-[10px] font-semibold text-[#829473]">
                                {getCustomerName(
                                  project.customer
                                )}
                              </span>
                            </div>

                            {project.objective_summary && (
                              <p className="mb-2 line-clamp-1 text-xs text-stone-400">
                                {
                                  project.objective_summary
                                }
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">
                              <span className="flex items-center gap-1.5">
                                <Calendar
                                  size={
                                    11
                                  }
                                />

                                {formatDate(
                                  project.due_date
                                )}
                              </span>

                              {Number(
                                project.budget
                              ) >
                                0 && (
                                <span className="flex items-center gap-1.5">
                                  <Banknote
                                    size={
                                      11
                                    }
                                  />

                                  {formatCurrency(
                                    project.budget
                                  )}
                                </span>
                              )}

                              {completed ? (
                                <span className="inline-flex items-center gap-1.5 text-[#829473]">
                                  <Check
                                    size={
                                      10
                                    }
                                  />

                                  Project complete
                                </span>
                              ) : (
                                remaining !==
                                  null &&
                                remaining <
                                  0 &&
                                !archived && (
                                  <span className="text-amber-600">
                                    Overdue
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                            completed
                              ? "bg-[#a9b897]/10 text-[#829473] group-hover:bg-[#a9b897] group-hover:text-white"
                              : "bg-stone-50 text-stone-300 group-hover:bg-[#a9b897] group-hover:text-white"
                          }`}
                        >
                          <ArrowUpRight
                            size={
                              17
                            }
                          />
                        </div>
                      </div>
                    </Link>
                  );
                }
              )
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-stone-200 bg-white py-20 text-center">
                <Database
                  size={
                    30
                  }
                  className="mx-auto mb-4 text-stone-200"
                />

                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">
                  {search
                    ? "No Matching Projects"
                    : "No Projects Yet"}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();

                      setShowModal(
                        true
                      );
                    }}
                    className="mt-5 text-xs font-semibold text-[#829473]"
                  >
                    Create your first project →
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          NEW PROJECT MODAL
      ===================================================== */}

      <AnimatePresence>
        {showModal && (
          <div
            className="
              fixed
              inset-0
              z-[1000]

              flex
              items-center
              justify-center

              overflow-hidden

              p-3

              sm:p-4
              md:p-6
            "
          >
            <motion.div
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
              className="
                absolute
                inset-0

                bg-stone-900/60

                backdrop-blur-md
              "
              onClick={() => {
                if (
                  !saving
                ) {
                  setShowModal(
                    false
                  );
                }
              }}
            />

            <motion.div
              initial={{
                scale:
                  0.95,

                opacity:
                  0,

                y:
                  15,
              }}
              animate={{
                scale:
                  1,

                opacity:
                  1,

                y:
                  0,
              }}
              exit={{
                scale:
                  0.95,

                opacity:
                  0,

                y:
                  15,
              }}
              transition={{
                duration:
                  0.22,

                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-project-title"
              className="
                project-modal-scroll

                relative
                z-10

                max-h-[calc(100dvh-1.5rem)]
                w-full
                max-w-2xl

                overflow-x-hidden
                overflow-y-scroll
                overscroll-contain

                rounded-[2rem]

                border
                border-stone-100

                bg-white

                shadow-2xl

                sm:max-h-[92dvh]
                sm:rounded-[2.5rem]

                md:max-h-[90vh]

                [-webkit-overflow-scrolling:touch]
              "
            >
              <div
                className="
                  sticky
                  top-0
                  z-20

                  border-b
                  border-stone-100

                  bg-white/95

                  px-6
                  pb-5
                  pt-6

                  backdrop-blur-xl

                  sm:px-7
                  sm:pb-6
                  sm:pt-7

                  md:px-10
                  md:pt-9
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-2 text-[8px] font-black uppercase tracking-[0.25em] text-[#829473]">
                      Clients & Projects
                    </p>

                    <h2
                      id="new-project-title"
                      className="font-serif text-3xl italic text-stone-800 sm:text-4xl"
                    >
                      New Project
                    </h2>

                    <p className="mt-2 max-w-lg text-[11px] leading-5 text-stone-400 sm:text-xs">
                      Choose any client or
                      CRM contact. TOTS will
                      connect the project to
                      the correct customer
                      record automatically.
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
                    aria-label="Close new project modal"
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center

                      rounded-full

                      border
                      border-stone-100

                      bg-stone-50

                      text-stone-500

                      transition

                      hover:bg-stone-100
                      hover:text-stone-900

                      disabled:opacity-50
                    "
                  >
                    <X
                      size={
                        18
                      }
                    />
                  </button>
                </div>
              </div>

              <div
                className="
                  px-6
                  pb-8
                  pt-6

                  sm:px-7
                  sm:pb-9

                  md:px-10
                  md:pb-10
                  md:pt-8
                "
              >
                <form
                  onSubmit={
                    establishProject
                  }
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Project Name
                    </label>

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
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 font-serif text-base italic outline-none transition focus:border-[#a9b897] focus:bg-white focus:ring-2 focus:ring-[#a9b897]/10"
                      placeholder="Website Redesign"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Client
                    </label>

                    <div className="relative">
                      <UserRound
                        size={
                          14
                        }
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                      />

                      <select
                        value={
                          form.client_key
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              client_key:
                                event.target.value,
                            })
                          )
                        }
                        className="w-full appearance-none rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 pr-10 text-xs outline-none transition focus:border-[#a9b897] focus:bg-white focus:ring-2 focus:ring-[#a9b897]/10"
                      >
                        <option value="">
                          Internal project / no client
                        </option>

                        {clientOptions.map(
                          (
                            client
                          ) => (
                            <option
                              key={
                                client.key
                              }
                              value={
                                client.key
                              }
                            >
                              {
                                client.name
                              }
                              {client.email
                                ? ` — ${client.email}`
                                : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {clientOptions.length >
                    0 ? (
                      <p className="ml-1 mt-2 text-[10px] leading-4 text-stone-400">
                        {
                          clientOptions.length
                        }{" "}
                        {clientOptions.length ===
                        1
                          ? "client/contact is"
                          : "clients and contacts are"}{" "}
                        available from your
                        CRM.
                      </p>
                    ) : (
                      <div className="ml-1 mt-2 flex items-start gap-2">
                        <ContactRound
                          size={
                            12
                          }
                          className="mt-0.5 shrink-0 text-stone-300"
                        />

                        <p className="text-[10px] leading-4 text-stone-400">
                          No CRM contacts
                          exist yet. You can
                          create an internal
                          project or add a
                          contact from the
                          Clients area first.
                        </p>
                      </div>
                    )}

                    {form.client_key && (
                      <SelectedClientPreview
                        client={
                          clientOptions.find(
                            (
                              client
                            ) =>
                              client.key ===
                              form.client_key
                          ) ||
                          null
                        }
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                        Category
                      </label>

                      <select
                        value={
                          form.category
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              category:
                                event.target.value,
                            })
                          )
                        }
                        className="w-full appearance-none rounded-xl border border-stone-100 bg-stone-50 p-4 text-[10px] font-bold uppercase tracking-widest outline-none transition focus:border-[#a9b897] focus:bg-white focus:ring-2 focus:ring-[#a9b897]/10"
                      >
                        <option value="Client Work">
                          Client Work
                        </option>

                        <option value="Website">
                          Website
                        </option>

                        <option value="Branding">
                          Branding
                        </option>

                        <option value="Marketing">
                          Marketing
                        </option>

                        <option value="Strategy">
                          Strategy
                        </option>

                        <option value="Operational">
                          Operational
                        </option>

                        <option value="Internal">
                          Internal
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                        Project Budget
                      </label>

                      <div className="relative">
                        <Banknote
                          size={
                            14
                          }
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={
                            form.budget
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                budget:
                                  event.target.value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-xs outline-none transition focus:border-[#a9b897] focus:bg-white focus:ring-2 focus:ring-[#a9b897]/10"
                          placeholder="6000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                        Start Date
                      </label>

                      <div className="relative">
                        <Calendar
                          size={
                            14
                          }
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                        />

                        <input
                          type="date"
                          value={
                            form.start_date
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                start_date:
                                  event.target.value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-[10px] font-bold outline-none transition focus:border-[#a9b897] focus:bg-white focus:ring-2 focus:ring-[#a9b897]/10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                        Deadline
                      </label>

                      <div className="relative">
                        <Calendar
                          size={
                            14
                          }
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                        />

                        <input
                          type="date"
                          min={
                            form.start_date ||
                            undefined
                          }
                          value={
                            form.due_date
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                due_date:
                                  event.target.value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-[10px] font-bold outline-none transition focus:border-[#a9b897] focus:bg-white focus:ring-2 focus:ring-[#a9b897]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Project Objective
                    </label>

                    <input
                      value={
                        form.objective_summary
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            objective_summary:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 font-serif text-sm italic outline-none transition focus:border-[#a9b897] focus:bg-white focus:ring-2 focus:ring-[#a9b897]/10"
                      placeholder="What does success look like?"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Description
                    </label>

                    <div className="relative">
                      <AlignLeft
                        size={
                          14
                        }
                        className="pointer-events-none absolute left-4 top-5 text-stone-300"
                      />

                      <textarea
                        value={
                          form.description
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              description:
                                event.target.value,
                            })
                          )
                        }
                        className="h-28 w-full resize-none rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-xs leading-relaxed outline-none transition focus:border-[#a9b897] focus:bg-white focus:ring-2 focus:ring-[#a9b897]/10"
                        placeholder="Scope, deliverables, requirements or useful project context..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-3

                      rounded-[1.6rem]

                      bg-stone-900

                      py-5

                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.3em]

                      text-white

                      shadow-xl

                      transition

                      hover:bg-[#a9b897]
                      hover:text-stone-900

                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={
                            16
                          }
                          className="animate-spin"
                        />

                        Creating
                      </>
                    ) : (
                      <>
                        <Plus
                          size={
                            15
                          }
                        />

                        Create Project
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');

            .font-serif {
              font-family: 'Instrument Serif', serif;
            }

            .project-modal-scroll {
              scrollbar-width: thin;
              scrollbar-color: #a9b897 #f5f5f4;
              scrollbar-gutter: stable;
            }

            .project-modal-scroll::-webkit-scrollbar {
              width: 9px;
            }

            .project-modal-scroll::-webkit-scrollbar-track {
              background: #f5f5f4;
              border-radius: 999px;
              margin-top: 24px;
              margin-bottom: 24px;
            }

            .project-modal-scroll::-webkit-scrollbar-thumb {
              background: #a9b897;
              border-radius: 999px;
              border: 2px solid #f5f5f4;
            }

            .project-modal-scroll::-webkit-scrollbar-thumb:hover {
              background: #8fa07d;
            }

            .project-modal-scroll {
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
            }
          `,
        }}
      />
    </div>
  );
}

// =========================================================
// SELECTED CLIENT PREVIEW
// =========================================================

function SelectedClientPreview({
  client,
}: {
  client:
    | ClientOption
    | null;
}) {
  if (
    !client
  ) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl border border-[#a9b897]/20 bg-[#a9b897]/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#829473]">
          <UserRound
            size={
              14
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-xs font-semibold text-stone-700">
              {
                client.name
              }
            </p>

            <span className="rounded-full bg-white px-2 py-1 text-[7px] font-black uppercase tracking-wider text-[#829473]">
              {client.customer_id
                ? "Client"
                : "CRM Contact"}
            </span>
          </div>

          {client.email && (
            <p className="mt-1 truncate text-[10px] text-stone-400">
              {
                client.email
              }
            </p>
          )}

          {!client.customer_id &&
            client.source ===
              "contact" && (
              <p className="mt-2 text-[9px] leading-4 text-[#829473]">
                TOTS will create
                and link the client
                record when this
                project is created.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// WORKSPACE METRIC
// =========================================================

function WorkspaceMetric({
  icon:
    Icon,

  value,

  label,

  completed =
    false,
}: {
  icon:
    LucideIcon;

  value:
    string;

  label:
    string;

  completed?:
    boolean;
}) {
  return (
    <div
      className={`rounded-[1.7rem] border bg-white p-5 ${
        completed
          ? "border-[#a9b897]/40"
          : "border-stone-200"
      }`}
    >
      <div
        className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl ${
          completed
            ? "bg-[#a9b897]/10 text-[#829473]"
            : "bg-stone-50 text-stone-500"
        }`}
      >
        <Icon
          size={
            16
          }
        />
      </div>

      <p className="font-serif text-2xl italic text-stone-800 md:text-3xl">
        {
          value
        }
      </p>

      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
        {
          label
        }
      </p>
    </div>
  );
}