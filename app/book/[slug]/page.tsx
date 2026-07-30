
import { notFound } from "next/navigation";
import BookingClient from "./BookingClient";
import { createClient } from "@/lib/auth";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: bookingPage, error } = await supabase
    .from("booking_pages")
    .select(`
      id,
      user_id,
      slug,
      title,
      description,
      duration_minutes,
      location_type,
      location_value,
      video_provider,
      video_link,
      buffer_before_minutes,
      buffer_after_minutes,
      min_notice_hours,
      max_days_ahead,
      timezone,
      availability,
      is_active
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !bookingPage) {
    notFound();
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", bookingPage.user_id)
    .single();

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm md:p-10">
        <div className="mb-8 flex flex-col gap-4 border-b pb-8 md:flex-row md:items-center">
          {owner?.avatar_url && (
            <img
              src={owner.avatar_url}
              alt={owner.full_name ?? ""}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {bookingPage.title}
            </h1>
            {owner?.full_name && (
              <p className="mt-1 text-sm text-neutral-500">
                With {owner.full_name}
              </p>
            )}
          </div>
        </div>

        {bookingPage.description && (
          <p className="mb-8 max-w-2xl text-neutral-600">
            {bookingPage.description}
          </p>
        )}

        <BookingClient bookingPage={bookingPage} />
      </div>
    </main>
  );
}