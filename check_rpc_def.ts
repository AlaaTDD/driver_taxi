import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('approve_withdrawal', {
    p_withdrawal_id: '00000000-0000-0000-0000-000000000000',
    p_admin_id: '00000000-0000-0000-0000-000000000000'
  });
  console.log("RPC Check:", { data, error });

  // Also let's try to query a withdrawal request to see if there are any
  const { data: requests } = await supabase.from('withdrawal_requests').select('*').limit(1);
  console.log("Withdrawal Request:", requests);
}
main();
