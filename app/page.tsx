// app/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase'; 

export default async function Page() {
  const supabase = createClient(); // Remove the 'await' here
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login'); 
  }

  redirect('/dashboard'); 
}