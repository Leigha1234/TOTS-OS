import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import {
  sendPushNotification,
} from "@/lib/sendPushNotification";

// ============================================================
// TYPES
// ============================================================

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "social"
  | "finance"
  | "invoice"
  | "quote"
  | "payment"
  | "task"
  | "project"
  | "calendar"
  | "email"
  | "contact"
  | "client"
  | "order"
  | "system";

export type NotificationCategory =
  | "finance"
  | "tasks"
  | "projects"
  | "calendar"
  | "social"
  | "business"
  | "system";

export type NotificationInput = {
  userId:
    string;

  title:
    string;

  message?:
    string | null;

  type?:
    NotificationType;

  category?:
    NotificationCategory;

  link?:
    string | null;

  organisationId?:
    string | null;

  entityType?:
    string | null;

  entityId?:
    string | null;

  dedupeKey?:
    string | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;

  sendPush?:
    boolean;

  forcePush?:
    boolean;
};

export type CreateNotificationResult = {
  success:
    boolean;

  duplicate?:
    boolean;

  pushed?:
    boolean;

  pushSent?:
    number;

  notification?: {
    id:
      string;

    user_id:
      string;

    organisation_id?:
      string | null;

    title:
      string;

    message?:
      string | null;

    type?:
      string | null;

    link?:
      string | null;

    is_read?:
      boolean;

    metadata?:
      Record<
        string,
        unknown
      > | null;

    entity_type?:
      string | null;

    entity_id?:
      string | null;

    dedupe_key?:
      string | null;

    created_at?:
      string | null;
  } | null;

  error?:
    string;
};

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

type NotificationPreferences = {
  finance:
    boolean;

  tasks:
    boolean;

  projects:
    boolean;

  calendar:
    boolean;

  social:
    boolean;

  business:
    boolean;
};

const DEFAULT_NOTIFICATION_PREFERENCES:
  NotificationPreferences = {
  finance:
    true,

  tasks:
    true,

  projects:
    true,

  calendar:
    true,

  social:
    true,

  business:
    true,
};

// ============================================================
// SUPABASE ADMIN
// ============================================================

let adminClient:
  SupabaseClient | null =
  null;

function getSupabaseAdmin() {
  if (
    adminClient
  ) {
    return adminClient;
  }

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing."
    );
  }

  if (
    !serviceRoleKey
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }

  adminClient =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken:
            false,

          persistSession:
            false,
        },
      }
    );

  return adminClient;
}

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

// ============================================================

function cleanOptionalString(
  value:
    unknown
) {
  const cleaned =
    cleanString(
      value
    );

  return cleaned ||
    null;
}

// ============================================================

function normaliseType(
  value:
    NotificationType |
    undefined
): NotificationType {
  return (
    value ||
    "info"
  );
}

// ============================================================
// CATEGORY FROM TYPE
// ============================================================

function categoryFromType(
  type:
    NotificationType
): NotificationCategory {
  switch (
    type
  ) {
    case "finance":
    case "invoice":
    case "quote":
    case "payment":
      return "finance";

    case "task":
      return "tasks";

    case "project":
      return "projects";

    case "calendar":
      return "calendar";

    case "social":
      return "social";

    case "email":
    case "contact":
    case "client":
    case "order":
      return "business";

    case "system":
    case "success":
    case "error":
    case "warning":
    case "info":
    default:
      return "system";
  }
}

// ============================================================
// NORMALISE PREFERENCES
// ============================================================

function normalisePreferences(
  value:
    unknown
): NotificationPreferences {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const preferences =
    value as
      Record<
        string,
        unknown
      >;

  return {
    finance:
      typeof preferences.finance ===
      "boolean"
        ? preferences.finance
        : true,

    tasks:
      typeof preferences.tasks ===
      "boolean"
        ? preferences.tasks
        : true,

    projects:
      typeof preferences.projects ===
      "boolean"
        ? preferences.projects
        : true,

    calendar:
      typeof preferences.calendar ===
      "boolean"
        ? preferences.calendar
        : true,

    social:
      typeof preferences.social ===
      "boolean"
        ? preferences.social
        : true,

    business:
      typeof preferences.business ===
      "boolean"
        ? preferences.business
        : true,
  };
}

// ============================================================
// CHECK WHETHER PUSH CATEGORY IS ENABLED
// ============================================================

