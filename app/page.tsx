// app/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default async function Page() {
  // Ensure you are awaiting the client initialization to resolve cookies
  const supabase = await createClient(); 
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  redirect('/dashboard');
}