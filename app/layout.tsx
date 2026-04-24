// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Remove 'h-screen' here if you have it! 
          Let the nested layouts manage their own height. */}
      <body className="antialiased bg-stone-50">
        {children}
      </body>
    </html>
  );
}