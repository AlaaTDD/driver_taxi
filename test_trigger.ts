import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const driverId = 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb';
  
  // Get current wallet balance
  const { data: w1 } = await supabase.from('driver_wallets').select('balance').eq('driver_id', driverId).single();
  console.log("Balance before:", w1);

  // Update the transaction status from pending to failed
  // First get the transaction id
  const { data: txs } = await supabase.from('wallet_transactions').select('id, amount').eq('reference_id', '128c9474-bc6b-4a61-aff7-08577a8d5152').eq('type', 'withdrawal');
  
  if (txs && txs.length > 0) {
    const txId = txs[0].id;
    console.log("Updating TX:", txId);
    await supabase.from('wallet_transactions').update({ status: 'failed' }).eq('id', txId);
    
    // Get new wallet balance
    const { data: w2 } = await supabase.from('driver_wallets').select('balance').eq('driver_id', driverId).single();
    console.log("Balance after failed:", w2);
    
    // Restore it back to pending
    await supabase.from('wallet_transactions').update({ status: 'pending' }).eq('id', txId);
    const { data: w3 } = await supabase.from('driver_wallets').select('balance').eq('driver_id', driverId).single();
    console.log("Balance restored:", w3);
  }
}
main();
