import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'approve_withdrawal';" });
  if (error) {
    console.log("Cannot exec sql directly, fallback to trying to get the function body via postgrest.");
  } else {
    console.log(data);
  }
}
main();
