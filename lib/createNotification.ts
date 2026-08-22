import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

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
  | "task"
  | "project"
  | "client"
  | "system";

export type NotificationInput = {
  userId: string;

  title: string;

  message?: string | null;

  type?: NotificationType;

  link?: string | null;

  organisationId?: string | null;

  metadata?: Record<
    string,
    unknown
  > | null;
};

export type CreateNotificationResult = {
  success: boolean;

  notification?: {
    id: string;

    user_id: string;

    organisation_id?:
      string | null;

    title: string;

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

    created_at?:
      string | null;
  } | null;

  error?: string;
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
  if (
    !value
  ) {
    return "info";
  }

  return value;
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

    const type =
      normaliseType(
        input.type
      );

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

          metadata:
            input.metadata ||
            {},

          created_at:
            new Date().toISOString(),
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
      }
    );

    return {
      success:
        true,

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
// CREATE SUCCESS NOTIFICATION
// ============================================================

export async function createSuccessNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "success",

    link,

    organisationId,

    metadata,
  });
}

// ============================================================
// CREATE ERROR NOTIFICATION
// ============================================================

export async function createErrorNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "error",

    link,

    organisationId,

    metadata,
  });
}

// ============================================================
// CREATE WARNING NOTIFICATION
// ============================================================

export async function createWarningNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "warning",

    link,

    organisationId,

    metadata,
  });
}

// ============================================================
// CREATE INFO NOTIFICATION
// ============================================================

export async function createInfoNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "info",

    link,

    organisationId,

    metadata,
  });
}

// ============================================================
// SOCIAL NOTIFICATION
// ============================================================

export async function createSocialNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "social",

    link:
      link ||
      "/social",

    organisationId,

    metadata,
  });
}

// ============================================================
// FINANCE NOTIFICATION
// ============================================================

export async function createFinanceNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "finance",

    link:
      link ||
      "/finance",

    organisationId,

    metadata,
  });
}

// ============================================================
// TASK NOTIFICATION
// ============================================================

export async function createTaskNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "task",

    link,

    organisationId,

    metadata,
  });
}

// ============================================================
// PROJECT NOTIFICATION
// ============================================================

export async function createProjectNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "project",

    link,

    organisationId,

    metadata,
  });
}

// ============================================================
// CLIENT NOTIFICATION
// ============================================================

export async function createClientNotification({
  userId,
  title,
  message,
  link,
  organisationId,
  metadata,
}: Omit<
  NotificationInput,
  "type"
>) {
  return createNotification({
    userId,

    title,

    message,

    type:
      "client",

    link,

    organisationId,

    metadata,
  });
}