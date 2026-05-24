import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey); // service role

async function main() {
  const adminId = 'cccccccc-0001-0001-0001-cccccccccccc';
  const reqId = '128c9474-bc6b-4a61-aff7-08577a8d5152'; // The request we already approved, wait, let's test reject!

  // Let's create a dummy request to test reject or approve, or just see if the RPC throws admin_only
  const { data, error } = await supabase.rpc("approve_withdrawal", {
    p_withdrawal_id: reqId,
    p_admin_id: adminId
  });

  console.log("RPC Result:", { data, error });
}
main();
