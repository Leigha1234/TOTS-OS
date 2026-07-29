export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-stone-50">
      {children}
    </main>
  );
}