// app/layout.tsx
import "./globals.css"; // Ensure this path is correct

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-stone-50">
        {children}
      </body>
    </html>
  );
}