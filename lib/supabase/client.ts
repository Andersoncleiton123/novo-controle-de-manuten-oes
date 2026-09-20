import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// V1 has no login yet (see architecture notes) — RLS is open and every
// request uses the anon key, so a plain client is enough. No cookie-based
// session handling (@supabase/ssr) is needed until auth is introduced.
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
