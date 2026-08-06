import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://layonfapjyiupkjdswbj.supabase.co/";
const supabaseAnonKey = "sb_publishable_60EgFkAFmczfEjOySTOBQQ_QYKGosa_";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const parseLocationGeofence = (locStr) => {
  try {
    return JSON.parse(locStr);
  } catch {
    return { name: locStr || '' };
  }
};

const parsePunchLocation = (locStr, fallback) => {
  return { location: locStr || fallback || '—' };
};

const findProjectCode = (currentProject, projectList) => {
  if (!currentProject || currentProject === 'No Project Assigned') return '';

  const normCp = normalizeString(currentProject);
  let bestMatch = null;
  let bestScore = 0;

  for (const p of projectList) {
    const normCode = normalizeString(p.project_code);
    const normName = normalizeString(p.project_name);
    const normLoc = p.project_location ? normalizeString(parseLocationGeofence(p.project_location).name) : '';

    let score = 0;

    if (normCode === normCp || normName === normCp || (normLoc && normLoc === normCp)) {
      score = 100;
    } else {
      const cpTokens = currentProject.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const codeTokens = p.project_code.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const nameTokens = p.project_name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const locTokens = p.project_location ? parseLocationGeofence(p.project_location).name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean) : [];

      const hasCodeToken = codeTokens.length > 0 && codeTokens.every(t => cpTokens.includes(t));
      const hasNameToken = nameTokens.length > 0 && nameTokens.every(t => cpTokens.includes(t));
      const hasLocToken = locTokens.length > 0 && locTokens.every(t => cpTokens.includes(t));

      if (hasCodeToken || hasNameToken || hasLocToken) {
        score = 80;
      } else {
        const isCodeMatch = normCode.includes(normCp) || normCp.includes(normCode);
        const isNameMatch = normName.includes(normCp) || normCp.includes(normName);
        const isLocMatch = normLoc && (normLoc.includes(normCp) || normCp.includes(normLoc));

        if (isCodeMatch || isNameMatch || isLocMatch) {
          let isTooShort = false;
          if (isCodeMatch && normCode.length < 3) isTooShort = true;
          if (isNameMatch && normName.length < 3) isTooShort = true;
          if (isLocMatch && normLoc.length < 3) isTooShort = true;
          if (!isTooShort) score = 50;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = p;
    }
  }

  return bestMatch ? bestMatch.project_code : '';
};

async function check() {
  const date = '2026-08-05';
  
  const [
    { data: empData },
    { data: projData },
    { data: latestProjData },
    { data: transfersData }
  ] = await Promise.all([
    supabase.from('employees').select('id, device_user_id, name, department, emp_id, emp_type').or('status.ilike.active,status.is.null'),
    supabase.from('projects').select('project_code, project_name, project_location'),
    supabase.from('v_employee_latest_project').select('emp_id, current_project'),
    supabase.from('transfers').select('emp_id, transfer_date, from_project, to_project, created_at').order('transfer_date', { ascending: false })
  ]);

  const assignedProjMap = {};
  if (latestProjData) {
    latestProjData.forEach(item => {
      if (item.emp_id && item.current_project) {
        let activeProjectName = item.current_project;

        if (transfersData) {
          const matchedEmp = (empData || []).find(e => e.emp_id === item.emp_id || String(e.id) === item.emp_id);
          if (matchedEmp) {
            const empTransfers = transfersData
              .filter(t => t.emp_id === matchedEmp.emp_id || String(t.emp_id) === String(matchedEmp.id))
              .sort((a, b) => {
                const dateA = a.transfer_date ? a.transfer_date.slice(0, 10) : '';
                const dateB = b.transfer_date ? b.transfer_date.slice(0, 10) : '';
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                return (a.created_at || '').localeCompare(b.created_at || '');
              });

            if (empTransfers.length > 0) {
              const queryDateStr = date;
              let lastEffectiveTransfer = null;
              for (const t of empTransfers) {
                const tDateStr = t.transfer_date ? t.transfer_date.slice(0, 10) : '';
                if (tDateStr <= queryDateStr) {
                  lastEffectiveTransfer = t;
                }
              }

              if (lastEffectiveTransfer) {
                activeProjectName = lastEffectiveTransfer.to_project;
              } else {
                activeProjectName = empTransfers[0].from_project;
              }
            }
          }
        }

        assignedProjMap[item.emp_id] = findProjectCode(activeProjectName, projData || []);
      }
    });
  }

  console.log("Assigned project for SS0611 (Amit Kumar Gautam):", assignedProjMap['SS0611']);
}

check();
