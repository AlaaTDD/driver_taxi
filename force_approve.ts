import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('withdrawal_requests').update({ status: 'approved', admin_id: 'cccccccc-0001-0001-0001-cccccccccccc' }).eq('id', '128c9474-bc6b-4a61-aff7-08577a8d5152').select();
  console.log("Forced Approve:", { data, error });
}
main();
