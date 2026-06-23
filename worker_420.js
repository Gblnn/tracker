const SUPABASE_URL = 'https://layonfapjyiupkjdswbj.supabase.co/';
const SUPABASE_SERVICE_KEY = 'sb_secret_79rVcwFLYzk18UrQXJwjig_HLSuhhYY';

// Cache for last seen updates to throttle requests (at most once every 60 seconds)
const lastSeenCache = new Map();

// Helper to update last_seen timestamp in the devices table with throttling
function performDeviceHeartbeat(sn, ctx) {
  if (!sn || sn === 'UNKNOWN') return;

  const now = Date.now();
  const lastUpdated = lastSeenCache.get(sn) || 0;

  // Only update Supabase if the last update was more than 60 seconds ago
  if (now - lastUpdated < 60000) {
    return;
  }

  // Update cache immediately to prevent concurrent requests from triggering writes
  lastSeenCache.set(sn, now);

  const promise = (async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/devices?serial_no=eq.${encodeURIComponent(sn)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          last_seen: new Date().toISOString()
        })
      });
      if (!response.ok) {
        console.error('Supabase heartbeat PATCH failed:', await response.text());
        // Clear cache entry on failure so we can retry on next request
        lastSeenCache.delete(sn);
      }
    } catch (err) {
      console.error('Failed to update device heartbeat:', err);
      // Clear cache entry on failure so we can retry
      lastSeenCache.delete(sn);
    }
  })();

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(promise);
  }
}


async function insertPunches(punches) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/punches`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(punches)
  });
  return response;
}

// Helper to parse tab-separated parameter strings (e.g. PIN=123\tName=John)
function parseTabParams(line) {
  const params = {};
  const parts = line.split('\t');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx !== -1) {
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      params[key] = val;
    }
  }
  return params;
}

// Helper to parse query parameter strings that could be tab or ampersand separated
function parseParameters(str) {
  const params = {};
  let parts = str.split('\t');
  if (parts.length <= 1) {
    parts = str.split('&');
  }
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx !== -1) {
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      params[key] = val;
    }
  }
  return params;
}

// Helper to patch multiple commands status
async function patchCommands(ids, updates) {
  if (!ids || ids.length === 0) return false;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=in.(${ids.join(',')})`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updates)
    });
    return response.ok;
  } catch (err) {
    console.error('Failed to patch commands:', err);
    return false;
  }
}

// Helper to patch single command status
async function updateSingleCommand(id, updates) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updates)
    });
    return response.ok;
  } catch (err) {
    console.error('Failed to update single command:', err);
    return false;
  }
}

// Helper to retrieve other device serial numbers
async function getOtherDevices(sn) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/devices?serial_no=neq.${encodeURIComponent(sn)}&select=serial_no`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    if (res.ok) {
      const devices = await res.json();
      return devices.map(d => d.serial_no);
    }
  } catch (err) {
    console.error('Error fetching other devices:', err);
  }
  return [];
}

// Helper to retrieve command by ID
async function getCommandById(id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${id}&select=command_type`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    if (res.ok) {
      const cmds = await res.json();
      if (cmds && cmds.length > 0) return cmds[0];
    }
  } catch (err) {
    console.error('Error fetching command by ID:', err);
  }
  return null;
}

// Helper to insert commands
async function insertDeviceCommands(commands) {
  if (!commands || commands.length === 0) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/device_commands`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(commands)
    });
    if (!res.ok) {
      console.error('Failed to insert commands:', await res.text());
    }
  } catch (err) {
    console.error('Error inserting commands:', err);
  }
}

// Helper to search employee ID by device user ID
async function findEmployeeId(pin) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?device_user_id=eq.${encodeURIComponent(pin)}&select=id`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    if (res.ok) {
      const emps = await res.json();
      if (emps && emps.length > 0) return emps[0].id;
    }
  } catch (err) {
    console.error('Error finding employee id:', err);
  }
  return null;
}

