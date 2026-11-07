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
      is_active,
      price_pence,
      payment_requirement,
      deposit_type,
      deposit_value,
      payment_policy
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

  // Load public services independently. Existing single-service pages still work.
  const { data: services, error: servicesError } = await supabase
    .from("booking_services")
    .select("id,name,description,duration_minutes,price_pence,payment_rule,deposit_value,sort_order")
    .eq("booking_page_id", bookingPage.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (servicesError) console.error("BOOKING SERVICES LOAD ERROR:", servicesError);

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
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0F3D32]/15 text-xl font-bold text-[#6B705C]">
                  {ownerData.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "T"}
                </div>
              )}

              {/* TITLE */}

              <div className="min-w-0">

                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#0F3D32]">
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

            {(bookingPage.price_pence > 0 || bookingPage.payment_policy) && (
              <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                {bookingPage.price_pence > 0 && <p className="font-semibold text-[#183E31]">Appointment price: £{(bookingPage.price_pence / 100).toFixed(2)}</p>}
                {bookingPage.payment_policy && <p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">{bookingPage.payment_policy}</p>}
                <p className="mt-2 text-xs text-stone-500">{bookingPage.payment_requirement === "none" ? "No payment is required to book." : "A secure payment may be required before confirmation."}</p>
              </div>
            )}
            <BookingClient
              bookingPage={bookingPage}
              services={services || []}
              servicesLoadFailed={Boolean(servicesError)}
              owner={ownerData}
            />

          </div>
        </div>

        {/* ============================================
            FOOTER
        ============================================ */}

        <div className="mt-6 text-center">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
            Booking powered by ORBI.
          </p>

        </div>
      </div>
    </main>
  );
}