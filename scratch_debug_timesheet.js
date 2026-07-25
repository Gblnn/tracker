import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://layonfapjyiupkjdswbj.supabase.co/";
const supabaseAnonKey = "sb_publishable_60EgFkAFmczfEjOySTOBQQ_QYKGosa_";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('timesheet').select('*').limit(1);
  if (error) {
    console.error('Error fetching sample timesheet:', error);
  } else {
    console.log('Sample timesheet record keys:', data.length > 0 ? Object.keys(data[0]) : 'No records found');
    console.log('Sample record:', data[0]);
  }
}

check();
