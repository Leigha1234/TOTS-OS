export default function PageWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 md:p-12 space-y-10 bg-[#050505] min-h-screen text-stone-200">
      <header className="border-b border-white/5 pb-8">
        <p className="text-[#a9b897] font-black uppercase text-[10px] tracking-[0.4em] mb-2">
          System / {title}
        </p>
        <h1 className="text-5xl font-serif italic text-white tracking-tighter">
          {title}
        </h1>
      </header>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}