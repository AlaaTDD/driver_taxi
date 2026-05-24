import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log("Testing insert into complaints with status='open'...");
  const { data: user } = await supabase.from('users').select('id').limit(1).single();
  if (!user) return console.log("No users found");
  
  const { data: comp, error: err1 } = await supabase.from('complaints').insert({
    user_id: user.id,
    title: 'Test',
    description: 'Test desc',
    status: 'open'
  }).select('id').single();
  
  if (err1) {
    console.log("Error inserting complaint (open):", err1);
    console.log("Testing with status='pending'...");
    const { error: err2 } = await supabase.from('complaints').insert({
      user_id: user.id,
      title: 'Test',
      description: 'Test desc',
      status: 'pending'
    });
    console.log("Error inserting complaint (pending):", err2);
  } else {
    console.log("Success inserting complaint:", comp.id);
    console.log("Testing insert into complaint_replies...");
    const { error: err3 } = await supabase.from('complaint_replies').insert({
      complaint_id: comp.id,
      sender_type: 'user',
      sender_id: user.id,
      message: 'Test reply'
    });
    console.log("Error inserting reply:", err3);
  }
}
test();
