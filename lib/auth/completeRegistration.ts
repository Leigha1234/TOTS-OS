import { createClient } from "@supabase/supabase-js";


import crypto from "crypto";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const encryptionKey = process.env.REGISTRATION_ENCRYPTION_KEY!;

function decryptPassword(value: string) {
  const [ivHex, encryptedHex] = value.split(":");
  const key = crypto.createHash("sha256").update(encryptionKey).digest();
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(ivHex, "hex")
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
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
  // Only runs after Stripe confirms successful payment.
  // No account, organisation, or profile is created before this point.

  const { data: registration, error: registrationError } = await supabase
    .from("pending_registrations")
    .select("*")
    .eq("id", registrationId)
    .single();

  if (registrationError || !registration) {
    throw new Error("Pending registration not found.");
  }

  if (registration.completed) {
    return {
      userId: registration.user_id ?? null,
      organisationId: registration.organisation_id ?? null,
      recoveryLink: null,
    };
  }

  if (!registration.encrypted_password) {
    throw new Error("Encrypted password missing from registration.");
  }

  const password = decryptPassword(registration.encrypted_password);

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: registration.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: registration.full_name,
        organisation_name: registration.company_name,
        registration_id: registration.id,
      },
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message || "Failed to create auth user.");
  }


  // Each paid customer gets their own organisation using their signup company name.
  const { data: organisation, error: organisationError } = await supabase
    .from("organisations")
    .insert({
      name: registration.company_name || "New Organisation",
      created_by: authData.user.id,
      available_seats: 1,
      status: "active",
      email: registration.email,
      subscription_tier: "starter",
    })
    .select()
    .single();

  if (organisationError || !organisation) {
    throw new Error(
      organisationError?.message || "Failed to create organisation."
    );
  }

  await supabase
    .from("pending_registrations")
    .update({
      user_id: authData.user.id,
      organisation_id: organisation.id,
    })
    .eq("id", registrationId);

  // Add the paid user as the owner of their organisation.
  const { error: memberError } = await supabase
    .from("organisation_members")
    .insert({
      organisation_id: organisation.id,
      user_id: authData.user.id,
      role: "owner",
    });

  if (memberError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(memberError.message);
  }

  // The auth trigger creates the profile row, so update it instead of inserting a duplicate.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      email: registration.email,
      full_name: registration.full_name,
      job_title: registration.job_title,
      organisation_id: organisation.id,
      role: "owner",
    })
    .eq("id", authData.user.id);

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  // Store the paid subscription details.
  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      organisation_id: organisation.id,
      stripe_customer_id: session?.stripe_customer_id ?? null,
      stripe_subscription_id: session?.stripe_subscription_id ?? null,
      status: "active",
    });

  if (subscriptionError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(subscriptionError.message);
  }

  // Prevent Stripe retries from creating duplicate accounts while keeping an audit record.
  const { error: completeError } = await supabase
    .from("pending_registrations")
    .update({ completed: true })
    .eq("id", registrationId);

  if (completeError) {
    throw new Error(completeError.message);
  }

  // Keep the completed registration record for audit history.

  await supabase
    .from("pending_registrations")
    .update({ encrypted_password: null })
    .eq("id", registrationId);

  return {
    userId: authData.user.id,
    organisationId: organisation.id,
    recoveryLink: null,
  };
}