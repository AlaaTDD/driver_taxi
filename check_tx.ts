import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: txs } = await supabase.from('transactions').select('*').eq('driver_id', 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb').order('created_at', { ascending: false }).limit(5);
  console.log("Recent TXs:", txs);

  const { data: wallet } = await supabase.from('driver_wallets').select('*').eq('driver_id', 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb');
  console.log("Wallet:", wallet);
}
main();
