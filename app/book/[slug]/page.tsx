import { notFound } from "next/navigation";
import BookingClient from "./BookingClient";
import { createClient } from "@/lib/auth";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BookingPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  // ==================================================
  // LOAD BOOKING PAGE
  // ==================================================

  const {
    data: bookingPage,
    error: bookingPageError,
  } = await supabase
    .from("booking_pages")
    .select(`
      id,
      user_id,
      organisation_id,
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

  if (
    bookingPageError ||
    !bookingPage
  ) {
    console.error(
      "BOOKING PAGE LOAD ERROR:",
      bookingPageError
    );

    notFound();
  }

  // ==================================================
  // LOAD BOOKING PAGE OWNER
  // ==================================================

  const {
    data: owner,
    error: ownerError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      avatar_url
    `)
    .eq("id", bookingPage.user_id)
    .maybeSingle();

  if (ownerError) {
    console.error(
      "BOOKING OWNER LOAD ERROR:",
      ownerError
    );
  }

  // ==================================================
  // SAFE OWNER DATA
  // ==================================================

  const ownerData = {
    id: bookingPage.user_id,
    full_name:
      owner?.full_name || null,
    email:
      owner?.email || null,
    avatar_url:
      owner?.avatar_url || null,
  };

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-[#F9F9F7] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">

        {/* ============================================
            BOOKING CARD
        ============================================ */}

        <div className="overflow-hidden rounded-[2rem] border border-stone-100 bg-white shadow-[0_40px_100px_-40px_rgba(0,0,0,0.15)] sm:rounded-[3rem]">

          {/* ==========================================
              HEADER
          ========================================== */}

          <div className="border-b border-stone-100 px-6 py-8 sm:px-10 sm:py-10 lg:px-12">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              {/* OWNER AVATAR */}

              {ownerData.avatar_url ? (
                <img
                  src={ownerData.avatar_url}
                  alt={
                    ownerData.full_name ||
                    "Booking page owner"
                  }
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-stone-100"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#A3B18A]/15 text-xl font-bold text-[#6B705C]">
                  {ownerData.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "T"}
                </div>
              )}

              {/* TITLE */}

              <div className="min-w-0">

                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#A3B18A]">
                  Online Booking
                </p>

                <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                  {bookingPage.title}
                </h1>

                {ownerData.full_name && (
                  <p className="mt-2 text-sm text-stone-400">
                    With{" "}
                    <span className="font-semibold text-stone-600">
                      {ownerData.full_name}
                    </span>
                  </p>
                )}

              </div>
            </div>
          </div>

          {/* ==========================================
              DESCRIPTION
          ========================================== */}

          {bookingPage.description && (
            <div className="border-b border-stone-100 px-6 py-6 sm:px-10 lg:px-12">
              <p className="max-w-3xl text-sm leading-7 text-stone-500">
                {bookingPage.description}
              </p>
            </div>
          )}

          {/* ==========================================
              BOOKING INTERFACE
          ========================================== */}

          <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12">

            <BookingClient
              bookingPage={bookingPage}
              owner={ownerData}
            />

          </div>
        </div>

        {/* ============================================
            FOOTER
        ============================================ */}

        <div className="mt-6 text-center">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
            Booking powered by TOTS-OS
          </p>

        </div>
      </div>
    </main>
  );
}