import { createFileRoute } from '@tanstack/react-router';
import { handleSupabaseProxy } from '@/lib/supabase-proxy.server';

async function handle({ request }: { request: Request }) {
  return handleSupabaseProxy(request);
}

export const Route = createFileRoute('/api/supabase-proxy/$')({
  server: { handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle, OPTIONS: handle } },
});