// Helper to upsert employee details
async function upsertEmployee(pin, name) {
  try {
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?device_user_id=eq.${encodeURIComponent(pin)}&select=id,name`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    if (getRes.ok) {
      const emps = await getRes.json();
      if (emps && emps.length > 0) {
        const emp = emps[0];
        if (emp.name !== name) {
          await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${emp.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
          });
        }
        return emp.id;
      } else {
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            device_user_id: pin,
            name: name,
            emp_type: 'staff'
          })
        });
        if (insertRes.ok) {
          const data = await insertRes.json();
          if (data && data.length > 0) return data[0].id;
        }
      }
    }
  } catch (err) {
    console.error('Error upserting employee:', err);
  }
  return null;
}

// Async logic to process and propagate USERINFO to other devices
async function handleUserInfoUpload(body, sn) {
  const lines = body.split('\n').filter(l => l.trim());
  const otherDevices = await getOtherDevices(sn);
  if (otherDevices.length === 0) return;

  const commands = [];
  for (const line of lines) {
    const params = parseTabParams(line);
    const pin = params.PIN || params.Pin || params.pin;
    const name = params.Name || params.name;
    if (!pin || !name) continue;

    const employeeDbId = await upsertEmployee(pin, name);

    for (const otherSn of otherDevices) {
      commands.push({
        device_serial: otherSn,
        command: `DATA UPDATE USERINFO PIN=${pin}\tName=${name}\tPri=${params.Pri || 0}\tPasswd=${params.Passwd || ''}\tCard=${params.Card || ''}\tGrp=${params.Grp || 1}\tTZ=${params.TZ || '0000000100000000'}`,
        command_type: 'ADD_USER',
        employee_id: employeeDbId,
        status: 'pending'
      });
    }
  }
  await insertDeviceCommands(commands);
}

// Helper to get employee's existing biometrics JSON data
async function getEmployeeBiometrics(id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${id}&select=fingerprint_templates,face_templates`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) return data[0];
    }
  } catch (err) {
    console.error('Error fetching employee biometrics:', err);
  }
  return null;
}

// Helper to patch employee's biometrics JSON data
async function updateEmployeeBiometrics(id, updates) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      console.error('Failed to update employee biometrics:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Error updating employee biometrics:', err);
  }
}

// Async logic to process and propagate TEMPLATE (fingerprint) to other devices
async function handleTemplateUpload(body, sn) {
  console.log(`Received TEMPLATE/FINGERTMP upload from SN ${sn}. Length: ${body.length}`);
  const lines = body.split('\n').filter(l => l.trim());
  const otherDevices = await getOtherDevices(sn);

  const commands = [];
  for (const line of lines) {
    const params = parseTabParams(line);
    const pin = params.PIN || params.Pin || params.pin;
    const tmp = params.TMP || params.Tmp || params.tmp;
    if (!pin || !tmp) {
      console.log(`Skipping template line due to missing PIN or TMP. Line: ${line}`);
      continue;
    }

    const employeeDbId = await findEmployeeId(pin);
    if (!employeeDbId) {
      console.log(`Employee not found for PIN/Pin: ${pin} in database.`);
      continue;
    }

    console.log(`Saving fingerprint template for Employee ID ${employeeDbId} (PIN: ${pin}), FID: ${params.FID || '0'}`);
    // Persist fingerprint template in employees table
    const empBiometrics = await getEmployeeBiometrics(employeeDbId);
    const fingerTemplates = (empBiometrics && empBiometrics.fingerprint_templates) || {};
    const fid = params.FID || '0';
    fingerTemplates[fid] = {
      template: tmp,
      size: parseInt(params.Size) || 0,
      valid: parseInt(params.Valid) || 1
    };
    await updateEmployeeBiometrics(employeeDbId, { fingerprint_templates: fingerTemplates });
    console.log(`Successfully updated fingerprint template in employees table for Employee ID ${employeeDbId}.`);

    // Propagate command to other devices if any exist
    if (otherDevices.length > 0) {
      for (const otherSn of otherDevices) {
        commands.push({
          device_serial: otherSn,
          command: `DATA UPDATE FINGERTMP PIN=${pin}\tFID=${fid}\tSize=${params.Size || 0}\tValid=${params.Valid || 1}\tTMP=${tmp}`,
          command_type: 'UPDATE_FINGERTMP',
          employee_id: employeeDbId,
          status: 'pending'
        });
      }
    }
  }
  if (commands.length > 0) {
    await insertDeviceCommands(commands);
  }
}

