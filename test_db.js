import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://layonfapjyiupkjdswbj.supabase.co/";
const supabaseAnonKey = "sb_publishable_60EgFkAFmczfEjOySTOBQQ_QYKGosa_";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function test() {
  const { data: projects } = await supabase.from('projects').select('project_code, project_name');
  const { data: latest } = await supabase.from('v_employee_latest_project').select('emp_id, name, current_project');
  
  console.log(`Total latest employees: ${latest.length}`);
  
  let matchedCount = 0;
  let unmatched = [];
  
  for (const item of latest) {
    const cp = item.current_project;
    if (!cp || cp === 'No Project Assigned') continue;
    
    const normCp = normalize(cp);
    
    // Attempt match
    const match = projects.find(p => {
      const normCode = normalize(p.project_code);
      const normName = normalize(p.project_name);
      return normCode.includes(normCp) || normCp.includes(normCode) ||
             normName.includes(normCp) || normCp.includes(normName);
    });
    
    if (match) {
      matchedCount++;
    } else {
      unmatched.push(cp);
    }
  }
  
  console.log(`Matched with normalization: ${matchedCount}`);
  console.log(`Unmatched unique values:`, [...new Set(unmatched)]);
}
test();