async function shouldSendPush({
  supabase,
  userId,
  category,
}: {
  supabase:
    SupabaseClient;

  userId:
    string;

  category:
    NotificationCategory;
}) {
  // ==========================================================
  // SYSTEM ALERTS
  //
  // Critical/system notices are not represented by one of the
  // user preference switches currently.
  // ==========================================================

  if (
    category ===
    "system"
  ) {
    return true;
  }

  try {
    const {
      data,
      error,
    } =
      await supabase
        .auth
        .admin
        .getUserById(
          userId
        );

    if (
      error
    ) {
      console.warn(
        "[TOTS NOTIFICATIONS] Could not load push preferences:",
        error
      );

      /*
       * Default to enabled so older users without settings
       * continue receiving alerts.
       */
      return true;
    }

    const preferences =
      normalisePreferences(
        data.user
          ?.user_metadata
          ?.tots_notification_preferences
      );

    return Boolean(
      preferences[
        category
      ]
    );
  } catch (
    error
  ) {
    console.warn(
      "[TOTS NOTIFICATIONS] Push preference check failed:",
      error
    );

    return true;
  }
}

// ============================================================
// FIND DUPLICATE
// ============================================================

async function findExistingNotification({
  supabase,
  userId,
  dedupeKey,
}: {
  supabase:
    SupabaseClient;

  userId:
    string;

  dedupeKey:
    string | null;
}) {
  if (
    !dedupeKey
  ) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "notifications"
      )
      .select(
        `
          id,
          user_id,
          organisation_id,
          title,
          message,
          type,
          link,
          is_read,
          metadata,
          entity_type,
          entity_id,
          dedupe_key,
          created_at
        `
      )
      .eq(
        "user_id",
        userId
      )
      .eq(
        "dedupe_key",
        dedupeKey
      )
      .maybeSingle();

  if (
    error
  ) {
    console.warn(
      "[TOTS NOTIFICATIONS] Dedupe lookup failed:",
      error
    );

    return null;
  }

  return (
    data ||
    null
  );
}

// ============================================================
// CREATE NOTIFICATION
// ============================================================

export async function createNotification(
  input:
    NotificationInput
): Promise<CreateNotificationResult> {
  try {
    const userId =
      cleanString(
        input.userId
      );

    const title =
      cleanString(
        input.title
      );

    const message =
      cleanOptionalString(
        input.message
      );

    const link =
      cleanOptionalString(
        input.link
      );

    const organisationId =
      cleanOptionalString(
        input.organisationId
      );

    const entityType =
      cleanOptionalString(
        input.entityType
      );

    const entityId =
      cleanOptionalString(
        input.entityId
      );

    const dedupeKey =
      cleanOptionalString(
        input.dedupeKey
      );

    const type =
      normaliseType(
        input.type
      );

    const category =
      input.category ||
      categoryFromType(
        type
      );

    const sendPush =
      input.sendPush !==
      false;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !userId
    ) {
      return {
        success:
          false,

        error:
          "Notification user ID is required.",
      };
    }

    if (
      !title
    ) {
      return {
        success:
          false,

        error:
          "Notification title is required.",
      };
    }

    // ========================================================
    // DATABASE
    // ========================================================

    const supabase =
      getSupabaseAdmin();

    // ========================================================
    // DEDUPE
    // ========================================================

    const existing =
      await findExistingNotification({
        supabase,
        userId,
        dedupeKey,
      });

    if (
      existing
    ) {
      console.log(
        "[TOTS NOTIFICATIONS] Duplicate skipped:",
        {
          userId,
          dedupeKey,
          existingId:
            existing.id,
        }
      );

      return {
        success:
          true,

        duplicate:
          true,

        pushed:
          false,

        pushSent:
          0,

        notification:
          existing,
      };
    }

    // ========================================================
    // INSERT
    // ========================================================

    const now =
      new Date()
        .toISOString();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .insert({
          user_id:
            userId,

          organisation_id:
            organisationId,

          title,

          message,

          type,

          link,

          is_read:
            false,

          read_at:
            null,

          metadata:
            {
              ...(
                input.metadata ||
                {}
              ),

              category,
            },

          entity_type:
            entityType,

          entity_id:
            entityId,

          dedupe_key:
            dedupeKey,

          created_at:
            now,

          updated_at:
            now,
        })
        .select(
          `
            id,
            user_id,
            organisation_id,
            title,
            message,
            type,
            link,
            is_read,
            metadata,
            entity_type,
            entity_id,
            dedupe_key,
            created_at
          `
        )
        .single();

    // ========================================================
    // INSERT ERROR
    // ========================================================

    if (
      error
    ) {
      console.error(
        "[TOTS NOTIFICATIONS] Create failed:",
        {
          error,

          userId,

          title,

          type,

          category,

          dedupeKey,
        }
      );

      return {
        success:
          false,

        error:
          error.message,
      };
    }

    // ========================================================
    // PUSH
    //
    // Bell notification is already safely persisted.
    // A push failure therefore must NOT make createNotification
    // report that the whole notification failed.
    // ========================================================

    let pushed =
      false;

    let pushSent =
      0;

    if (
      sendPush
    ) {
      try {
        const allowed =
          input.forcePush
            ? true
            : await shouldSendPush({
                supabase,
                userId,
                category,
              });

        if (
          allowed
        ) {
          const result =
            await sendPushNotification({
              userId,

              organisationId,

              title,

              body:
                message ||
                title,

              url:
                link ||
                "/dashboard",

              tag:
                dedupeKey ||
                `notification-${data.id}`,

              data: {
                notificationId:
                  data.id,

                type,

                category,

                entityType,

                entityId,
              },
            });

          pushed =
            result.sent >
            0;

          pushSent =
            result.sent;
        } else {
          console.log(
            "[TOTS NOTIFICATIONS] Push disabled by user preference:",
            {
              userId,
              category,
              title,
            }
          );
        }
      } catch (
        pushError
      ) {
        console.error(
          "[TOTS NOTIFICATIONS] Push failed but bell notification was created:",
          pushError
        );
      }
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "[TOTS NOTIFICATIONS] Created:",
      {
        id:
          data?.id,

        userId,

        title,

        type,

        category,

        pushed,

        pushSent,
      }
    );

    return {
      success:
        true,

      duplicate:
        false,

      pushed,

      pushSent,

      notification:
        data,
    };
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TOTS NOTIFICATIONS] Unexpected create error:",
      error
    );

    return {
      success:
        false,

      error:
        error instanceof
          Error
          ? error.message
          : "Unable to create notification.",
    };
  }
}

