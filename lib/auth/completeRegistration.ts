import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const encryptionKey = process.env.REGISTRATION_ENCRYPTION_KEY!;

function decryptPassword(value: string) {
  const [ivHex, encryptedHex] = value.split(":");

  const key = crypto
    .createHash("sha256")
    .update(encryptionKey)
    .digest();

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(ivHex, "hex")
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encryptedHex, "hex")
    ),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function normaliseTier(value: string | null | undefined) {
  const tier = String(value || "")
    .trim()
    .toLowerCase();

  if (tier === "standard") {
    return "standard";
  }

  if (tier === "professional") {
    return "professional";
  }

  if (tier === "elite") {
    return "elite";
  }

  throw new Error(
    `Invalid subscription tier: ${value || "missing"}`
  );
}

export async function completeRegistration(
  registrationId: string,
  session?: {
    stripe_session_id?: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    customer_email?: string;
    payment_status?: string;
  }
) {
  /*
   * Only runs after Stripe confirms payment.
   *
   * The selected subscription tier is taken from the
   * pending registration that was created BEFORE checkout.
   */

  const {
    data: registration,
    error: registrationError,
  } = await supabase
    .from("pending_registrations")
    .select("*")
    .eq("id", registrationId)
    .single();

  if (registrationError || !registration) {
    throw new Error(
      "Pending registration not found."
    );
  }

  /*
   * Stripe may retry webhooks.
   * If this registration was already completed,
   * do not create another account.
   */
  if (registration.completed) {
    return {
      userId:
        registration.user_id ?? null,

      organisationId:
        registration.organisation_id ?? null,

      recoveryLink: null,
    };
  }

  if (!registration.encrypted_password) {
    throw new Error(
      "Encrypted password missing from registration."
    );
  }

  /*
   * CRITICAL:
   * Resolve the exact plan the customer selected.
   *
   * There is deliberately NO Elite/default fallback.
   * If the tier is missing, registration should stop
   * instead of silently assigning the wrong package.
   */
  const subscriptionTier =
    normaliseTier(
      registration.subscription_tier
    );

  const password =
    decryptPassword(
      registration.encrypted_password
    );

  /*
   * ---------------------------------------------
   * CREATE AUTH USER
   * ---------------------------------------------
   */

  const {
    data: authData,
    error: authError,
  } =
    await supabase.auth.admin.createUser({
      email: registration.email,

      password,

      email_confirm: true,

      user_metadata: {
        full_name:
          registration.full_name,

        organisation_name:
          registration.company_name,

        registration_id:
          registration.id,

        subscription_tier:
          subscriptionTier,
      },
    });

  if (
    authError ||
    !authData.user
  ) {
    throw new Error(
      authError?.message ||
        "Failed to create auth user."
    );
  }

  /*
   * ---------------------------------------------
   * CREATE ORGANISATION
   * ---------------------------------------------
   */

  const {
    data: organisation,
    error: organisationError,
  } = await supabase
    .from("organisations")
    .insert({
      name:
        registration.company_name ||
        "New Organisation",

      created_by:
        authData.user.id,

      available_seats: 1,

      status: "active",

      email:
        registration.email,

      /*
       * THIS IS THE IMPORTANT FIX.
       *
       * Previously:
       * subscription_tier: "starter"
       *
       * Now:
       * actual Stripe-selected plan.
       */
      subscription_tier:
        subscriptionTier,
    })
    .select()
    .single();

  if (
    organisationError ||
    !organisation
  ) {
    /*
     * Organisation failed after the auth
     * account was created, so remove the
     * incomplete account.
     */
    await supabase.auth.admin.deleteUser(
      authData.user.id
    );

    throw new Error(
      organisationError?.message ||
        "Failed to create organisation."
    );
  }

  /*
   * ---------------------------------------------
   * LINK PENDING REGISTRATION
   * ---------------------------------------------
   */

  const {
    error: pendingLinkError,
  } = await supabase
    .from("pending_registrations")
    .update({
      user_id:
        authData.user.id,

      organisation_id:
        organisation.id,
    })
    .eq(
      "id",
      registrationId
    );

  if (pendingLinkError) {
    console.error(
      "Could not link pending registration:",
      pendingLinkError
    );
  }

  /*
   * ---------------------------------------------
   * OWNER MEMBERSHIP
   * ---------------------------------------------
   */

  const {
    error: memberError,
  } = await supabase
    .from("organisation_members")
    .insert({
      organisation_id:
        organisation.id,

      user_id:
        authData.user.id,

      role: "owner",
    });

  if (memberError) {
    await supabase.auth.admin.deleteUser(
      authData.user.id
    );

    throw new Error(
      memberError.message
    );
  }

  /*
   * ---------------------------------------------
   * UPDATE PROFILE
   * ---------------------------------------------
   *
   * Your auth trigger already creates the profile.
   */

  const {
    error: profileError,
  } = await supabase
    .from("profiles")
    .update({
      email:
        registration.email,

      full_name:
        registration.full_name,

      job_title:
        registration.job_title,

      organisation_id:
        organisation.id,

      role: "owner",
    })
    .eq(
      "id",
      authData.user.id
    );

  if (profileError) {
    await supabase.auth.admin.deleteUser(
      authData.user.id
    );

    throw new Error(
      profileError.message
    );
  }

  /*
   * ---------------------------------------------
   * STORE STRIPE SUBSCRIPTION
   * ---------------------------------------------
   */

  const {
    error: subscriptionError,
  } = await supabase
    .from("subscriptions")
    .insert({
      organisation_id:
        organisation.id,

      stripe_customer_id:
        session?.stripe_customer_id ??
        null,

      stripe_subscription_id:
        session?.stripe_subscription_id ??
        null,

      status: "active",
    });

  if (subscriptionError) {
    await supabase.auth.admin.deleteUser(
      authData.user.id
    );

    throw new Error(
      subscriptionError.message
    );
  }

  /*
   * ---------------------------------------------
   * MARK REGISTRATION COMPLETE
   * ---------------------------------------------
   */

  const {
    error: completeError,
  } = await supabase
    .from("pending_registrations")
    .update({
      completed: true,
      encrypted_password: null,
    })
    .eq(
      "id",
      registrationId
    );

  if (completeError) {
    throw new Error(
      completeError.message
    );
  }

  console.log(
    "Registration completed:",
    {
      userId:
        authData.user.id,

      organisationId:
        organisation.id,

      subscriptionTier,
    }
  );

  return {
    userId:
      authData.user.id,

    organisationId:
      organisation.id,

    recoveryLink: null,
  };
}