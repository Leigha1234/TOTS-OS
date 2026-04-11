import Sidebar from "../components/Sidebar"; // Double check this path matches your project

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar stays fixed for every page inside the (dashboard) group */}
      <Sidebar />
      
      {/* This 'main' area is where your Dashboard or CRM page content will load */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}