// Async logic to process and propagate BIODATA (newer biometrics/face) to other devices
async function handleBiodataUpload(body, sn) {
  console.log(`Received BIODATA upload from SN ${sn}. Length: ${body.length}`);
  const lines = body.split('\n').filter(l => l.trim());
  const otherDevices = await getOtherDevices(sn);

  const commands = [];
  for (const line of lines) {
    const params = parseTabParams(line);
    const pin = params.PIN || params.Pin || params.pin;
    const tmp = params.TMP || params.Tmp || params.tmp;
    if (!pin || !tmp) {
      console.log(`Skipping biodata line due to missing PIN or TMP. Line: ${line}`);
      continue;
    }

    const employeeDbId = await findEmployeeId(pin);
    if (!employeeDbId) {
      console.log(`Employee not found for PIN/Pin: ${pin} in database.`);
      continue;
    }

    console.log(`Saving face template for Employee ID ${employeeDbId} (PIN: ${pin}), Type: ${params.Type || '9'}`);
    // Persist face template in employees table
    const empBiometrics = await getEmployeeBiometrics(employeeDbId);
    const faceTemplates = (empBiometrics && empBiometrics.face_templates) || {};
    const type = params.Type || '9';
    const no = params.No || '0';
    const key = `${type}-${no}`;
    faceTemplates[key] = {
      template: tmp,
      index: parseInt(params.Index) || 0,
      format: parseInt(params.Format) || 0,
      major_ver: parseInt(params.MajorVer) || 10,
      minor_ver: parseInt(params.MinorVer) || 0
    };
    await updateEmployeeBiometrics(employeeDbId, { face_templates: faceTemplates });
    console.log(`Successfully updated face template in employees table for Employee ID ${employeeDbId}.`);

    // Propagate command to other devices if any exist
    if (otherDevices.length > 0) {
      for (const otherSn of otherDevices) {
        commands.push({
          device_serial: otherSn,
          command: `DATA UPDATE BIODATA Pin=${pin}\tType=${params.Type || 9}\tNo=${params.No || 0}\tIndex=${params.Index || 0}\tFormat=${params.Format || 0}\tMajorVer=${params.MajorVer || 10}\tMinorVer=${params.MinorVer || 0}\tTmp=${tmp}`,
          command_type: 'UPDATE_BIODATA',
          employee_id: employeeDbId,
          status: 'pending'
        });
      }
    }
  }
  if (commands.length > 0) {
    await insertDeviceCommands(commands);
  }
}