// ============================================================
// SUCCESS
// ============================================================

export async function createSuccessNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "success",
  });
}

// ============================================================
// ERROR
// ============================================================

export async function createErrorNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "error",
  });
}

// ============================================================
// WARNING
// ============================================================

export async function createWarningNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "warning",
  });
}

// ============================================================
// INFO
// ============================================================

export async function createInfoNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "info",
  });
}

// ============================================================
// SOCIAL
// ============================================================

export async function createSocialNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "social",

    category:
      "social",

    link:
      input.link ||
      "/social",
  });
}

// ============================================================
// FINANCE
// ============================================================

export async function createFinanceNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "finance",

    category:
      "finance",

    link:
      input.link ||
      "/payments",
  });
}

// ============================================================
// INVOICE
// ============================================================

export async function createInvoiceNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "invoice",

    category:
      "finance",

    link:
      input.link ||
      "/payments",
  });
}

// ============================================================
// QUOTE
// ============================================================

export async function createQuoteNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "quote",

    category:
      "finance",

    link:
      input.link ||
      "/payments",
  });
}

// ============================================================
// PAYMENT
// ============================================================

export async function createPaymentNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "payment",

    category:
      "finance",

    link:
      input.link ||
      "/payments",
  });
}

// ============================================================
// TASK
// ============================================================

export async function createTaskNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "task",

    category:
      "tasks",
  });
}

// ============================================================
// PROJECT
// ============================================================

export async function createProjectNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "project",

    category:
      "projects",

    link:
      input.link ||
      "/projects",
  });
}

// ============================================================
// CALENDAR
// ============================================================

export async function createCalendarNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "calendar",

    category:
      "calendar",

    link:
      input.link ||
      "/calendar",
  });
}

// ============================================================
// EMAIL
// ============================================================

export async function createEmailNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "email",

    category:
      "business",
  });
}

// ============================================================
// CONTACT
// ============================================================

export async function createContactNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "contact",

    category:
      "business",

    link:
      input.link ||
      "/crm",
  });
}

// ============================================================
// CLIENT
// ============================================================

export async function createClientNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "client",

    category:
      "business",

    link:
      input.link ||
      "/crm",
  });
}

// ============================================================
// ORDER
// ============================================================

export async function createOrderNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "order",

    category:
      "business",
  });
}

// ============================================================
// SYSTEM
// ============================================================

export async function createSystemNotification(
  input:
    Omit<
      NotificationInput,
      "type"
    >
) {
  return createNotification({
    ...input,

    type:
      "system",

    category:
      "system",
  });
}