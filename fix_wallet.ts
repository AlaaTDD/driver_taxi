import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const driverId = 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb';
  
  const { data: w1 } = await supabase.from('driver_wallets').select('balance, pending_withdrawal, total_withdrawn').eq('id', driverId).single();
  console.log("Wallet before fix:", w1);

  // Check pending transactions of type withdrawal for this driver
  const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('wallet_id', driverId).eq('type', 'withdrawal').eq('status', 'pending');
  console.log("Pending TXs:", txs);

  // Get total pending from active requests
  const { data: reqs } = await supabase.from('withdrawal_requests').select('amount').eq('driver_id', driverId).eq('status', 'pending');
  const realPending = reqs ? reqs.reduce((sum, req) => sum + Number(req.amount), 0) : 0;
  console.log("Real Pending Requests Total:", realPending);

  // If real pending is less than pending_withdrawal, we need to fix the wallet
  if (w1 && realPending < Number(w1.pending_withdrawal)) {
    console.log(`Fixing pending_withdrawal from ${w1.pending_withdrawal} to ${realPending}`);
    await supabase.from('driver_wallets').update({ pending_withdrawal: realPending }).eq('id', driverId);
  }

  // Also fix pending transactions that are tied to approved/rejected requests
  if (txs) {
    for (const tx of txs) {
      if (tx.reference_type === 'withdrawal' && tx.reference_id) {
         const { data: req } = await supabase.from('withdrawal_requests').select('status').eq('id', tx.reference_id).single();
         if (req && req.status !== 'pending') {
            const newStatus = req.status === 'approved' ? 'completed' : 'failed';
            console.log(`Fixing TX ${tx.id} to ${newStatus}`);
            await supabase.from('wallet_transactions').update({ status: newStatus }).eq('id', tx.id);
            
            // If approved, update total_withdrawn
            if (req.status === 'approved' && w1) {
               await supabase.from('driver_wallets').update({ total_withdrawn: Number(w1.total_withdrawn || 0) + Math.abs(Number(tx.amount)) }).eq('id', driverId);
            }
         }
      }
    }
  }

  const { data: w2 } = await supabase.from('driver_wallets').select('balance, pending_withdrawal, total_withdrawn').eq('id', driverId).single();
  console.log("Wallet after fix:", w2);
}
main();