// Async logic to process and propagate FACE (older biometrics/face) to other devices
async function handleFaceUpload(body, sn) {
  console.log(`Received FACE upload from SN ${sn}. Length: ${body.length}`);
  const lines = body.split('\n').filter(l => l.trim());
  const otherDevices = await getOtherDevices(sn);

  const commands = [];
  for (const line of lines) {
    const params = parseTabParams(line);
    const pin = params.PIN || params.Pin || params.pin;
    const tmp = params.TMP || params.Template || params.Tmp || params.tmp;
    if (!pin || !tmp) {
      console.log(`Skipping face line due to missing PIN or TMP/Template. Line: ${line}`);
      continue;
    }

    const employeeDbId = await findEmployeeId(pin);
    if (!employeeDbId) {
      console.log(`Employee not found for PIN/Pin: ${pin} in database.`);
      continue;
    }

    const fid = params.FID || params.Fid || params.fid || '0';
    console.log(`Saving face template for Employee ID ${employeeDbId} (PIN: ${pin}), FID: ${fid}`);

    // Persist face template in employees table
    const empBiometrics = await getEmployeeBiometrics(employeeDbId);
    const faceTemplates = (empBiometrics && empBiometrics.face_templates) || {};

    const key = `face-${fid}`;
    faceTemplates[key] = {
      template: tmp,
      size: parseInt(params.Size) || tmp.length,
      valid: parseInt(params.Valid || params.Active) || 1
    };

    await updateEmployeeBiometrics(employeeDbId, { face_templates: faceTemplates });
    console.log(`Successfully updated face template in employees table for Employee ID ${employeeDbId}.`);

    // Propagate command to other devices if any exist
    if (otherDevices.length > 0) {
      for (const otherSn of otherDevices) {
        commands.push({
          device_serial: otherSn,
          command: `DATA UPDATE FACE PIN=${pin}\tFID=${fid}\tSize=${params.Size || tmp.length}\tValid=${params.Valid || params.Active || 1}\tTMP=${tmp}`,
          command_type: 'UPDATE_FACE',
          employee_id: employeeDbId,
          status: 'pending'
        });
      }
    }
  }
  if (commands.length > 0) {
    await insertDeviceCommands(commands);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    // Retrieve SN case-insensitively using standard, safe get() calls
    const sn = url.searchParams.get('SN') || url.searchParams.get('sn') || 'UNKNOWN';

    // GET /iclock/getrequest — command polling from device
    if (path === '/iclock/getrequest' || path === '/iclock/getrequest.aspx') {
      performDeviceHeartbeat(sn, ctx);

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?device_serial=eq.${encodeURIComponent(sn)}&status=eq.pending&order=id.asc&limit=10`, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        });
        if (response.ok) {
          const commands = await response.json();
          if (commands && commands.length > 0) {
            const ids = commands.map(c => c.id);
            await patchCommands(ids, {
              status: 'sent',
              sent_at: new Date().toISOString()
            });

            const formatted = commands.map(c => {
              let cmdText = c.command;
              if (cmdText.startsWith('C:')) {
                const parts = cmdText.split(':');
                if (parts.length >= 3) {
                  parts[1] = c.id.toString();
                  cmdText = parts.join(':');
                }
              } else {
                cmdText = `C:${c.id}:${cmdText}`;
              }
              return cmdText;
            }).join('\n');

            return new Response(formatted, {
              status: 200,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching pending commands:', err);
      }

      return new Response('OK', { status: 200 });
    }

    // POST /iclock/devicecmd — command execution acknowledgment
    if (
      (path === '/iclock/devicecmd' || path === '/iclock/devicecmd.aspx')
      && request.method === 'POST'
    ) {
      performDeviceHeartbeat(sn, ctx);

      try {
        const body = await request.text();
        console.log(`POST /iclock/devicecmd from SN ${sn}. Body length: ${body.length}. Content:\n${body}`);
        const lines = body.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const firstLineParams = parseParameters(lines[0].trim());
          const id = firstLineParams.ID || firstLineParams.id;
          const returnVal = firstLineParams.Return || firstLineParams.return;

          if (id) {
            const status = returnVal === '0' ? 'acknowledged' : 'error';
            await updateSingleCommand(id, {
              status: status,
              acknowledged_at: new Date().toISOString()
            });

            // If the command succeeded and there are data lines following, process them!
            if (returnVal === '0' && lines.length > 1) {
              const dataLines = lines.slice(1).join('\n');
              const cmd = await getCommandById(id);
              if (cmd) {
                const cmdType = cmd.command_type;
                console.log(`Command ${id} is of type ${cmdType}. Parsing ${lines.length - 1} data lines.`);
                if (cmdType === 'QUERY_USERINFO') {
                  if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(handleUserInfoUpload(dataLines, sn));
                  } else {
                    await handleUserInfoUpload(dataLines, sn);
                  }
                } else if (cmdType === 'QUERY_FINGERTMP') {
                  if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(handleTemplateUpload(dataLines, sn));
                  } else {
                    await handleTemplateUpload(dataLines, sn);
                  }
                } else if (cmdType === 'QUERY_BIODATA') {
                  if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(handleBiodataUpload(dataLines, sn));
                  } else {
                    await handleBiodataUpload(dataLines, sn);
                  }
                } else if (cmdType === 'QUERY_FACE') {
                  if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(handleFaceUpload(dataLines, sn));
                  } else {
                    await handleFaceUpload(dataLines, sn);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error processing devicecmd:', err);
      }

      return new Response('OK', { status: 200 });
    }

    // GET /iclock/cdata — handshake
    if (
      (path === '/iclock/cdata' || path === '/iclock/cdata.aspx')
      && request.method === 'GET'
    ) {
      performDeviceHeartbeat(sn, ctx);

      const body = [
        `GET OPTION FROM: ${sn}`,
        `ATT,Stamp=0`,
        `ErrorDelay=30`,
        `Delay=10`,
        `TransFlag=TransData AttLog OpLog AttPhoto EnrollUser ChgUser EnrollFP ChgFP UserPic`,
        `TimeZone=4`,
        `ServerVer=2.4.1 2015-04-27`,
        `PushProtVer=2.4.1`,
        `PushOptionsFlag=1`,
      ].join('\n');

      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // POST /iclock/cdata — data upload from device
    if (
      (path === '/iclock/cdata' || path === '/iclock/cdata.aspx')
      && request.method === 'POST'
    ) {
      performDeviceHeartbeat(sn, ctx);

      const table = url.searchParams.get('table');
      const body = await request.text();
      console.log(`POST /iclock/cdata from SN ${sn}, table: ${table}. Body length: ${body.length}`);

      // Handle standard attendance punches
      if (!table || table === 'ATTLOG') {
        const lines = body.split('\n').filter(l => l.trim());
        const punches = [];

        for (const line of lines) {
          if (line.startsWith('PUSH') || line.startsWith('ATTLOG')) continue;

          const parts = line.trim().split('\t');
          if (parts.length < 3) continue;

          const userId = parts[0].trim();
          const datetime = parts[1].trim();
          const verify = parts[2].trim();
          const punchType = parts[3] ? parts[3].trim() : '0';

          if (!userId || !datetime) continue;

          punches.push({
            user_id: userId,
            punch_time: new Date(`${datetime}+04:00`).toISOString(),
            verify_type: parseInt(punchType) || 0,
            punch_type: parseInt(verify) || 0,
            device_serial: sn,
            raw: line.trim()
          });
        }

        if (punches.length > 0) {
          const result = await insertPunches(punches);
          if (!result.ok) {
            const error = await result.text();
            console.error('Supabase error inserting punches:', error);
            return new Response('ERROR', { status: 500 });
          }
          console.log(`Inserted ${punches.length} punches from ${sn}`);
        }
      }

      // Handle USERINFO upload (triggers employee upsert and command sync)
      else if (table === 'USERINFO') {
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(handleUserInfoUpload(body, sn));
        } else {
          await handleUserInfoUpload(body, sn);
        }
      }

      // Handle TEMPLATE (fingerprint) upload (triggers command sync)
      else if (table === 'TEMPLATE' || table === 'FINGERTMP') {
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(handleTemplateUpload(body, sn));
        } else {
          await handleTemplateUpload(body, sn);
        }
      }

      // Handle BIODATA (newer biometrics/face) upload (triggers command sync)
      else if (table === 'BIODATA') {
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(handleBiodataUpload(body, sn));
        } else {
          await handleBiodataUpload(body, sn);
        }
      }

      // Handle FACE (older biometrics/face) upload (triggers command sync)
      else if (table === 'FACE') {
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(handleFaceUpload(body, sn));
        } else {
          await handleFaceUpload(body, sn);
        }
      }

      return new Response('OK', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }
};
